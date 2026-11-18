import {test,expect,type Page,type Route} from '@playwright/test';

const ORIGIN='http://127.0.0.1:3317';
const reader='11111111-1111-4111-8111-111111111111',author='22222222-2222-4222-8222-222222222222',admin='33333333-3333-4333-8333-333333333333';
const placeId='44444444-4444-4444-8444-444444444444';
const cors={'access-control-allow-origin':ORIGIN,'access-control-allow-headers':'authorization,content-type','access-control-allow-methods':'GET,POST,PUT,DELETE,OPTIONS'};

const post=(n:number,extra:Record<string,unknown>={})=>({
 id:`post-${n}`,author:{id:author,displayName:'An N.',avatarUrl:null},body:`Synthetic travel story ${n}`,rating:null,source:'COMMUNITY',verified:false,
 placeId:null,place:null,media:[],likeCount:n,likedByMe:null,commentCount:0,createdAt:'2026-11-12T08:00:00Z',updatedAt:'2026-11-12T08:00:00Z',...extra});
const review=post(1,{placeId,rating:4,place:{id:placeId,name:'Cầu Rồng',category:'ATTRACTION',provinceName:'Đà Nẵng'}});
const place={id:placeId,name:'Cầu Rồng',category:'ATTRACTION',address:'An Hải Trung, Sơn Trà',latitude:16.06,longitude:108.22,provinceName:'Đà Nẵng',
 rating:4.6,userRatingsTotal:1200,coverImageUrl:null,photos:[],reviews:[{authorName:'Provider reviewer',rating:5,comment:'Synthetic provider review text'}],
 distanceKm:0,estimatedTravelTimeMinutes:0};

type Handler=(route:Route,url:URL,method:string)=>Promise<void>|void;
interface Api {calls:{method:string;path:string;search:string;body:unknown;auth:string|null}[]}

async function signIn(page:Page,userId:string,role:'CUSTOMER'|'ADMIN') {
 await page.addInitScript(({userId,role})=>{
  localStorage.setItem('token',`synthetic-${role.toLowerCase()}-token`);
  localStorage.setItem('user',JSON.stringify({userId,role,fullName:'Synthetic User'}));
 },{userId,role});
}

/** Every backend call is answered here; unexpected backend paths fail loudly instead of reaching a network. */
async function mockApi(page:Page,handle:Handler):Promise<Api> {
 const api:Api={calls:[]};
 await page.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.port==='8080') {
   if(request.method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
   const raw=request.postData();
   let body:unknown=raw;
   try{body=raw?JSON.parse(raw):null;}catch{/* multipart bodies stay raw */}
   api.calls.push({method:request.method(),path:url.pathname,search:url.search,body,auth:request.headers()['authorization']??null});
   return handle(route,url,request.method());
  }
  if(url.origin!==ORIGIN)return route.abort();
  if(url.pathname==='/api/auth/session')return route.fulfill({json:null});
  return route.continue();
 });
 return api;
}

const json=(route:Route,body:unknown,status=200)=>route.fulfill({status,headers:cors,json:body});
const unexpected=(route:Route,url:URL)=>route.fulfill({status:599,headers:cors,json:{unexpected:url.pathname}});

async function noHorizontalScroll(page:Page) {
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

for(const viewport of [{name:'mobile',width:390,height:844},{name:'desktop',width:1280,height:900}]) {
 test(`anonymous feed pages without duplicates and labels community content (${viewport.name})`,async({page})=>{
  await page.setViewportSize(viewport);
  const api=await mockApi(page,(route,url)=>{
   if(url.pathname==='/api/social/posts'&&!url.searchParams.get('cursor'))return json(route,{items:[review,post(2)],nextCursor:'page-2'});
   if(url.pathname==='/api/social/posts')return json(route,{items:[post(2),post(3)],nextCursor:null});
   return unexpected(route,url);
  });
  await page.goto('/community');
  await expect(page.getByTestId('post-card')).toHaveCount(2);
  await expect(page.getByText('Cộng đồng · Chưa xác minh').first()).toBeVisible();
  await expect(page.getByRole('link',{name:/Cầu Rồng/})).toHaveAttribute('href',`/places/${placeId}`);
  await expect(page.getByText('Đánh giá của cộng đồng')).toBeVisible();
  await page.getByRole('button',{name:'Xem thêm'}).click();
  await expect(page.getByTestId('post-card')).toHaveCount(3);
  await expect(page.getByRole('button',{name:'Xem thêm'})).toHaveCount(0);
  await noHorizontalScroll(page);
  expect(api.calls.every(call=>call.auth===null)).toBe(true);
  // Dev StrictMode may load the first page twice; the feed keeps only the latest response.
  const cursors=api.calls.map(call=>new URLSearchParams(call.search).get('cursor'));
  expect([...new Set(cursors)]).toEqual([null,'page-2']);
 });
}

test('feed empty state and failure state with retry',async({page})=>{
 let failing=true;
 await mockApi(page,(route,url)=>{
  if(url.pathname!=='/api/social/posts')return unexpected(route,url);
  if(failing)return json(route,{status:503,error:'UNAVAILABLE',message:'internal detail'},503);
  return json(route,{items:[],nextCursor:null});
 });
 await page.goto('/community');
 await expect(page.getByText('Không tải được bài viết')).toBeVisible();
 await expect(page.getByText('internal detail')).toHaveCount(0);
 failing=false;
 await page.getByRole('button',{name:'Thử lại'}).click();
 await expect(page.getByText('Chưa có bài viết nào')).toBeVisible();
});

test('signed-in reader likes a post and the count comes from the server',async({page})=>{
 await signIn(page,reader,'CUSTOMER');
 const api=await mockApi(page,(route,url,method)=>{
  if(url.pathname==='/api/social/posts'&&method==='GET')return json(route,{items:[post(4,{likedByMe:false})],nextCursor:null});
  if(url.pathname==='/api/social/posts/post-4/like'&&method==='PUT')return json(route,{likeCount:5,likedByMe:true});
  return unexpected(route,url);
 });
 await page.goto('/community');
 const like=page.getByRole('button',{name:/lượt thích/});
 await expect(like).toHaveAttribute('aria-pressed','false');
 await like.click();
 await expect(like).toHaveAttribute('aria-pressed','true');
 await expect(page.getByTestId('like-count')).toHaveText('5');
 expect(api.calls.find(call=>call.method==='PUT')?.auth).toBe('Bearer synthetic-customer-token');
});

for(const viewport of [{name:'mobile',width:390,height:844},{name:'desktop',width:1280,height:900}]) {
 test(`composer validates, selects a place and publishes only content fields (${viewport.name})`,async({page})=>{
  await page.setViewportSize(viewport);
  await signIn(page,reader,'CUSTOMER');
  const api=await mockApi(page,(route,url,method)=>{
   if(url.pathname==='/api/places/search')return json(route,{items:[place],nextCursor:null});
   if(url.pathname==='/api/social/posts'&&method==='POST')return json(route,{...review,id:'post-new',author:{id:reader,displayName:'Synthetic U.',avatarUrl:null}},201);
   if(url.pathname==='/api/social/posts/post-new')return json(route,{...review,id:'post-new'});
   if(url.pathname==='/api/social/posts/post-new/comments')return json(route,{items:[],nextCursor:null});
   return unexpected(route,url);
  });
  await page.goto('/community/new');
  await page.getByRole('button',{name:'Đăng bài'}).click();
  await expect(page.getByText('Hãy viết nội dung bài đăng.')).toBeVisible();
  await expect(page.getByRole('radio',{name:'4 sao'})).toBeDisabled();
  await noHorizontalScroll(page);

  await page.getByLabel('Nội dung').fill('  Sunset over the river was wonderful  ');
  await page.getByPlaceholder('Tìm địa điểm, ví dụ: Cầu Rồng').fill('cầu');
  await page.getByRole('option').getByRole('button',{name:/Cầu Rồng/}).click();
  await page.getByRole('radio',{name:'4 sao'}).click();
  await page.getByRole('button',{name:'Đăng bài'}).click();
  await expect(page).toHaveURL(/\/community\/posts\/post-new$/);

  const created=api.calls.find(call=>call.method==='POST'&&call.path==='/api/social/posts');
  expect(created?.body).toEqual({body:'Sunset over the river was wonderful',placeId,rating:4,mediaIds:[]});
  expect(created?.auth).toBe('Bearer synthetic-customer-token');
 });
}

test('composer rejects unsupported photo files before uploading',async({page})=>{
 await signIn(page,reader,'CUSTOMER');
 const api=await mockApi(page,(route,url)=>unexpected(route,url));
 await page.goto('/community/new');
 await page.getByTestId('photo-input').setInputFiles({name:'note.gif',mimeType:'image/gif',buffer:Buffer.from('GIF89a')});
 await expect(page.getByText('Chỉ nhận ảnh JPEG, PNG hoặc WebP.')).toBeVisible();
 expect(api.calls.filter(call=>call.path==='/api/social/media')).toHaveLength(0);
});

test('signed-out visitors are asked to sign in instead of seeing the composer',async({page})=>{
 await mockApi(page,(route,url)=>unexpected(route,url));
 await page.goto('/community/new');
 await expect(page.getByText('Bạn cần đăng nhập để viết bài')).toBeVisible();
 await expect(page.getByLabel('Nội dung')).toHaveCount(0);
});

test('post detail shows comments, lets a reader comment and report, and hides author controls',async({page})=>{
 await signIn(page,reader,'CUSTOMER');
 const api=await mockApi(page,(route,url,method)=>{
  if(url.pathname==='/api/social/posts/post-5')return json(route,post(5,{commentCount:1}));
  if(url.pathname==='/api/social/posts/post-5/comments'&&method==='GET')
   return json(route,{items:[{id:'c1',postId:'post-5',author:{id:author,displayName:null,avatarUrl:null},body:'First synthetic comment',createdAt:'2026-11-12T08:30:00Z'}],nextCursor:null});
  if(url.pathname==='/api/social/posts/post-5/comments'&&method==='POST')
   return json(route,{id:'c2',postId:'post-5',author:{id:reader,displayName:'Synthetic U.',avatarUrl:null},body:'Second synthetic comment',createdAt:'2026-11-12T09:00:00Z'},201);
  if(url.pathname==='/api/social/reports')return json(route,{received:true});
  return unexpected(route,url);
 });
 await page.goto('/community/posts/post-5');
 await expect(page.getByText('First synthetic comment')).toBeVisible();
 await expect(page.getByText('Thành viên Checkinn')).toBeVisible();
 await expect(page.getByRole('link',{name:'Chỉnh sửa'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Xóa bài'})).toHaveCount(0);

 await page.getByLabel('Viết bình luận').fill('Second synthetic comment');
 await page.getByRole('button',{name:'Gửi bình luận'}).click();
 await expect(page.getByTestId('comment')).toHaveCount(2);

 await page.getByRole('button',{name:'Báo cáo',exact:true}).first().click();
 const dialog=page.getByRole('dialog');
 await dialog.getByRole('button',{name:'Gửi báo cáo'}).click();
 await expect(dialog.getByRole('alert')).toHaveText('Hãy chọn lý do báo cáo.');
 await dialog.getByLabel('Spam hoặc quảng cáo').check();
 await dialog.getByRole('button',{name:'Gửi báo cáo'}).click();
 await expect(dialog.getByRole('status')).toContainText('Danh tính của bạn không được hiển thị công khai');
 expect(api.calls.find(call=>call.path==='/api/social/reports')?.body).toEqual({targetType:'POST',targetId:'post-5',reason:'SPAM',note:null});
});

test('a hidden or missing post shows the not-found state',async({page})=>{
 await mockApi(page,(route,url)=>url.pathname==='/api/social/posts/gone'?json(route,{status:404,error:'NOT_FOUND'},404):unexpected(route,url));
 await page.goto('/community/posts/gone');
 await expect(page.getByText('Không tìm thấy bài viết')).toBeVisible();
});

for(const viewport of [{name:'mobile',width:390,height:844},{name:'desktop',width:1280,height:900}]) {
 test(`place page separates community and provider ratings and links to hotels (${viewport.name})`,async({page})=>{
  await page.setViewportSize(viewport);
  await mockApi(page,(route,url)=>{
   if(url.pathname===`/api/places/${placeId}`)return json(route,place);
   if(url.pathname===`/api/social/places/${placeId}/rating`)return json(route,{placeId,count:3,average:4.333});
   if(url.pathname==='/api/social/posts'&&url.searchParams.get('placeId')===placeId)return json(route,{items:[review],nextCursor:null});
   return unexpected(route,url);
  });
  await page.goto(`/places/${placeId}`);
  await expect(page.getByRole('heading',{name:'Cầu Rồng',level:1})).toBeVisible();
  const community=page.getByTestId('community-rating'),provider=page.getByTestId('provider-rating');
  await expect(community).toContainText('4.3');
  await expect(community).toContainText('(3 lượt)');
  await expect(community).not.toContainText('4.6');
  await expect(provider).toContainText('4.6');
  await expect(page.getByTestId('provider-review')).toContainText('Synthetic provider review text');
  await expect(page.getByText('không phải từ thành viên Checkinn')).toBeVisible();
  await expect(page.getByTestId('post-card')).toHaveCount(1);
  await expect(page.getByTestId('nearby-hotels')).toHaveAttribute('href','/search?cityName=%C4%90%C3%A0%20N%E1%BA%B5ng');
  await noHorizontalScroll(page);
 });
}

test('place page shows no community rating instead of a zero, and still renders when the rating fails',async({page})=>{
 let ratingCalls=0;
 await mockApi(page,(route,url)=>{
  if(url.pathname===`/api/places/${placeId}`)return json(route,place);
  if(url.pathname===`/api/social/places/${placeId}/rating`){ratingCalls++;return ratingCalls===1?json(route,{placeId,count:0,average:null}):json(route,{},503);}
  if(url.pathname==='/api/social/posts')return json(route,{items:[],nextCursor:null});
  return unexpected(route,url);
 });
 await page.goto(`/places/${placeId}`);
 await expect(page.getByTestId('community-rating')).toContainText('Chưa có đánh giá từ cộng đồng.');
 await expect(page.getByTestId('community-rating')).not.toContainText('0.0');
 await expect(page.getByText('Chưa có bài viết về địa điểm này')).toBeVisible();
 await page.reload();
 await expect(page.getByTestId('community-rating')).toContainText('Chưa có đánh giá từ cộng đồng.');
});

test('unknown place shows the not-found state',async({page})=>{
 await mockApi(page,(route,url)=>{
  if(url.pathname.startsWith('/api/places/')||url.pathname.startsWith('/places/'))return json(route,{},404);
  if(url.pathname.endsWith('/rating'))return json(route,{placeId:'x',count:0,average:null});
  return unexpected(route,url);
 });
 await page.goto('/places/55555555-5555-4555-8555-555555555555');
 await expect(page.getByText('Không tìm thấy địa điểm')).toBeVisible();
});

test('admin reviews the report queue, hides content and closes reports',async({page})=>{
 await page.setViewportSize({width:1440,height:900});
 await signIn(page,admin,'ADMIN');
 let hidden=false,closed=false;
 const api=await mockApi(page,(route,url,method)=>{
  if(url.pathname==='/api/social/admin/reports'&&method==='GET')return json(route,closed?[]:[{
   targetType:'POST',targetId:'post-6',postId:'post-6',targetAuthorId:author,targetStatus:hidden?'HIDDEN':'PUBLISHED',
   excerpt:'Synthetic reported post',reportCount:2,reasons:{SPAM:2},firstReportedAt:'2026-11-12T07:00:00Z',
   reports:[{id:'r1',reporterId:reader,reason:'SPAM',note:null,createdAt:'2026-11-12T07:00:00Z'},{id:'r2',reporterId:author,reason:'SPAM',note:'ads',createdAt:'2026-11-12T07:10:00Z'}]}]);
  if(url.pathname==='/api/social/admin/posts/post-6/hide'){hidden=true;return json(route,{targetType:'POST',targetId:'post-6',status:'HIDDEN'});}
  if(url.pathname==='/api/social/admin/reports/close'){closed=true;return json(route,{closed:2});}
  return unexpected(route,url);
 });
 await page.goto('/admin/community-reports');
 const group=page.getByTestId('report-group');
 await expect(group).toContainText('2 báo cáo');
 await expect(group).toContainText('Synthetic reported post');
 await group.getByRole('button',{name:'Ẩn nội dung'}).click();
 await expect(group).toContainText('Đang ẩn');
 await expect(group.getByRole('button',{name:'Khôi phục nội dung'})).toBeVisible();
 await group.getByRole('button',{name:'Đã xử lý báo cáo'}).click();
 await expect(page.getByText('Không có báo cáo nào đang mở.')).toBeVisible();
 expect(api.calls.filter(call=>call.method==='POST').map(call=>[call.path,call.body])).toEqual([
  ['/api/social/admin/posts/post-6/hide',{reason:null}],
  ['/api/social/admin/reports/close',{targetType:'POST',targetId:'post-6',outcome:'RESOLVED'}],
 ]);
 expect(api.calls.every(call=>call.auth==='Bearer synthetic-admin-token')).toBe(true);
});
