# Dependency security audit — 22/11/2026

Đã chạy `npm audit --json`, `npm audit --omit=dev --json`, `npm ls ... --all`,
đọc `package.json`, lockfile, imports, Next config, Dockerfile và auth/revenue
adapters. Không chạy `npm audit fix`, install/update gói hoặc sửa lockfile.

## Kết quả và cách hiểu

- Full tree: **23 package entries** — 3 critical, 13 high, 6 moderate, 1 low.
  Đây không phải 23 CVE độc lập: có 130 advisory URLs duy nhất, cùng lỗ hổng
  có thể lan lên package cha hoặc xuất hiện ở nhiều version.
- 5 direct, 18 transitive. `baseline-browser-mapping` được khai báo dev trực tiếp
  nhưng cũng nằm dưới Next ở production tree.
- `--omit=dev`: **15 entries** — 3 critical, 8 high, 4 moderate.
  Production dependency tree không đồng nghĩa mọi package đều được trace vào
  standalone artifact hoặc mọi advisory đều khai thác được qua ứng dụng.
- Không thực hiện exploit/penetration test. Nhận định reachability dưới đây là
  suy luận từ source/config hiện tại, không phải chứng nhận không bị ảnh hưởng.

## Direct dependencies

| Package khóa hiện tại | Mức npm | Đường sử dụng và ảnh hưởng thực tế | Hướng xử lý được đề xuất |
| --- | --- | --- | --- |
| `next` 16.1.1 | Critical | App Router, SSR, route handlers và standalone server thực sự được dùng. Các nhóm lỗi gồm RSC/DoS, cache, image optimizer và middleware. Không thể miễn trừ toàn bộ package. Docker dùng Linux nên điều kiện Windows-hosted RCE không khớp Docker; source không có `use cache`, Server Actions hoặc custom server. Không thấy cấu hình remotePatterns/dangerouslyAllowSVG; vẫn cần đánh giá optimizer tại runtime. | Ưu tiên PR nâng trong major 16, candidate 16.4.6 đã xác nhận có trên registry; review release notes, tương thích React/auth và cây sharp/postcss, build + browser + re-audit trước merge. |
| `next-auth` 4.24.13 | Critical | Route auth dùng CredentialsProvider; không có Email/OAuth provider nên advisory email-normalization và cross-provider OAuth không khớp cấu hình hiện tại. Không thấy app gọi getToken trực tiếp; vẫn phải kiểm tra đường gọi nội bộ của auth library. Không coi critical đã được xử lý. | Candidate 4.24.15 (cùng major, có trên registry); test malformed Bearer, CSRF/cookie/session, login/logout và re-audit uuid. Không tự override uuid sang major mới. |
| `axios` 1.13.2 | High | `lib/api/revenue.ts` tạo instance với base URL cấu hình và timeout, dùng qua UI báo cáo. Không thấy caller cho phép chọn URL/proxy/adapter tùy ý. Nhóm SSRF/proxy/HTTP2 của Node không khớp luồng browser thông thường; prototype-pollution gadgets và input DoS vẫn cần review. | Candidate 1.21.1 đã có trên registry; review changelog và toàn bộ revenue regression/browser, error mapping, credentials và deadlines. Re-audit form-data/follow-redirects. |
| `rechart` 0.0.1 | Moderate (lan từ lodash) | Không có import `rechart` trong app/components/lib; code dùng package khác là `recharts`. Gói này kéo React 0.14, Lodash 3 và tooling cũ. `fixAvailable:false`. Chưa chứng minh có runtime call vào cây này. | Đề xuất bỏ dependency sau khi nhóm xác nhận không có consumer ngoài source đã audit; thực hiện trong PR dependency riêng và cập nhật lockfile có review. Không tự thay bằng một gói khác. |
| `baseline-browser-mapping` 2.9.11 | Moderate | Dùng gián tiếp qua Next/browserslist; termination với input không hợp lệ. Không có app endpoint cho caller truyền options của thư viện. | Review cập nhật trong major 2 (advisory sửa từ 2.11.0), cùng các consumers Next/browserslist; chạy build/lint và re-audit. |

Nguồn cho điều kiện cụ thể: [Next Windows RCE](https://github.com/advisories/GHSA-p293-qw3h-jr36),
[SVG optimizer RCE](https://github.com/advisories/GHSA-2464-fhr4-w9xw),
[`use cache` RCE](https://github.com/advisories/GHSA-673q-mjm6-r5xr),
[remotePatterns DoS](https://github.com/advisories/GHSA-9g9p-9gw9-jx7f),
[Auth email normalization](https://github.com/advisories/GHSA-7rqj-j65f-68wh),
[Auth malformed Bearer](https://github.com/advisories/GHSA-xmf8-cvqr-rfgj),
[Axios fetch header injection](https://github.com/advisories/GHSA-4hqw-qxg8-jxx2).
Các candidate chỉ được đọc bằng `npm view`, chưa cài hoặc kiểm thử phiên bản mới.

## Transitive dependencies (đủ 18 entries)

“Dev” ở bảng là toàn bộ nodes bị audit đánh dấu dev-only; “Prod” chỉ nói có
đường production trong dependency tree, không khẳng định khai thác được.

| Package / version bị ảnh hưởng | Mức | Đường cha / phạm vi | Đánh giá và phương án |
| --- | --- | --- | --- |
| `@babel/core` 7.28.5 | Low | eslint-config-next → react-hooks / Dev | [Source map file read](https://github.com/advisories/GHSA-4x5r-pxfx-6jf8) cần xử lý source có kiểm soát bởi attacker; ưu tiên cập nhật tooling có review, CI không giữ secrets. |
| `@humanfs/node` 0.16.7 | Moderate | ESLint / Dev | [Copy symlink](https://github.com/advisories/GHSA-p498-v437-472g); chưa thấy app sử dụng API copy. Cập nhật cây ESLint, không áp override mù. |
| `ajv` 6.12.6 | Moderate | ESLint schema validation / Dev | [ReDoS với `$data`](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6); không có endpoint app dùng AJV. Cập nhật tooling và kiểm tra options thực tế. |
| `brace-expansion` 1.1.12, 2.0.2 | High | minimatch → ESLint và rechart legacy / Prod | [Nhóm ReDoS](https://github.com/advisories/GHSA-f886-m6hf-6m8v) với patterns không tin cậy; không thấy app nhận glob pattern. Cập nhật các parent và xem xét bỏ rechart. |
| `browserslist` 4.28.0 | High | Babel targets / Dev | [Input/config handling](https://github.com/advisories/GHSA-c83g-rgw3-j3cx); nguồn build không tin cậy là bề mặt CI. Cập nhật cây tooling tương thích. |
| `flatted` 3.3.3 | High | ESLint cache / Dev | [Recursion/DoS](https://github.com/advisories/GHSA-25h7-pfq9-p65f); app không parse input bằng flatted. Cập nhật parent, không chia sẻ lint cache không tin cậy. |
| `follow-redirects` 1.15.11 | Moderate | Axios / Prod | [Redirect handling](https://github.com/advisories/GHSA-r4q5-vmmm-2653) thuộc Node adapter; browser revenue không dùng Node redirect adapter theo đường bình thường. Cập nhật qua Axios và test adapters. |
| `form-data` 4.0.5 | High | Axios / Prod | [Multipart boundary](https://github.com/advisories/GHSA-hmw2-7cc7-3qxx); không thấy server multipart dùng Axios trong app. Cập nhật qua Axios; kiểm tra nếu tái sử dụng SDK phía server. |
| `js-yaml` 4.1.1 | High | ESLint / Dev | [Resource exhaustion](https://github.com/advisories/GHSA-h67p-54hq-rp68); không có app YAML ingestion. Cập nhật tooling và kiểm tra config parsing, không chỉ chạy production audit. |
| `lodash` 3.10.1, 4.17.21 | Critical | rechart → 3; recharts → 4 / Prod | [Prototype pollution](https://github.com/advisories/GHSA-fvqr-27wr-82fm) ở cây 3 cũ và advisories template/prototype ở cây 4. Charts được dùng nhưng không thấy app gọi template/merge với object key tùy ý. Đề xuất bỏ rechart; review parent recharts để dùng bản Lodash đã vá (registry có 4.18.1), không ép Lodash 3 sang 4 bằng override. `fixAvailable:false` không có nghĩa không thể khắc phục thủ công. |
| `minimatch` 3.1.2, 9.0.5 | High | ESLint và glob dưới rechart / Prod | [ReDoS](https://github.com/advisories/GHSA-3ppc-4f35-3m26); không thấy glob nhận input HTTP. Cập nhật parent ESLint và xem xét bỏ rechart. |
| `nanoid` 3.3.11 | High | PostCSS / Prod | [Invalid size/loop](https://github.com/advisories/GHSA-28wg-ghj8-5hjv); app không gọi nanoid trực tiếp hoặc truyền size từ request. Cập nhật PostCSS/Next; xác nhận version vá toàn bộ advisories. |
| `picomatch` 2.3.1, 4.0.3 | High | ESLint/tinyglobby / Dev | [Glob ReDoS](https://github.com/advisories/GHSA-c2c7-rcm5-vvqj); chủ yếu build input. Cập nhật tooling, giữ cả hai nhánh version tương thích. |
| `postcss` 8.4.31, 8.5.6 | High | Next và Tailwind PostCSS / Prod | [Source map file read](https://github.com/advisories/GHSA-6g55-p6wh-862q); app không nhận CSS upload để compile. Build vẫn xử lý CSS từ PR. Cập nhật cả nhánh Next bundled lẫn Tailwind parent, không chỉ node hoisted. |
| `sharp` 0.34.5 | High | Next image optimizer / Prod | [Native libvips](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) và libheif/librsvg advisories. Có next/image trong source; phải review optimizer và nguồn ảnh, không miễn trừ vì nhiều nơi dùng img. Cập nhật Next và native tree tương thích; audit lại image processing trong Linux image. |
| `source-map-js` 1.2.1 | High | PostCSS/Tailwind node / Prod | [Indexed source-map DoS](https://github.com/advisories/GHSA-68fv-2mgg-jv7q); không có app upload sourcemap, bề mặt build input. Cập nhật parent và test build. |
| `uuid` 8.3.2 | Moderate | next-auth / Prod | [v3/v5/v6 output buffer bounds](https://github.com/advisories/GHSA-w5hq-g745-h8pq); app không gọi UUID với buffer do người dùng kiểm soát. Audit riêng calls nội bộ auth sau nâng parent; không override major chỉ để hết alert. |
| `zod` 4.1.13 | High | eslint-config-next tooling / Dev | [Oversized collections/memory](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5); không thấy Zod endpoint trong app. Cập nhật tooling parent và re-audit. |

## Thứ tự khắc phục an toàn (chưa thực hiện)

1. PR riêng cho Next/Auth/Axios, đọc changelog và cập nhật lockfile bằng các
   version cụ thể đã review. Align eslint-config-next với nhánh Next mới khi phù
   hợp; không dùng `--force`, không nâng major vô tình.
2. Xác nhận và bỏ `rechart` không dùng; kiểm tra cây recharts/Lodash 4 riêng.
3. Cập nhật tooling/parents cho toàn bộ nhánh transitive. Không giả định nâng
   một package cha sẽ tự vá mọi bản nested; kiểm tra `npm ls` và audit lại.
4. Mỗi PR phải chạy `npm ci`, lint, typecheck, regression, Webpack production
   build, browser mặc định và các browser revenue/auth liên quan; kiểm tra Linux
   standalone/native sharp. Kiểm tra payload/error/deadline không đổi.
5. Chạy lại cả hai audit commands; ghi rõ phần còn lại, điều kiện khai thác và
   chủ sở hữu. Không coi CI chất lượng xanh là dependency security đã đạt.

Chưa thêm security gate hoặc miễn trừ advisory vào workflow. Trước phát hành,
cần quyết định xử lý các critical/high còn lại; task này chỉ được phép audit và
đề xuất, không được tự nâng dependency.
