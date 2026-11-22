# GitHub Actions CI

## Tổng quan và triggers

Workflow [ci.yml](../.github/workflows/ci.yml) chạy khi `push` vào `main`
hoặc `pull_request` có nhánh đích `main` (theo `origin/HEAD` lúc audit).
Không lọc paths để tránh required checks bị treo khi chỉ sửa tài liệu.
Run mới hủy run cũ cùng PR/ref. Không triển khai CD hoặc push Docker image.

Audit: Next.js App Router 16.1.1, React 19.2.0, TypeScript 5.9.3 theo
`package-lock.json`; Tailwind 4, NextAuth 4, ESLint 9 và Playwright.
Chọn Node 22 theo `Dockerfile` (manifest chưa khai báo `engines` hoặc
`packageManager`); Node phải hỗ trợ `--experimental-strip-types` cho regression.
Không có workflow được Git quản lý trước thay đổi này. Không có script format
hoặc typecheck riêng; gọi trực tiếp TypeScript đã khóa trong lockfile.

## Jobs và required status checks

| Tên check | Mục đích | Timeout |
| --- | --- | --- |
| `Lint` | `npm run lint`, dùng toàn bộ cấu hình ESLint hiện tại | 15 phút |
| `Typecheck` | `npx --no-install tsc --noEmit --incremental false` | 15 phút |
| `Node regression` | Toàn bộ `npm run test:regression` hiện có | 15 phút |
| `Production build and browser` | Build standalone bằng Webpack theo Dockerfile, cài Edge rồi chạy `npm run test:browser` | 30 phút |

Các check chạy độc lập; matrix không fail-fast. Build giữ nguyên kiểm tra
TypeScript của Next. Nếu build lỗi, các bước cài Edge/browser chưa chạy;
check tổng hợp này vẫn đỏ, không coi browser là pass.
Mỗi job dùng Ubuntu 24.04, Node 22, `npm ci`; setup-node cache npm download
theo `package-lock.json`, không cache `node_modules` hay artifact build.
Actions được pin commit SHA, cần cập nhật pin có review khi bảo trì.

## Chạy tương đương ở local

Từ thư mục repository, dùng Node 22 và npm đi kèm:

```sh
npm ci
npm run lint
npx --no-install tsc --noEmit --incremental false
npm run test:regression
npm run build -- --webpack
npx --no-install playwright install --with-deps msedge
npm run test:browser
```

Đặt `NEXT_TELEMETRY_DISABLED` và `NEXT_PUBLIC_API_BASE_URL` như workflow trước
build. Không dùng cấu hình `.env.local` có credentials thật cho kiểm chứng CI.
`npm run build` dùng bundler mặc định của Next; CI chọn Webpack như Dockerfile,
không khẳng định đã kiểm chứng Turbopack. Build cần truy cập Google Fonts vì
`app/layout.tsx` dùng `next/font/google`.

## Env và secrets

Không cần repository secret hoặc GitHub Environment cho pipeline này.
Tên biến do workflow hoặc browser harness cấu hình:

- `NEXT_TELEMETRY_DISABLED`
- `NEXT_PUBLIC_API_BASE_URL`
- `API_INTERNAL_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `HOSTNAME`
- `PORT`

`playwright.config.ts` tự đặt cấu hình auth tổng hợp và loopback upstream;
không cấp secret triển khai. Node regression dùng mock/loopback, browser mặc
định dùng intercepted APIs và auth fixture, không cần DB/Redis/container dịch vụ.

## Bảo mật và Branch Protection

`permissions: contents: read`, checkout `persist-credentials: false`, không
truyền secrets và dùng `pull_request`, không dùng `pull_request_target`.
PR từ fork chịu chính sách approval của GitHub; không bật tùy chọn gửi write
token/secrets cho fork. Xem [GitHub Actions settings](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/managing-github-actions-settings-for-a-repository).

Sau khi workflow được push bằng quy trình review thông thường:

1. Bật Actions và cho phép các actions đã pin trong repository/organization.
2. Chạy một PR vào `main` để GitHub ghi nhận các tên check ở bảng trên.
3. Settings → Branches / Rulesets → quy tắc cho `main`: bật yêu cầu PR và
   status checks, chọn cả bốn tên check. Nên yêu cầu nhánh cập nhật với `main`
   và hạn chế quyền bypass theo chính sách nhóm.
4. Xác nhận một PR fork được chạy sau approval và lỗi check thực sự chặn merge.

## Phạm vi và hạn chế

- Các config `playwright.<area>.config.ts` có server/port riêng và không nằm
  trong lệnh browser mặc định: chưa cấu hình trong CI này. Không xóa hoặc
  thay đổi testIgnore/assertions hiện có. Xem [tests/README.md](../tests/README.md)
  và từng config để chạy riêng; có thể bổ sung matrix sau khi xác nhận thời gian
  chạy và điều kiện readiness.
- `playwright.live.config.ts` cần disposable canonical backend và
  `CANONICAL_LIVE_FIXTURE` do runner backend tạo. Chưa cấu hình live integration;
  không thay bằng DB/Redis rỗng hoặc dùng hosted/business data.
- Browser có fixture không chứng minh backend/database/provider acceptance.
- Chưa có format check vì repository chưa có công cụ/script format.
- Không sửa dependency, business logic hoặc bypass lint/type validation để làm
  CI xanh. Phần remediation bên dưới sửa source/test trong phạm vi được yêu cầu.
- Node 22 theo major giống Dockerfile; có thể khóa patch/npm ở thay đổi riêng
  nếu nhóm cần tái lập cả toolchain. Lockfile được giữ nguyên.
- Kết quả local và lần chạy GitHub thực tế được ghi riêng dưới đây.

## Remediation và kiểm chứng local — 22/11/2026

Audit ngày 22/11/2026 trên Windows; các lệnh kiểm tra source chạy qua Node
22.23.5 bằng npm exec (máy mặc định Node 24.22.3, npm 11.12.1).

| Hạng mục / CI job | Kết quả local sau remediation |
| --- | --- |
| `npm ci` | PASS ở audit ban đầu, chưa chạy lại trong remediation; không đổi manifest/lockfile |
| YAML / actionlint 1.7.12 | PASS; parse YAML và kiểm tra trigger/permissions/matrix |
| `Lint`: `npm run lint` | PASS: 0 errors, 150 warnings |
| `Typecheck`: TypeScript không emit/cache | PASS |
| `Node regression`: `npm run test:regression` | PASS: 223/223, không skip; thêm kiểm tra error-message với thrown values không hợp lệ |
| `npm run build -- --webpack` | PASS, giữ kiểm tra TypeScript |
| `Production build and browser`: browser trên artifact mới | PASS: 105/105 (1,9 phút), không skip/retry; build Webpack PASS; Edge sẵn có trên Windows |
| `npm run build` không có `--webpack` | NOT CONFIGURED trong CI, chưa chạy local |
| Area browser / live integration / format | NOT CONFIGURED trong CI |
| GitHub Actions run | BLOCKED: chưa push/PR, chưa có run để đối chiếu |
| `npm audit --json` | FAIL: 23 package entries (3 critical, 13 high, 6 moderate, 1 low), không phải quality job đã cấu hình |
| `npm audit --omit=dev --json` | FAIL: 15 entries (3 critical, 8 high, 4 moderate) |

Cảnh báo middleware convention deprecated vẫn còn.
Build local nạp `.env` sẵn có; CI fresh checkout không nhận private env.
Kết quả local không thay thế lần chạy Ubuntu/GitHub hoặc kiểm chứng PR fork.

### Phân loại đủ 133 ESLint errors

| Rule | Ban đầu | Nguyên nhân và cách sửa |
| --- | --- | --- |
| `@typescript-eslint/no-explicit-any` | 112 | Catch values, state, DTO arrays và fixture bodies không có kiểu. Dùng `unknown` + kiểm tra message cho lỗi, DTO/return types có sẵn cho state, inference cho callbacks, records/concrete fixture types cho tests. Giữ kiểm tra response hiện có; type assertions tại legacy wire mapper không phải runtime validation mới. |
| `react/no-unescaped-entities` | 15 | Dấu nháy trong literal JSX; escape bằng entities, text hiển thị giữ nguyên. |
| `react-hooks/set-state-in-effect` | 4 | State có thể suy ra từ request/nguồn ngoài/prop nhưng được cập nhật ngay trong effect. Booking dùng kết quả gắn request key và cleanup chống response cũ; Header và personal-data dùng external-store snapshots; modal ảnh reset state khi place thay đổi trước khi render ảnh mới. Không dùng timer để né rule. |
| `react/no-children-prop` | 1 | Prop số khách trẻ em dùng tên dành riêng `children`; đổi prop nội bộ sang `childCount` ở component/caller, giữ query/API `children`. |
| `prefer-const` | 1 | Biến sortedReviews không reassignment; đổi const. |

Thêm helper `lib/error-message.ts` với test cho Error, object message và thrown
values không có message string. Auth response dùng kiểu sẵn có, bảo vệ trạng thái
null trước truy cập token. Không sửa backend, business rules hoặc API payloads.
Các assertions nghiệp vụ trong browser tests được giữ; thêm kiểm tra loading
trong lúc refresh booking đang pending.

Warnings còn lại: 78 `no-unused-vars`, 63 `no-img-element`, 9 `exhaustive-deps`.
Không nâng chúng thành pass giả bằng disable/config ignore. Không thay hàng loạt
img bằng next/image vì ảnh có nguồn/provider khác nhau và cần review policy;
hook dependency warnings cần review lifecycle riêng để tránh fetch loops.
Unused declarations là backlog cleanup, không chặn lệnh lint hiện tại.

### Điều tra browser timeout

Test `initial hotel approval sends reviewed revision and requires reload after stale rejection`
ở `tests/browser/accommodation-type.spec.ts:132` (click tại dòng 142) ban đầu
timeout 30 giây; snapshot chỉ có “Đang kiểm tra quyền truy cập...”.

Đã kiểm tra:

- Fixture cài token/user ADMIN tổng hợp trước navigation, `readAuth` chấp nhận
  custom credential shape này; đây chỉ là UI fixture, không phải authorization
  proof cho backend thật.
- `useAuth` chờ NextAuth session status và storage hydration; admin layout chờ
  `isLoading`. Route mock trả null cho session và intercept backend loopback;
  hotel pending revision 7 → conflict → reload revision 8 → approval giữ nguyên.
- Chạy riêng test với trace trên artifact cũ: PASS 1/1; chạy toàn default suite
  với `--trace retain-on-failure` trên artifact cũ: PASS 105/105 (2 phút), không
  sửa target spec/auth hooks/admin flow. Đây là run chẩn đoán, không phải kết quả
  của source sau remediation.

Chưa tái hiện timeout và không có trace/network log của lần lỗi ban đầu để phân
biệt session request treo, hydration hoặc scheduling. **Chưa xác định root cause,
chưa tuyên bố đã sửa lỗi ứng dụng hoặc lỗi fixture.** Không tăng timeout, thêm
retry, sửa quyền hoặc làm yếu assertions. Nếu tái xuất hiện, giữ failed trace,
page errors, request failures và session response timing trước khi sửa.
Bước cài Edge trên Ubuntu vẫn cần GitHub run để xác minh.

### Dependency security

Xem [DEPENDENCY_SECURITY_AUDIT.md](DEPENDENCY_SECURITY_AUDIT.md) cho đủ 23 package
entries, direct/transitive paths, điều kiện áp dụng thực tế, nguồn advisory và
thứ tự khắc phục. Không nâng gói, sửa lockfile, chạy audit fix hoặc thêm ngoại lệ
security. CI chất lượng xanh không đồng nghĩa ứng dụng sẵn sàng phát hành.

### File scope của remediation

Các file source/test đã sửa (không gồm build output hoặc operator state):

- `app/admin/page.tsx`
- `app/admin/pending/[id]/page.tsx`
- `app/booking/[id]/page.tsx`
- `app/booking/history/page.tsx`
- `app/booking/page.tsx`
- `app/booking/payment/page.tsx`
- `app/help-center/page.tsx`
- `app/host/hotels/[id]/page.tsx`
- `app/host/hotels/[id]/rooms/[roomId]/page.tsx`
- `app/host/hotels/[id]/rooms/new/page.tsx`
- `app/host/hotels/newHotel/page.tsx`
- `app/host/hotels/page.tsx`
- `app/host/page.tsx`
- `app/hotel/[id]/page.tsx`
- `app/page.tsx`
- `app/personal-data/page.tsx`
- `components/Header.tsx`
- `components/HostReviewCard.tsx`
- `components/HotelDetailHeader.tsx`
- `components/PlaceReviewsModal.tsx`
- `components/ReviewSection.tsx`
- `lib/api/admin.ts`
- `lib/api/hotels.ts`
- `lib/api/reviews.ts`
- `tests/api-errors.test.mjs`
- `tests/browser/amenity-catalog.spec.ts`
- `tests/browser/amenity-write.spec.ts`
- `tests/browser/inventory-review.spec.ts`
- `tests/browser/new-room-facts.spec.ts`
- `tests/browser/offer-fixtures.ts`
- `tests/browser/points-preview.spec.ts`
- `tests/browser/unknown-room-facts.spec.ts`
- `lib/error-message.ts` (mới)

Tài liệu: `docs/CI_SETUP.md` được cập nhật và
`docs/DEPENDENCY_SECURITY_AUDIT.md` được tạo. Workflow `.github/workflows/ci.yml`
đã có từ audit trước và giữ nguyên trong remediation; đã validate lại.
`package.json`, `package-lock.json`, ESLint config, Next config, Playwright config,
target accommodation-type spec và auth/authorization hooks không đổi.
Không stage, commit hoặc push.

Lần kiểm chứng artifact mới đầu tiên: 104 pass, 1 fail do assertion loading mới
trong `points-preview.spec.ts` dùng locator text toàn trang và khớp hai elements.
Đã sửa locator giới hạn vào role `main`; không thay assertion nghiệp vụ, timeout
hoặc retry. Lỗi selector này thuộc remediation, khác timeout accommodation-type
ban đầu. Kết quả rerun cuối được ghi ở bảng kiểm chứng phía trên.

### Kết luận readiness

Test accommodation-type riêng trên artifact mới PASS 1/1; hai test refresh
booking sau khi sửa locator PASS 2/2. Toàn default suite lần cuối PASS 105/105,
chạy `npm run test:browser -- --trace retain-on-failure` trên artifact Webpack
mới. Full lint PASS 0 errors/150 warnings; sau chỉnh selector, file test được
lint riêng và toàn TypeScript được kiểm tra lại, đều PASS. Không thay source
runtime sau build.

Có thể tạo PR/push theo review để chạy bốn required checks trên GitHub; chưa có
GitHub run nên chưa chứng nhận Ubuntu/Edge install, fork policy hoặc branch
protection. Timeout cũ vẫn là rủi ro ổn định chưa xác định root cause; không coi
các lần pass sau là bằng chứng đã sửa nó. Chưa sẵn sàng chứng nhận phát hành an
toàn vì critical/high dependency advisories chưa được khắc phục. Area browser,
live backend integration và security gate chưa cấu hình trong workflow này.
