import {test,expect} from '@playwright/test';

const roles=['CUSTOMER','OWNER','ADMIN'];
const ids=['11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','33333333-3333-4333-8333-333333333333'];
for (const [index,role] of roles.entries()) {
  test(`NextAuth credentials preserve internal ${role} identity and synchronize the client`,async ({page}) => {
    const csrf=await (await page.request.get('/api/auth/csrf')).json();
    const result=await page.request.post('/api/auth/callback/credentials',{form:{csrfToken:csrf.csrfToken,email:role.toLowerCase()+'@example.invalid',password:'synthetic-browser-password',callbackUrl:'http://127.0.0.1:3300/',json:'true'}});
    expect(result.status()).toBe(200);
    const session=await (await page.request.get('/api/auth/session')).json();
    expect(session.user.id).toBe(ids[index]); expect(session.user.role).toBe(role);
    expect(session.provider).toBe('credentials'); expect(session.accessToken).toBe('synthetic-internal-token-'+role);
    let logoutBearer='';
    await page.route('**/*',async route => {
      const url=new URL(route.request().url());
      if(url.port==='8080') {
        if(url.pathname==='/api/auth/logout' && route.request().method()==='POST') logoutBearer=route.request().headers()['authorization'];
        return route.fulfill({headers:{'access-control-allow-origin':'*','access-control-allow-headers':'Authorization,Content-Type','access-control-allow-methods':'GET,POST,OPTIONS'},json:[]});
      }
      if(url.origin!=='http://127.0.0.1:3300') return route.abort();
      return route.continue();
    });
    await page.goto('/');
    await expect.poll(async () => page.evaluate(() => {const u=JSON.parse(localStorage.getItem('user')||'null');return u?{userId:u.userId,role:u.role,token:localStorage.getItem('token')}:null;})).toEqual({userId:ids[index],role,token:'synthetic-internal-token-'+role});
    await page.getByRole('button',{name:new RegExp('Synthetic '+role)}).click();
    const signedOut=page.waitForResponse(response=>response.url().endsWith('/api/auth/signout') && response.request().method()==='POST');
    await page.getByRole('button',{name:'Đăng xuất',exact:true}).click();
    await signedOut;
    await expect.poll(()=>page.evaluate(()=>localStorage.getItem('token'))).toBeNull();
    expect(logoutBearer).toBe('Bearer synthetic-internal-token-'+role);
    await expect.poll(async()=> (await page.request.get('/api/auth/session')).json()).toEqual({});
    expect(await page.evaluate(()=>localStorage.getItem('user'))).toBeNull();
  });
}
test('Google provider is unavailable until a verified internal token exchange exists',async ({request}) => {
  const providers=await (await request.get('/api/auth/providers')).json();
  expect(providers.credentials).toBeTruthy(); expect(providers.google).toBeUndefined();
});
test('invalid NextAuth credentials never produce an internal session',async ({request}) => {
  const csrf=await (await request.get('/api/auth/csrf')).json();
  await request.post('/api/auth/callback/credentials',{form:{csrfToken:csrf.csrfToken,email:'owner@example.invalid',password:'invalid',json:'true'}});
  expect(await (await request.get('/api/auth/session')).json()).toEqual({});
});

test('legacy Google cookie and stored external token cannot become an internal session',async ({page}) => {
  const {encode}=await import('next-auth/jwt');
  const cookie=await encode({secret:'synthetic-browser-session-signing-secret',token:{provider:'google',accessToken:'synthetic-external-google-token',id:'external-google-id',role:'ADMIN'}});
  await page.context().addCookies([{name:'next-auth.session-token',value:cookie,domain:'127.0.0.1',path:'/',httpOnly:true,sameSite:'Lax'}]);
  await page.addInitScript(() => {localStorage.setItem('token','synthetic-external-google-token');localStorage.setItem('user',JSON.stringify({email:'oauth@example.invalid',provider:'google',role:'customer',accessToken:'synthetic-external-google-token'}));});
  const session=await (await page.request.get('/api/auth/session')).json();
  expect(session.accessToken).toBeUndefined();expect(session.user?.role).toBeUndefined();
  await page.route('**/*',async route => {const url=new URL(route.request().url());if(url.port==='8080')return route.fulfill({headers:{'access-control-allow-origin':'*'},json:[]});if(url.origin!=='http://127.0.0.1:3300')return route.abort();return route.continue();});
  await page.goto('/');
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('token'))).toBeNull();
  expect(await page.evaluate(()=>localStorage.getItem('user'))).toBeNull();
});

test('custom credentials replace an unavailable cookie session without the old account overwriting it',async ({page}) => {
  const csrf=await (await page.request.get('/api/auth/csrf')).json();
  await page.request.post('/api/auth/callback/credentials',{form:{csrfToken:csrf.csrfToken,email:'owner@example.invalid',password:'synthetic-browser-password',json:'true'}});
  const replacement='44444444-4444-4444-8444-444444444444';let canonicalBody=false;
  const cors={'access-control-allow-origin':'*','access-control-allow-headers':'Authorization,Content-Type','access-control-allow-methods':'GET,POST,OPTIONS'};
  await page.route('**/*',async route => {
    const url=new URL(route.request().url());
    if(url.port==='8080') {
      if(route.request().method()==='OPTIONS')return route.fulfill({status:204,headers:cors});
      if(url.pathname==='/api/auth/login') {
        canonicalBody=route.request().postDataJSON().usernameOrEmail==='replacement-owner';
        return route.fulfill({headers:cors,json:{userId:replacement,token:'synthetic-replacement-internal-token',role:'OWNER',email:'replacement@example.invalid',fullName:'Replacement Owner'}});
      }
      return route.fulfill({headers:cors,json:[]});
    }
    if(url.origin!=='http://127.0.0.1:3300')return route.abort();
    if(url.pathname==='/api/auth/session')return route.fulfill({json:null});
    return route.continue();
  });
  await page.goto('/host');
  expect((await (await page.request.get('/api/auth/session')).json()).user.id).toBe(ids[1]);
  await page.getByPlaceholder('Nhập email hoặc tên đăng nhập').fill('replacement-owner');
  await page.getByPlaceholder('Nhập mật khẩu').fill('synthetic-browser-password');
  await page.getByRole('main').getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('user')||'{}').userId)).toBe(replacement);
  expect(canonicalBody).toBe(true);
  expect(await (await page.request.get('/api/auth/session')).json()).toEqual({});
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('token'))).toBe('synthetic-replacement-internal-token');
});
