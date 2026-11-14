# Phase 4 — Tài khoản khách hàng và chức năng sau mua

> Ngày lập: **07/11/2026**. Đối chiếu frontend tại HEAD `7df522e`; working tree sạch trước khi tạo tài liệu.
> Nguồn: [frontend_master_plan.md](frontend_master_plan.md), [phase3.md](phase3.md), source frontend và source tham chiếu tại `../ecommerce-backend`.
> **Điểm tiếp tục — cập nhật 13/11/2026: kiểm thử tích hợp D8, sau đó làm D9 — đánh giá.** D5–D8 đã có code. Xem bàn giao từng mốc để biết các ca tích hợp còn chờ.
> Phase 3: C1–C12 đã được chốt trong phạm vi ghi ở `phase3.md`; C12 hoàn thành theo xác nhận thử VNPay của người dùng ngày 07/11/2026. **C13 còn hồi quy tổng thể**, không tự đánh dấu Phase 3 hoàn tất và không giao lại code C12. Có thể bắt đầu phần tài khoản độc lập; kiểm tra các luồng checkout/payment liên quan khi tích hợp D5–D8 và chốt D13.

## 1. Cách thực hiện

1. Mặc định người dùng tự code. Mỗi lượt hướng dẫn giải thích đủ một mốc, file cần sửa, luồng dữ liệu và cách kiểm tra; sau đó review phần người dùng đã làm. Chỉ triển khai source trực tiếp khi được yêu cầu.
2. Làm từng màn hình rồi nối API của màn hình đó. Không dựng toàn bộ UI tĩnh hoặc toàn bộ hạ tầng trước khi có chức năng chạy được.
3. Dùng DTO TypeScript viết tay, Axios client, TanStack Query, React Hook Form, Zod, Zustand session và design tokens hiện có. Không chạy `gen:api`, không tự đưa việc cài test framework/CI đã hoãn trở lại phạm vi.
4. Phân biệt rõ: đã có code, đã kiểm tra tĩnh, đã chạy backend/browser, và người dùng xác nhận. Mỗi mốc có tiêu chí riêng; commit không thay thế kiểm thử.
5. Cập nhật bảng tiến độ và bàn giao cuối tài liệu sau mỗi mốc. Chỉ commit/push khi có yêu cầu phù hợp; các tên commit dưới đây là gợi ý.
6. Contract trong tài liệu là kết quả đọc source ngày lập, chưa phải kết quả gọi API. Khi bắt đầu một module, đối chiếu response thật với backend đang chạy; ghi thay đổi nếu khác.

## 2. Hiện trạng và phần cần bổ sung

| Khu vực | Code đang có | Việc Phase 4 |
|---|---|---|
| Tài khoản | `AccountLayout`, form sửa hồ sơ và đổi mật khẩu | Ghi kết quả kiểm thử tích hợp D1–D3 |
| Địa chỉ | `/account/addresses` nằm trong `AccountLayout`, có CRUD và schema/form dùng chung checkout | Kiểm tra hồi quy khi tích hợp các luồng mua hàng |
| Điều hướng đăng nhập | `RequireAuth` giữ `location.state.from`; `getLoginDestination` chấp nhận các route tài khoản từ D1 đến D4 | Bổ sung đích quay lại cho `/account/orders/:id` ở D5 |
| Đơn hàng | `/account/orders` lấy danh sách từ API, có lọc và phân trang. Checkout COD/VNPay có bản xác nhận đơn | Chi tiết lấy từ server, đường dẫn sau checkout, hủy, thanh toán lại, mua lại |
| Thanh toán | `features/payment` có redirect helper, API return public và trang kết quả | Dùng lại cho thanh toán đơn đã có; nối đường xem đơn và làm mới dữ liệu |
| Đánh giá/yêu thích/trả hàng | Chưa có `features/reviews`, `features/wishlist`, `features/returns` | Tạo từng feature khi đến mốc tương ứng |
| Shared | ID dạng string; enum đơn/thanh toán/trả hàng; `formatVND`; `normalizePage`; cache theo user ở hồ sơ/cart/địa chỉ | Thêm query keys đang dùng, format ngày, badge trạng thái, dialog xác nhận, chọn ảnh khi cần |
| UI catalog | ProductCard/PDP đã có so sánh; PDP có `averageRating` và chọn variant | Gắn wishlist; chưa có API đọc danh sách review công khai |
| Kiểm tra | `lint`, `typecheck`, `build`, `verify:checkout`, `verify:catalog` trong `package.json` | Chạy kiểm tra phù hợp với phần thay đổi; không coi script giả lập là thử backend |

Không nằm trong Phase 4: giao diện admin P5, policy B11, phần còn hoãn của B12, guest order tracking, gửi email xác nhận đơn, upload ảnh review và lịch sử trả hàng khi backend chưa hỗ trợ. Giữ các việc này trong backlog, không đánh dấu hoàn thành theo Phase 4.

### 2.1 Những khác biệt với master plan cần dùng đúng

| Vấn đề | Source hiện tại | Quyết định triển khai |
|---|---|---|
| Đổi mật khẩu | `UserController.changePassword` trả **MessageResponse JSON**, không còn plain text | API nhận `{ message }`; kiểm tra Network ở D3 |
| Chính sách mật khẩu | Regex mạnh đang comment trong `ChangePasswordRequest`; service kiểm tra mật khẩu cũ và confirm | Dùng lại `newPasswordSchema` của frontend để thống nhất register/reset; không ghi backend đã cưỡng chế regex này |
| Phân trang | Backend đã bật `PageSerializationMode.VIA_DTO`; FE đọc `{ content, page: {...} }` | Dùng `normalizePage` hiện có, trả `Page<T> { items, page, size, totalItems, totalPages }`; không chép shape khác từ ví dụ cũ |
| Sửa review | PUT nhận `ReviewRequest` bắt buộc `productId`, `orderItemId`, nhưng history chỉ trả `productId`, không trả `orderItemId` | **Chặn riêng phần sửa D10 đến khi sửa contract backend**; xem D10. Không bịa ID hoặc phụ thuộc dữ liệu còn trong RAM từ lần tạo |
| Tạo review | `createReview` kiểm tra trùng và tìm entity, nhưng chưa thấy kiểm tra order item thuộc user, đơn DELIVERED và product/variant khớp item | Cần backend bổ sung kiểm tra nghiệp vụ trước khi nghiệm thu tạo review đầy đủ. UI chỉ cho chọn từ pending list không thay thế kiểm tra server |
| Null trong DTO | `OrderItemResponse.variantId` có thể null; `ReviewResponse.productId` có thể null khi sản phẩm bị xóa; pending review chưa map `productImage` | Type/fallback phải phản ánh null; không tạo link sản phẩm từ `variantId` |
| Tạo yêu cầu trả hàng | `createReturnRequest` lưu request PENDING nhưng **không đổi order sang RETURN_REQUESTED** | Hiện thành công từ `ReturnRequestResponse`, refetch đơn nhưng không tự gán trạng thái đơn. Muốn đúng kỳ vọng master phải phối hợp backend |
| Xem lại yêu cầu trả hàng | Customer controller chỉ có POST, không có GET list/detail | Không tạo trang theo dõi giả. Sau reload không hứa khôi phục trạng thái pending; 409 được xử lý rõ |
| Timeline đơn | DTO chỉ có `createdAt`, `updatedAt`, `cancelledAt`; không có lịch sử từng lần chuyển trạng thái | Hiện tiến trình/trạng thái hiện tại, chỉ gắn thời gian có thật; `updatedAt` không phải ngày giao hàng chắc chắn |
| Tài khoản bị khóa | D4 nhận diện HTTP 400 với thông báo `This account has been locked. Please contact support` có hoặc không có dấu chấm cuối | Client chỉ clear phiên khi Bearer token của request còn khớp phiên hiện tại. Provider hiển thị thông báo qua sự kiện `locked` |

Nguồn đối chiếu backend, tính từ `../ecommerce-backend/src/main/java/com/ecommerce/backend/`:

- `modules/auth/controller/UserController.java`, `modules/auth/dto/request/{UpdateProfileRequest,ChangePasswordRequest}.java`, `modules/auth/service/UserServiceImpl.java`.
- `modules/order/controller/OrderController.java`, `modules/order/dto/response/`, `modules/order/service/OrderServiceImpl.java`.
- `modules/review/controller/ReviewController.java`, `modules/review/dto/{request,response}/`, `modules/review/service/ReviewServiceImpl.java`.
- `modules/wishlist/controller/WishlistController.java`, `modules/wishlist/service/WishlistServiceImpl.java`.
- `modules/returnrequest/controller/ReturnRequestController.java`, `modules/returnrequest/service/ReturnRequestServiceImpl.java`, `common/utils/FileValidator.java`.
- `EcommerceBackendApplication.java` xác nhận VIA_DTO. Đây là source tham chiếu chỉ đọc; yêu cầu tạo kế hoạch chưa bao gồm sửa backend.

## 3. Route và tổ chức code

### 3.1 Route đích

Tất cả route `/account/*` dùng `RequireAuth` chung và nằm trong StorefrontLayout. Giữ URL hồ sơ/địa chỉ hiện tại; không tự giới hạn chỉ role CUSTOMER khi backend hiện cho người dùng đã xác thực quản lý dữ liệu của họ.

| Route frontend | Mốc | Nội dung |
|---|---|---|
| `/account` | D1 | Redirect `replace` tới `/account/profile` |
| `/account/profile` | D1–D2 | Hồ sơ và chỉnh sửa |
| `/account/addresses` | D1 | Sổ địa chỉ hiện có |
| `/account/password` | D3 | Đổi mật khẩu |
| `/account/orders?status=&page=` | D4 | Lịch sử, lọc trạng thái, phân trang |
| `/account/orders/:id` | D5–D8 | Chi tiết và thao tác sau mua |
| `/account/reviews?tab=pending\|history` | D9–D10 | Chờ đánh giá/đã đánh giá |
| `/account/wishlist` | D11 | Danh sách yêu thích |
| `/account/returns/new?orderId=&orderItemId=` | D12 | Yêu cầu trả hàng cho một dòng đơn |

`orderId` bổ sung vào URL trả hàng so với master để reload có thể GET chi tiết đơn rồi tìm `orderItemId`; không có API đọc order item riêng. URL chỉ có `orderItemId` mà thiếu ngữ cảnh hợp lệ phải hướng về danh sách đơn để chọn lại.

Cây route dự kiến:

```text
StorefrontLayout
└── account — RequireAuth bọc AccountLayout có Outlet
    ├── index → profile
    ├── profile / addresses / password
    ├── orders / orders/:id
    ├── reviews
    ├── wishlist
    └── returns/new
```

Chỉ thêm link/menu khi route đã dùng được. `/checkout/success/:orderId` và `/payment/result` tiếp tục public cho guest, không chuyển vào AccountLayout.

### 3.2 File dùng lại và file mới

| Phạm vi | File chính |
|---|---|
| Điều hướng | Sửa `src/app/router.tsx`, `src/shared/auth/redirect.ts`, `src/features/auth/components/UserMenu.tsx`; tạo `src/app/layouts/AccountLayout.tsx` |
| Hồ sơ/mật khẩu | Mở rộng `src/features/auth/{types,schemas,api,queries}.ts`, `pages/ProfilePage.tsx`; thêm `components/ProfileForm.tsx`, `components/ChangePasswordForm.tsx`, `pages/ChangePasswordPage.tsx` |
| Đơn hàng | Mở rộng `src/features/orders/{types,api,queries}.ts` đã có từ D4. Thêm `pages/OrderDetailPage.tsx` ở D5, schema và components theo từng mốc sử dụng |
| Đánh giá | Tạo `src/features/reviews/{types,api,queries,schemas,index}.ts`, `pages/ReviewsPage.tsx`, cards/form |
| Yêu thích | Tạo `src/features/wishlist/{types,api,queries,index}.ts`, `pages/WishlistPage.tsx`, `components/WishlistToggleButton.tsx`, grid/card |
| Trả hàng | Tạo `src/features/returns/{types,api,queries,schemas}.ts`, `pages/ReturnRequestPage.tsx`, `components/ReturnRequestForm.tsx` |
| Payment/checkout | Mở rộng có giới hạn `src/features/payment/redirect.ts`, `components/PaymentResultView.tsx`, nơi điều phối kết quả; `src/features/checkout/queries.ts`, `pages/CheckoutSuccessPage.tsx` |
| Dùng chung | `src/shared/api/queryKeys.ts`, `src/lib/format.ts`; tạo StatusBadge, ConfirmDialog, ImageDropzone tại mốc đầu tiên sử dụng |

Không chuyển toàn bộ auth sang feature account mới. Chỉ xuất `index.ts` khi có feature khác sử dụng; không import vòng `orders ↔ reviews ↔ returns`. Shared không import ngược features. D4 đã chuyển `Pagination` sang `src/shared/components/Pagination.tsx` để catalog và đơn hàng dùng chung với nhãn phù hợp từng trang.

## 4. Quy ước dữ liệu, cache và xử lý lỗi

### 4.1 Các nguyên tắc dùng xuyên suốt

- Mọi ID giữ `string`, kể cả URL, payload, Set và query key. Kiểm tra định dạng chuỗi số khi nhận URL; không `Number(id)`/`parseInt(id)`.
- Số tiền lấy từ response backend, hiển thị `formatVND`. Ngày giờ dùng `Intl.DateTimeFormat` với `Asia/Ho_Chi_Minh`; chưa cần cài date library chỉ để hiển thị.
- URL đơn hàng dùng `status`, API dùng **`orderStatus`**. URL page bắt đầu từ 1, API từ 0. Kiểm tra enum/page, reset page khi đổi status; cố định `size=10`, `sortBy=createdAt`, `direction=desc` ở bản đầu.
- Query private chỉ enabled khi có userId và token còn hạn; truyền AbortSignal qua API khi cần hủy request. Loading, error, empty và dữ liệu cũ đang refetch là các trạng thái riêng.
- Mọi mutation mới `retry: false`, khóa gửi lặp trong thời gian pending. Với thao tác không nên xếp hàng offline như mua lại, dùng chính sách không tự phát lại khi reconnect như checkout hiện có.
- Chụp `userId`/token khi bắt đầu mutation; kiểm tra trước khi dispatch và sau mỗi đoạn chờ trước khi ghi cache, rollback, toast hoặc navigate. Có thể dùng `meta.authToken` để gắn token đã chụp, nhưng vẫn cần kiểm tra phiên; không lạm dụng `checkoutSession` cho mọi feature.
- Response của phiên A không cập nhật UI/cache phiên B, cũng không khôi phục cache A sau logout. `useSession.clear()` đã clear QueryClient; không tạo cơ chế logout/cache khác.
- Map `ApiError.fieldErrors` vào field hợp lệ, lỗi còn lại ở form/banner. 403/404 có trang lỗi phù hợp. Dùng nhánh xử lý tài khoản bị khóa đã có trong client D4 và thông báo của Provider.

### 4.2 Query keys đề xuất

Bổ sung từng key vào `queryKeys.ts` khi cần, giữ nguyên các key đang dùng. Ví dụ hình dạng cache, không phải yêu cầu tạo tất cả ngay D1:

```ts
[...qk.me, userId]
[...qk.cart, userId]
[...qk.addresses, userId]
[...qk.orders, userId, "list", normalizedParams]
[...qk.orders, userId, "detail", orderId]
[...qk.reviews, userId, "pending"]
[...qk.reviews, userId, "history"]
[...qk.wishlist, userId]
```

Không đặt token vào query key. Nếu giữ dữ liệu trang trước, chỉ giữ trong cùng tài khoản; không dùng `keepPreviousData` vô điều kiện qua đổi user.

| Sau thao tác thành công | Cache cần cập nhật |
|---|---|
| Sửa hồ sơ | Invalidate `me` đúng user, GET lại vì PUT chỉ trả message |
| Đặt đơn user tại checkout | Invalidate danh sách orders của đúng user, giữ nguyên cleanup giỏ hiện có |
| Hủy đơn | Set detail bằng response; invalidate mọi list filter/page của user; refresh dữ liệu tồn kho/cart đang liên quan nếu cần |
| Kết quả thanh toán | Làm mới order detail/list từ GET có auth khi có thể xác minh đơn thuộc phiên hiện tại; không gọi lại return endpoint để refresh UI |
| Mua lại | Set cart đúng user từ `res.cart`; phối hợp với các cart mutation đang chạy để response cũ không ghi đè |
| Tạo/sửa/xóa review | Invalidate pending/history; invalidate catalog detail/list/compare liên quan vì averageRating có thể đổi |
| Wishlist | Optimistic theo productId, rollback có kiểm soát; refetch danh sách chuẩn sau mutation |
| Tạo trả hàng | Giữ response xác nhận; invalidate order detail/list. Không suy ra orderStatus đã đổi nếu backend chưa đổi |

## 5. Lộ trình triển khai

| Mốc | Kết quả | Phụ thuộc | Trạng thái |
|---|---|---|---|
| D0 | Contract và dữ liệu kiểm tra được ghi rõ | Source hiện tại | Bỏ qua mốc riêng theo quyết định người dùng ngày 08/11/2026; kiểm tra tại từng chức năng, chưa ghi nhận đã thử API |
| D1 | AccountLayout, route lồng nhau, quay lại đúng trang sau login | Auth hiện có | Đã code và review ngày 08/11/2026; lint/build/typecheck đạt; chờ xác nhận kiểm thử trình duyệt |
| D2 | Sửa hồ sơ | D1 | Đã code ngày 08/11/2026; lint/build và 7 kiểm tra Node đạt; chờ kiểm thử backend/trình duyệt |
| D3 | Đổi mật khẩu | D1 | Người dùng báo hoàn thành. Code tại `cafca17`, sửa lỗi lint tại `427e9d0`. Lint và typecheck đạt ngày 11/11/2026. Chưa ghi kết quả backend/trình duyệt từng ca |
| D4 | Lịch sử đơn, lọc/phân trang | D1 | Người dùng xác nhận đã làm. Code tại `427e9d0`, lint và typecheck đạt ngày 11/11/2026. Chưa ghi kết quả backend/trình duyệt từng ca |
| D5 | Chi tiết đơn, trạng thái và đường vào từ checkout | D4 | Đã triển khai trang chi tiết và đường dẫn sau checkout. Lint, build và 16 ca kiểm tra logic checkout đạt. Chờ kiểm thử tích hợp |
| D6 | Hủy đơn có lý do | D5 | Đã có code trong `17a38d8`. Chưa ghi nhận kết quả kiểm thử tích hợp |
| D7 | Thanh toán lại đơn đã có | D5, payment C12 | Đã triển khai và kiểm tra bằng API giả lập. Chờ thử trình duyệt với backend và VNPay Sandbox |
| D8 | Mua lại vào giỏ user | D5, cart C2–C5 | Đã triển khai. Lint, build và kiểm thử giả lập đạt. Chờ thử với backend trên trình duyệt |
| D9 | Pending/history và tạo đánh giá | D1, dữ liệu DELIVERED; D5 để nối CTA | Chưa làm; cần kiểm tra nghiệp vụ backend |
| D10 | Sửa/xóa đánh giá | D9 | Chưa làm; sửa bị vướng contract |
| D11 | Wishlist và nút tim ở catalog | D1, catalog | Chưa làm |
| D12 | Tạo yêu cầu trả hàng và gửi ảnh | D5, dữ liệu DELIVERED | Chưa làm; giới hạn theo mục 2.1 |
| D13 | Hồi quy, ghi nhận phạm vi hoàn thành và bàn giao P5 | Các mốc trên | Chưa làm |

Thứ tự thực hiện từ 08/11/2026: D1 → D2 → D3 → D4 → D5 → D6 → D7 → D8 → D9 → D10 → D11 → D12 → D13. D0 được bỏ qua như một mốc riêng. Nếu backend chưa gỡ phần sửa review, ghi rõ D10 còn thiếu và tiếp tục D11/D12; không chặn cả phase vì một endpoint.

### D0 — Chốt contract và chuẩn bị dữ liệu

**Trạng thái — 08/11/2026:** bỏ qua theo quyết định người dùng. Nội dung dưới đây giữ làm tài liệu tham khảo; không yêu cầu hoàn thành checklist D0 trước D1. Kiểm tra contract và chuẩn bị dữ liệu cần thiết khi triển khai từng chức năng. Không coi quyết định bỏ qua là xác nhận API đã được kiểm thử.

**Mục tiêu:** biết endpoint, trường dữ liệu và điều kiện nào có thật trước khi viết form/mutation.

- Đọc controller/DTO/service tương ứng theo mục 2.1; kiểm tra Network/Swagger khi backend hoạt động. Ghi JSON thực tế của page orders, cờ hành động, null và `productDeleted`/`inStock` trước khi chốt type.
- Chuẩn bị hai tài khoản customer để kiểm tra tách dữ liệu, một tài khoản quản trị phục vụ tạo trạng thái đơn qua API hiện có. Giao diện admin chưa có nghiệp vụ, không phải điều kiện phải làm P5 trước.
- Chuẩn bị đơn PENDING/PROCESSING, đơn UNPAID có `canPay`, đơn PAID có `canCancel`, đơn DELIVERED trong hạn và quá hạn trả hàng; sản phẩm hết hàng/ngừng bán; review pending/history.
- Người dùng dùng API admin có quyền trong môi trường phát triển để chuyển trạng thái hợp lệ và tạo dữ liệu thử. Không cần sửa database trực tiếp hoặc giả cờ hành động trên FE.
- Ghi các phụ thuộc backend của D9/D10/D12. Kiểm tra giới hạn multipart thực tế của môi trường: source validator cho 5 MB/file nhưng chưa thấy cấu hình `spring.servlet.multipart.max-*` trong file properties đã khảo sát; không mặc định tổng request 25 MB sẽ được chấp nhận.

**Hoàn thành khi:** có mẫu request/response cho module sắp triển khai và bộ dữ liệu cần thiết, hoặc ghi rõ thiếu dữ liệu nào. D1–D3 có thể bắt đầu trong lúc chuẩn bị dữ liệu hậu mãi.

### D1 — AccountLayout và điều hướng

**Trạng thái — 08/11/2026:** người dùng đã triển khai bốn file theo hướng dẫn. Review source chưa phát hiện lỗi cần sửa trong phạm vi D1; lint, build (gồm typecheck) và whitespace check đạt. Chưa tự chạy browser/backend hoặc nhận xác nhận kiểm thử từ người dùng; không giao lại phần code đã có.

**Kết quả:** hồ sơ và địa chỉ cùng nằm trong khu vực tài khoản, mở trực tiếp/reload được.

**File:** router, AccountLayout mới, UserMenu, `shared/auth/redirect.ts`.

**Thực hiện:** tạo sidebar/menu responsive và Outlet; chuyển hai route đang có vào nhóm account với một RequireAuth chung; `/account` redirect tới profile. Mở rộng whitelist `getLoginDestination` cho các route đã triển khai, giữ search/hash và kiểm tra same-origin; thêm dần route khi làm D3–D12. Không nới thành chấp nhận mọi URL hoặc mọi chuỗi bắt đầu bằng `/account`.

**Học:** nested route, Outlet, NavLink và guard; URL trang khác URL gọi API.

**Kiểm tra:** guest mở thẳng `/account/addresses` → login → quay đúng trang; hồ sơ/địa chỉ có header/footer một lần; menu có trạng thái active, dùng được bằng bàn phím và trên mobile; CRUD địa chỉ và lựa chọn địa chỉ checkout còn hoạt động.

**Commit:** `feat(account): add account layout and navigation`.

### D2 — Chỉnh sửa hồ sơ

**Kết quả:** sửa họ tên/SĐT, lưu thật và reload vẫn thấy dữ liệu mới.

**File:** auth types/schema/API/hooks, ProfilePage, ProfileForm mới.

**Contract:** GET `/api/users/me` → `UserProfileResponse`; PUT cùng URL nhận `{ fullName, phone? }` → `MessageResponse`. Backend bắt buộc họ tên, SĐT nếu có phải khớp `^(0|\+84)[0-9]{9}$`. Chuỗi rỗng không khớp regex: chuẩn hóa field SĐT trống thành bỏ field/null theo DTO đã xác nhận; service hiện gán lại phone nên bỏ field cũng có thể xóa giá trị cũ.

**Thực hiện:** email chỉ đọc; điền form từ query đã tải. Chỉ reset khi khởi tạo, đổi tài khoản hoặc lưu thành công; không để background refetch ghi đè nội dung người dùng đang sửa. Thành công invalidate `me` đúng user, lấy dữ liệu mới rồi reset dirty state. Không dùng profile DTO để thay session user vì profile không có role/status.

**Học:** defaultValues/reset, dirty state, mutation trả message và invalidate query.

**Kiểm tra:** hồ sơ có null, họ tên toàn khoảng trắng, SĐT sai, xóa SĐT cũ, fieldErrors, mất mạng giữ form, pending chặn submit, response muộn sau đổi tài khoản không ghi nhầm.

**Commit:** `feat(account): edit customer profile`.

**Cập nhật — 08/11/2026:** người dùng đã bổ sung types/schema/API/hooks và yêu cầu triển khai phần còn lại. Đã thêm ProfileForm, nối ProfilePage và kiểm tra logic bằng `npm run verify:profile`. Form giữ nội dung khi refetch nền/lỗi, khóa gửi lặp, map fieldErrors và bỏ field phone khi xóa SĐT. PUT thành công nhưng GET lại lỗi có nút tải lại chỉ gửi GET, không gửi lại PUT. Chưa xác nhận API thật hoặc reload trình duyệt; xem bàn giao cuối tài liệu.

### D3 — Đổi mật khẩu

**Trạng thái — 11/11/2026.** Đã triển khai tại `cafca17`, người dùng báo hoàn thành. Submit handler đã được sửa trong `427e9d0`. Lint và typecheck đạt. Chưa ghi kết quả backend/trình duyệt từng ca.

**File:** auth types/schema/API/hooks, ChangePasswordForm/Page; dùng lại PasswordInput và `newPasswordSchema`.

**Contract:** POST `/api/users/change-password` với `{ currentPassword, newPassword, confirmPassword }`, có Bearer → `MessageResponse`. Đây là đổi mật khẩu của phiên hiện tại, khác reset password bằng token email.

**Thực hiện:** current password chỉ bắt buộc, mật khẩu mới theo schema hiện có, confirm phải khớp; `autocomplete` phù hợp. Lỗi `Incorrect current password.` đặt vào currentPassword; lỗi khác ở form. Thành công xóa giá trị các ô và báo kết quả. Service hiện không trả token mới hoặc thu hồi tất cả JWT; giữ phiên hiện tại, không hứa các thiết bị khác đã bị đăng xuất. Không lưu password vào URL/storage/query key/log.

**Kiểm tra:** mật khẩu cũ sai, confirm sai, mật khẩu mới không đạt schema, submit lặp, lỗi mạng; sau thành công người dùng logout rồi login bằng mật khẩu mới, mật khẩu cũ bị từ chối. Không dùng việc vẫn giữ JWT cũ để kết luận đổi mật khẩu thất bại.

**Commit:** `feat(account): change account password`.

### D4 — Lịch sử đơn hàng

**Trạng thái — 11/11/2026.** Người dùng xác nhận đã làm D4 tại commit `427e9d0`. Lint và typecheck đạt. Xem bàn giao cuối tài liệu để biết các ca tích hợp còn cần ghi kết quả.

**File:** orders types/API/queries, OrdersPage, OrderStatusTabs, OrderCard, `qk.orders` và `Pagination` dùng chung.

**Contract:** GET `/api/orders?orderStatus=&page=0&size=10&sortBy=createdAt&direction=desc` → page `OrderListUserResponse`. Bỏ `orderStatus` khi chọn tất cả; không gửi literal `ALL`. Dùng đủ enum trạng thái hiện có, gồm ba trạng thái trả hàng.

**Thực hiện:** URL điều khiển tab/page; không lọc client trên một trang server. Card hiển thị mã đơn, ngày, tổng tiền, số lượng và hai badge riêng order/payment. Chưa gắn mutation D6–D8 ở mốc này. Thêm format ngày và badge khi dùng. Không suy đoán tổng số đơn mỗi tab từ trang hiện tại.

**Lỗi locked:** `src/shared/api/client.ts` kiểm tra HTTP 400, nội dung thông báo và token đã gửi trước khi clear phiên. `src/app/providers.tsx` hiển thị thông báo khóa tài khoản khi nhận sự kiện `session-cleared` với lý do `locked`.

**Kiểm tra:** tất cả/trạng thái rỗng, page đầu/cuối, URL sai, Back/Forward/reload, response chậm khi đổi tab, tài khoản A/B, expired/locked và lỗi mạng. Page ngoài phạm vi sau mutation phải có cách về trang hợp lệ.

**Commit:** `feat(orders): add paginated order history`.

### D5 — Chi tiết đơn và nối đường đi sau checkout

**File:** OrderDetailPage, OrderTimeline/OrderItems/OrderActions; orders API/query; CheckoutSuccessPage, checkout mutation và PaymentResultView khi nối link.

**Contract:** GET `/api/orders/{id}` → `OrderDetailUserResponse`. Chỉ mở nút hủy/thanh toán/mua lại khi cờ `canCancel`, `canPay`, `canBuyAgain` tương ứng là true; mutation vẫn phải xử lý trường hợp trạng thái server đã đổi.

**Thực hiện:** hiển thị người nhận, địa chỉ, ảnh/SKU/giá/số lượng từng item, subtotal/phí/giảm giá/tổng, thông tin hủy. ID item là orderItemId, không phải productId. Timeline chỉ có thời gian backend cung cấp, không giả ngày xử lý/giao hàng. Route sai ID không gọi API; 404 làm mới list và có đường về; đơn người khác có thể trả **400**, không chỉ 403.

Nối CTA “Xem đơn hàng” từ success khi xác nhận thuộc user hiện tại; guest vẫn xem snapshot public. Với payment result, không coi việc đang login hoặc `vnp_TxnRef` là bằng chứng sở hữu: chỉ đưa đường chi tiết theo dữ liệu/kiểm tra auth phù hợp, nếu chưa xác định thì về `/account/orders`. Không tự gắn đơn guest vào tài khoản vừa đăng nhập. Thêm invalidation list orders sau checkout user thành công, giữ guard phiên và cleanup nguồn hàng C10/C11.

**Kiểm tra:** mở đơn từ list và URL trực tiếp; item/ảnh/variant đã xóa; đơn guest/khác chủ không lộ chi tiết; snapshot checkout cũ khác server vẫn đọc GET trên trang chi tiết; không xuất hiện ngày timeline tự tạo.

**Commit:** `feat(orders): show order details and purchase links`.

### D6 — Hủy đơn có lý do

**File:** CancelOrderDialog, order schema/API/mutation; ConfirmDialog chỉ tách chung nếu thực sự dùng lại.

**Contract:** chọn thống nhất **PUT** `/api/orders/{id}/cancel`, body `{ reason }` → chi tiết đơn mới. Không gọi cả PUT và POST dù backend hỗ trợ hai method.

**Thực hiện:** hiện khi canCancel; lý do trim không rỗng; dialog có label/focus/đóng bằng bàn phím, disable xác nhận khi pending. Thành công cập nhật detail, invalidate list và hiện message backend. Đơn đã trả tiền có thể chuyển `PENDING_REFUND`; không hiện “đã hoàn tiền” hoặc tự đổi thành REFUNDED.

**Kiểm tra:** hủy UNPAID/PAID, lý do rỗng, click hai lần, đơn chuyển SHIPPED khi dialog còn mở, 404 và lỗi mạng. Nếu timeout chưa rõ kết quả, GET lại đơn trước khi cho gửi lại; không tự retry mutation.

**Commit:** `feat(orders): cancel orders with a reason`.

### D7 — Thanh toán lại

**File:** orders API/mutation/action, `payment/redirect.ts`, tích hợp kết quả với order query.

**Contract:** POST `/api/orders/{id}/pay` → `OrderPaymentResponse { orderId, paymentStatus, paymentMethod, totalPrice, message, paymentUrl }`. Nút dựa trên canPay; source hiện không giới hạn canPay theo phương thức VNPAY, cần thử cả đơn COD được backend cho thanh toán online.

**Thực hiện:** điều chỉnh kiểu input của `getVnpayRedirectUrl` thành cấu trúc tối thiểu `{ orderId, paymentUrl }` dùng được cho cả checkout và pay response. Giữ kiểm tra protocol, origin backend, pathname và orderId; không ép kiểu `as CheckoutResponse`. POST pay xong mới full-page redirect; không tạo đơn checkout mới hoặc cleanup giỏ lần nữa. Pending chặn nhiều link cùng lúc; response sau đổi phiên không redirect.

Giữ luồng `/payment/result` public, query nguyên vẹn, không token/retry/refetch tự động hiện có. Làm mới trạng thái đơn bằng GET orders, không bằng cách gọi lại return. “Already paid”/trạng thái đổi → refetch detail/list. URL thiếu/sai hoặc redirect lỗi có thông báo và đường về đơn, không báo thành công thanh toán.

**Kiểm tra:** UNPAID → cổng thanh toán → kết quả → GET detail mới; hủy/thất bại giữ đơn; already paid; thiếu URL/sai origin/sai orderId; đổi tài khoản khi chờ. Ghi riêng kết quả thử thật của D7, không dùng xác nhận C12 thay cho luồng mới này.

**Commit:** `feat(orders): retry payment for existing orders`.

### D8 — Mua lại

**File:** orders API/mutation, BuyAgainResultDialog; phối hợp cart query/khóa thao tác hiện có.

**Contract:** POST `/api/orders/{id}/buy-again` → `BuyAgainResponse` gồm message, hai nhóm tên item và `cart`. Thao tác này **cộng hàng vào giỏ**, không đặt đơn và không giống Buy Now.

**Thực hiện:** canBuyAgain mới mở nút; chặn lúc merge hoặc user còn dấu merge cần đối chiếu. Dùng khóa chung đủ để không chạy đồng thời với ghi cart làm response ghi đè nhau, không chỉ dựa vào pending của một instance hook. Set cache `[...qk.cart, userId]` từ response, mở dialog kết quả và CTA tới giỏ. Tồn kho có thể chỉ cho thêm một phần số lượng cũ; số item được thêm không chứng minh đã thêm đủ số lượng đặt trước, xem giỏ để xác nhận.

**Kiểm tra:** thêm đủ, một phần, không thêm được, variant đã xóa/hết hàng/ngừng bán; giỏ đã có item; badge cập nhật; double-click và đổi phiên. Timeout/5xx: làm mới dữ liệu giỏ, hiện link **Xem giỏ hàng** và yêu cầu xác nhận khi người dùng bấm **Mua lại** lần nữa cho cùng đơn. Không tự gửi lại POST. Không cam kết exactly-once qua reload/nhiều tab khi backend chưa có idempotency.

**Commit:** `feat(orders): add buy again with cart results`.

### D9 — Chờ đánh giá, lịch sử và tạo đánh giá

**File:** reviews types/API/queries/schema, ReviewsPage, PendingReviewCard, ReviewHistoryCard, ReviewForm; public exports cần cho OrderDetailPage.

**Contract:** GET `/api/reviews/me/pending`, GET `/api/reviews/me/history` → arrays; POST `/api/reviews` → **201 ReviewResponse**. Payload `{ rating, reviewText?, productId, productVariantId?, orderItemId }`; lấy ID từ pending response, không suy từ tên/SKU hay variantId của order detail.

**Thực hiện:** tab điều khiển bằng URL, loading/error/empty riêng. Rating 1–5; UI có thể chọn sao nguyên, DTO backend nhận Double nên không khẳng định server chỉ cho số nguyên. Nội dung tùy chọn, không có upload ảnh review. CTA đánh giá trong đơn chỉ có khi DELIVERED và item nằm trong pending list. Refresh pending khi cần xác minh điều kiện.

Tạo thành công invalidate pending/history và catalog rating liên quan. 409 đã đánh giá → refetch; 400 nội dung cấm/link → lỗi nội dung; 404 entity mất → reload danh sách. History hỗ trợ productDeleted/productId null; pending image null có placeholder. Yêu cầu backend bổ sung kiểm tra quyền sở hữu, trạng thái và liên kết item/product/variant như mục 2.1 trước khi nghiệm thu nghiệp vụ tạo đánh giá.

**Học:** hai nguồn query theo tab, dữ liệu chọn làm payload, controlled rating với form và cache liên quan.

**Kiểm tra:** gửi hợp lệ, 0/6 sao, nội dung bị chặn, trùng review, sản phẩm mất, reload tab, gửi khi đơn chưa DELIVERED hoặc item thuộc user khác bị **backend** từ chối sau khi sửa. Phân biệt kết quả UI với kiểm tra nghiệp vụ server.

**Commit:** `feat(reviews): add pending reviews and review submission`.

### D10 — Sửa và xóa đánh giá

**Điều kiện phần sửa:** giải quyết thiếu `orderItemId` trong contract. Hướng ưu tiên: backend tách `UpdateReviewRequest` chỉ có `rating`, `reviewText?`, `imageUrl?`; PUT lấy quan hệ product/item từ review đang lưu và kiểm tra chủ sở hữu. Phương án khác là bổ sung đầy đủ ID quan hệ vào response history, nhưng không cần gửi lại quan hệ nếu chỉ sửa nội dung.

**File:** review API/mutation/schema/form, dialog xóa, history card. DELETE `/api/reviews/{reviewId}` trả **204**, không parse JSON. PUT endpoint cùng reviewId trả ReviewResponse sau khi chốt request mới.

**Thực hiện:** form sửa dùng giá trị review cũ; giữ imageUrl có sẵn nếu ảnh chưa thuộc UI chỉnh sửa, tránh vô tình xóa. Xác nhận trước khi xóa. Sau thành công invalidate pending/history và catalog; item có thể trở lại pending nếu còn đủ điều kiện. Không mặc định mọi review đã xóa đều trở lại pending nếu đơn đã chuyển trạng thái.

**Kiểm tra:** tải mới history rồi sửa được mà không cần đã tạo review trong tab đó; 403/404, nội dung không hợp lệ, lỗi giữ form, xóa 204; sản phẩm đã xóa vẫn hiển thị lịch sử phù hợp. Có thể hoàn thành xóa trước khi backend sửa contract, nhưng ghi D10 “một phần”, không chốt đủ CRUD.

**Commit:** `feat(reviews): edit and delete customer reviews` (hoặc tách commit xóa nếu phần sửa còn chờ).

### D11 — Wishlist và nút yêu thích

**File:** wishlist feature; ProductCard/PDP gọi qua public exports; route/menu account và login destination.

**Contract:** GET `/api/wishlists` → array; POST/DELETE `/api/wishlists/{productId}` → MessageResponse. Đường dẫn dùng **productId, không phải wishlist entry id hoặc variantId**. POST đã tồn tại vẫn trả thành công với message; DELETE không tồn tại có thể 404.

**Thực hiện:** bước đầu danh sách/xóa, sau đó dùng cùng query cho nút tim ở card/PDP. Tạo Set(productId) dẫn xuất từ cache; không persist thêm một wishlist store song song. Guest bấm tim mở lời nhắc đăng nhập, chuyển login với đích nội bộ hợp lệ rồi quay lại; mở whitelist catalog cần thiết ở mốc này. Không tự gửi thao tác thêm wishlist sau login nếu chưa có cơ chế intent rõ ràng.

Optimistic update có snapshot/rollback theo item, khóa trùng thao tác cùng productId trên mọi nơi render. Nếu cho hai sản phẩm cập nhật đồng thời, rollback A không được khôi phục toàn bộ list làm mất thành công B; có thể tuần tự hóa mutation wishlist ở bản đầu. POST chỉ trả message nên không bịa wishlist entry id/addedAt để coi là dữ liệu server: dùng trạng thái optimistic tạm, refetch để lấy item chuẩn. Khi query chưa tải xong, không hiểu thiếu dữ liệu là “chưa yêu thích”.

Wishlist là cấp sản phẩm, không có variantId đủ để thêm cart. CTA “Chọn phiên bản” mở PDP; chỉ thêm giỏ sau khi chọn variant qua luồng hiện có. Sản phẩm không ACTIVE/hết hàng khóa CTA mua, vẫn cho bỏ yêu thích. Nút tim có `aria-pressed`/nhãn và không lồng button trong Link.

**Kiểm tra:** card/PDP/list đồng bộ, nhấn nhanh, hai item đồng thời, rollback lỗi, DELETE 404 refetch, logout/đổi user khi request chậm, item hết hàng/inactive, guest quay lại đúng trang và không báo đã lưu khi chưa gửi API.

**Commit:** `feat(wishlist): add customer wishlist and product toggles`.

### D12 — Yêu cầu trả hàng và ảnh bằng chứng

**File:** returns feature, ReturnRequestPage/Form, ImageDropzone mới; link từng item trong chi tiết đơn.

**Contract:** POST multipart `/api/return-requests` → **201 ReturnRequestResponse**. Append `orderItemId`, `quantity`, `reason`, `description` nếu có và nhiều part cùng tên **`images`**. Để trình duyệt tạo Content-Type/boundary cho FormData.

**Thực hiện:** lấy orderId/orderItemId từ URL, GET chi tiết đơn có auth, tìm item thuộc đơn; không tin navigation state là dữ liệu chuẩn. Điều kiện gợi ý trên UI: DELIVERED, trong 7 ngày từ updatedAt theo service hiện tại; backend quyết định cuối cùng, đồng hồ client có thể lệch. Đây là hạn theo code hiện tại, không gọi updatedAt là deliveredAt.

Validate số lượng nguyên 1..item.quantity, lý do không rỗng, 1–5 file không rỗng, JPG/JPEG/PNG/WebP, tối đa **5 × 1024 × 1024 byte mỗi file**; kiểm tra giới hạn tổng request theo môi trường D0. Có preview, xóa/chọn lại và revoke object URLs khi bỏ ảnh/unmount. Không lưu File/base64 vào Zustand persist/localStorage.

Thành công hiện mã yêu cầu, trạng thái PENDING và dữ liệu response; khóa gửi lại trong màn hiện tại, refetch order. Source hiện chưa đổi orderStatus và chưa có GET request của customer: không ghi “đơn đã chuyển RETURN_REQUESTED”, không coi đơn còn DELIVERED là chưa từng gửi. 409 báo đã có yêu cầu. Sau reload chưa thể tải lại pending request từ server; hướng người dùng giữ mã yêu cầu/liên hệ cửa hàng. Muốn theo dõi đầy đủ cần backend bổ sung API đọc và thống nhất chuyển trạng thái; giữ ngoài phần FE có thể hoàn thành hiện tại.

**Kiểm tra:** hợp lệ, thiếu ảnh, 6 ảnh, sai loại/quá dung lượng, vượt số lượng, hết hạn, URL sửa ID, item khác chủ, gửi trùng, lỗi multipart/413 và lỗi mạng. Timeout chưa rõ kết quả không tự retry upload; vì chưa có API tra cứu, giữ trạng thái chưa xác nhận và hướng dẫn đối chiếu, không hứa GET order sẽ xác nhận được yêu cầu.

**Commit:** `feat(returns): submit return requests with evidence images`.

### D13 — Hồi quy và chốt Phase 4

**Phạm vi:** kiểm tra luồng liên kết đã triển khai, sửa hồi quy và ghi bàn giao cho P5. Không tự mở rộng sang xây admin, policy hoặc thiết kế lại toàn bộ storefront.

- Account → sửa hồ sơ/đổi mật khẩu/địa chỉ; URL trực tiếp và login quay lại đúng trang; dữ liệu A/B không lẫn nhau.
- Checkout user → xem đơn server → hủy/thanh toán lại/mua lại → giỏ/badge đúng. Guest checkout và payment result vẫn dùng được. Kết hợp các ca liên quan của C13, nhưng chỉ ghi C13 hoàn thành khi checklist riêng trong `phase3.md` được xác nhận.
- DELIVERED → pending review → tạo/sửa/xóa; wishlist trên nhiều màn hình; trả hàng gửi ảnh và xử lý đúng giới hạn backend.
- Kiểm tra mobile/desktop, tên sản phẩm/mã đơn dài, ảnh mất, form/dialog bằng bàn phím, focus quay về nút mở, lỗi có nhãn đọc được. Bổ sung title phù hợp trang tài khoản, không đưa thông tin cá nhân vào title.
- Các giới hạn phải còn được ghi rõ: review edit/validation nếu backend chưa sửa, không có lịch sử trả hàng, timeline thiếu timestamps, dữ liệu payment chưa xác minh, ca chưa thử.

Các lệnh kiểm tra khi đã thay đổi source:

```bash
npm run lint
npm run build
npm run verify:checkout
npm run verify:catalog
git diff --check
```

`build` đã gồm `tsc -b`; có thể chạy `npm run typecheck` trong lúc phát triển. Chạy `verify:checkout` khi sửa orders/payment/checkout/cart và `verify:catalog` khi sửa catalog/wishlist hoặc phần dùng chung liên quan; tại chốt phase chạy cả hai. Nếu cần kiểm tra tự động mới cho rollback wishlist, đổi phiên, payload review/return hoặc URL pagination, bổ sung kiểm tra hành vi vào cách chạy Node hiện có; không bắt buộc cài framework/CI mới.

**Hoàn thành khi:** các mốc đã nhận làm đạt kiểm tra tĩnh và luồng backend/browser tương ứng; bảng ghi rõ từng phần chưa hoàn thành/hoãn. Nếu D10 còn vướng contract thì chỉ ghi “hoàn thành phần FE khả dụng”, không ghi toàn bộ Phase 4 đạt đủ master plan. Bàn giao P5 với dữ liệu đơn và nghiệp vụ đã xác nhận.

**Commit:** `chore(account): verify phase 4 customer flows`.

## 6. Bảng kiểm thử tích hợp cần ghi kết quả

Tất cả hàng dưới đây **chưa chạy trong lượt lập kế hoạch**. Điền ngày, môi trường, kết quả và nguồn xác nhận khi thực hiện; không dùng checkbox đã tích để thay cho bằng chứng.

| Nhóm | Ca tối thiểu | Bằng chứng cần ghi |
|---|---|---|
| Route/session | Guest vào deep link, login quay lại; đổi A → B khi request đang chờ | URL cuối, dữ liệu hiển thị, không ghi cache nhầm |
| Hồ sơ | GET → PUT → GET; field lỗi và xóa SĐT | 08/11/2026: 7 kiểm tra logic Node đạt với QueryClient thật/API giả lập; chưa có payload/status API thật hoặc kết quả reload trình duyệt |
| Mật khẩu | Sai mật khẩu cũ; đổi thành công; login lại | Đã review source và đối chiếu backend ngày 09/11/2026. Lint và typecheck đạt ngày 11/11/2026 sau khi sửa submit handler. Chưa ghi status/response API hoặc kết quả đăng nhập từng ca |
| Orders | D4: lọc, phân trang, Back/Forward, reload, lỗi mạng và phiên locked. D5: chi tiết đơn khác chủ hoặc 404 | D4 đã triển khai và kiểm tra tĩnh ngày 11/11/2026. Cần ghi query params, response và kết quả UI/phiên khi kiểm thử tích hợp |
| Cancel | UNPAID và PAID; trạng thái đổi khi đang mở dialog | Response flags, CANCELLED/paymentStatus, message |
| Pay | Đơn đã có → VNPay → GET đơn; hủy/thất bại/already paid | Mã đơn thử, kết quả backend, giới hạn nhánh chưa chạy |
| Buy again | Đủ/một phần/không có hàng, timeout và double-click | Cart trước/sau, số request POST, kết quả đối chiếu |
| Reviews | Pending/history; tạo/409; sửa sau reload; xóa 204 | Payload đúng ID, cache hai tab, rating catalog; kiểm tra quyền tại backend |
| Wishlist | Hai vị trí render, rollback, hai item đồng thời, guest | ProductId dùng trong endpoint, state sau refetch |
| Returns | Hợp lệ, ảnh/số lượng/hạn sai, khác chủ, trùng 409 | Multipart field names, 201/4xx, request status và order status thực tế |
| Hồi quy P3 | User/guest COD và VNPay, địa chỉ, giỏ/merge | Checklist C13 liên quan, giữ nguyên nguồn xác nhận |
| UI/chất lượng | Mobile/desktop, keyboard/dialog, scripts | Kích thước thử, lỗi còn lại, lệnh và kết quả |

Không đưa Bearer token, mật khẩu hoặc URL thanh toán có chữ ký đầy đủ vào tài liệu/commit.

## 7. Mẫu bàn giao sau mỗi mốc

```text
Ngày / mốc:
Phạm vi đã làm và file chính:
Contract backend mới hoặc khác kế hoạch:
Luồng đã thử (method, endpoint, status, kết quả UI):
Nguồn xác nhận (tự chạy / người dùng xác nhận / chỉ đọc code):
Lệnh kiểm tra và kết quả:
Giới hạn, nhánh chưa thử hoặc phụ thuộc backend:
Commit đã tạo / nội dung commit gợi ý:
Bước tiếp theo:
```

### Bàn giao lập kế hoạch — 07/11/2026

- Đã đọc master plan, tiến độ Phase 3, source frontend liên quan và controller/DTO/service backend cho tài khoản, đơn hàng, review, wishlist, return request.
- Đã tạo lộ trình D0–D13, chỉ rõ phần có thể dùng lại, route/query keys, checklist và các chênh lệch contract ở mục 2.1.
- Đã kiểm tra liên kết tài liệu nội bộ, cặp code fence và whitespace bằng Git; working tree chỉ thêm `phase4.md`.
- Chưa triển khai source chức năng, chưa sửa backend, chưa tự thử trình duyệt/API/VNPay hoặc chạy lại build/lint trong lượt chỉ viết tài liệu này.
- Bước tiếp theo: D1 — đưa hồ sơ và sổ địa chỉ vào AccountLayout, cập nhật whitelist đích đăng nhập; chuẩn bị mẫu API/dữ liệu D0 theo module sắp làm.

### Cập nhật phạm vi — 08/11/2026

- Người dùng quyết định bỏ qua D0 vì đây là bước kiểm tra và chuẩn bị ban đầu. Không giao lại D0 như điều kiện bắt đầu Phase 4.
- Điểm tiếp tục là D1 — AccountLayout và điều hướng tài khoản. Đối chiếu API và chuẩn bị dữ liệu ngay tại chức năng cần dùng; các giới hạn backend đã ghi nhận vẫn là thông tin tham khảo cho mốc tương ứng.
- Chưa ghi nhận kiểm thử API/backend từ quyết định này; chỉ cập nhật kế hoạch, chưa triển khai source chức năng.

### Review D1 — 08/11/2026

- Đã đọc diff router, UserMenu, redirect whitelist và file AccountLayout mới; đối chiếu với RequireAuth/GuestOnly và StorefrontLayout hiện có.
- AccountLayout có menu NavLink responsive, trạng thái active và Outlet. Router gom profile/addresses dưới một RequireAuth, index redirect tới profile bằng replace. UserMenu trỏ tới `/account`; whitelist chấp nhận các route account đang có và giữ search/hash cho đích hợp lệ.
- Chưa phát hiện lỗi cần sửa trong phạm vi thay đổi D1. Không sửa source chức năng trong lượt review.
- `npm run lint`, `npm run build` (gồm `tsc -b`) và whitespace check đạt, gồm file AccountLayout chưa được Git track. Build còn cảnh báo chunk > 500 kB (index khoảng 845 kB, HeroScene khoảng 1.000 kB).
- Chưa tự thử browser/backend; chờ người dùng xác nhận mở `/account`, chuyển menu/reload, guest → login → quay lại địa chỉ, giữ search/hash, logout, mobile/bàn phím và hồi quy địa chỉ/checkout.
- Chưa commit/push. Sau khi kiểm thử đạt, chốt D1 với commit gợi ý `feat(account): add account layout and navigation`, rồi tiếp tục D2.

### Triển khai D2 — 08/11/2026

- Người dùng đã thêm auth types/schema/API/hooks và yêu cầu triển khai phần còn lại. Đã thêm `src/features/auth/components/ProfileForm.tsx`, nối vào `pages/ProfilePage.tsx`; bổ sung `scripts/verify-profile.cjs` và lệnh `npm run verify:profile`.
- Form sửa họ tên/SĐT, email chỉ đọc; nullable profile được chuyển thành ô trống. Payload phone trống được bỏ field theo DTO/service backend đã đọc; chưa xác nhận hành vi này bằng API thật.
- Form chỉ reset từ hồ sơ GET sau lưu hoặc sau lần tải lại do người dùng yêu cầu khi PUT đã thành công. Refetch nền/lỗi không tháo form hoặc ghi đè nội dung đang nhập. Có khóa gửi lặp, lỗi theo field/root, kiểm tra phiên và unmount trước khi cập nhật form/thông báo.
- Nếu PUT thành công nhưng GET lại thất bại, giữ nội dung, thông báo đã lưu và cung cấp nút chỉ tải lại hồ sơ; tạm khóa chỉnh sửa/gửi PUT cho đến khi xác nhận được dữ liệu mới.
- `npm run lint`, `npm run build` (gồm `tsc -b`), `npm run verify:profile` (7/7) và `git diff --check` đạt; file mới cũng đã kiểm tra whitespace. Build còn cảnh báo chunk > 500 kB như D1 (index khoảng 850 kB, HeroScene khoảng 1.000 kB).
- Kiểm tra Node dùng schema thật, MutationObserver/QueryClient thật và API giả lập: trim/validation, PUT → GET và cache đúng user, PUT lỗi giữ fieldErrors, GET lỗi sau PUT rồi tải lại, phiên đổi trước submit, đổi user khi PUT chậm, logout khi GET chậm không khôi phục cache. Đây là kiểm tra logic, không phải kết quả UI hoặc backend thật.
- Chưa chạy kiểm thử backend/trình duyệt hoặc nhận xác nhận của người dùng. Cần thử `/account/profile`: nhập/sửa/lưu/reload, null, tên trắng/SĐT sai, xóa SĐT cũ, lỗi mạng/fieldErrors, chặn gửi lặp, refetch nền, đổi tài khoản và mobile/bàn phím. Chưa chốt D2 hoàn thành đầy đủ, chưa thay trạng thái kiểm thử D1.
- Chưa commit/push. Commit gợi ý sau khi kiểm thử đạt: `feat(account): edit customer profile`. Bước tiếp theo: xác nhận backend/trình duyệt D2, sau đó D3 — đổi mật khẩu.

### Review D3 — 09/11/2026

- Người dùng báo đã hoàn thành D3 và yêu cầu review/cập nhật tiến độ. Code nằm trong commit `cafca17` — `feat(account): change account password`; working tree sạch khi bắt đầu review. Commit D1 `01fed8f` và D2 `6542311` cũng đã có; việc có commit không thay thế xác nhận kiểm thử còn chờ ở các bàn giao trước.
- Đã review auth types/schema/API/hooks, `components/ChangePasswordForm.tsx`, `pages/ChangePasswordPage.tsx`, router, AccountLayout và whitelist đích đăng nhập. Route `/account/password` nằm dưới RequireAuth chung; menu và đích quay lại sau login đã nối.
- Đối chiếu source backend: POST `/api/users/change-password` nhận `{ currentPassword, newPassword, confirmPassword }` có Bearer, trả HTTP 200 MessageResponse; lỗi mật khẩu cũ là `Incorrect current password.`. Regex mật khẩu mạnh vẫn đang comment ở backend; frontend dùng `newPasswordSchema` hiện có. Service không cấp token mới hoặc thu hồi toàn bộ JWT, nên form giữ phiên hiện tại.
- Form không trim mật khẩu; validate confirm, dùng PasswordInput/autocomplete đúng trường; map lỗi mật khẩu cũ vào currentPassword và validationErrors vào field hợp lệ, lỗi khác ở form. Có khóa gửi lặp, kiểm tra user/token và mounted trước khi cập nhật form/thông báo. Thành công reset các ô. Mutation không retry, dùng networkMode always để không xếp hàng chờ reconnect và gcTime 0; form reset mutation sau xử lý.
- **Lỗi cần sửa trước khi chốt:** `npm run lint` thất bại với 1 lỗi `react-hooks/refs` tại `src/features/auth/components/ChangePasswordForm.tsx:143`, biểu thức `onSubmit={handleSubmit(onSubmit)}`. Hướng sửa: thay bằng `onSubmit={(event) => { void handleSubmit(onSubmit)(event) }}` như ProfileForm, để gọi handleSubmit trong callback sự kiện. Chưa sửa source chức năng trong lượt chỉ review/cập nhật tài liệu này.
- Đã kiểm tra bản thay submit handler đề xuất bằng ESLint qua stdin với đúng filename: đạt. Đây là kiểm tra nội dung sửa đề xuất trong bộ nhớ; file source trên đĩa chưa thay đổi, nên kết quả lint toàn repo hiện vẫn là thất bại.
- `npm run build` (gồm `tsc -b`) đạt; build còn cảnh báo chunk > 500 kB như trước (index khoảng 853 kB, HeroScene khoảng 1.000 kB). `npm run verify:profile` đạt 7/7, là hồi quy D2 trên auth dùng chung, không phải kiểm thử D3/backend. `git diff HEAD^ HEAD --check` đạt cho commit D3.
- Chưa tự chạy backend/trình duyệt; xác nhận hoàn thành của người dùng chưa kèm kết quả riêng cho sai mật khẩu cũ, đổi thành công rồi logout/login mới/cũ, submit lặp, lỗi mạng, guest quay lại route, đổi phiên và mobile/bàn phím. Không ghi các ca này đã đạt hoặc suy ra D1/D2 đã được kiểm thử.
- Chỉ cập nhật `phase4.md`, không tạo commit hoặc push trong lượt review. Bước tiếp theo: sửa submit handler và chạy lại lint; ghi kết quả kiểm thử tích hợp D3 khi có, rồi tiếp tục D4 — lịch sử đơn, lọc trạng thái và phân trang. D4 chưa được triển khai trong lượt này.

### Bàn giao D4 — 11/11/2026

- Người dùng xác nhận đã làm D4. Commit `427e9d0` (`feat(orders): add paginated order history`) thêm `/account/orders` dưới `AccountLayout`, link trong menu tài khoản và đích quay lại sau đăng nhập.
- Danh sách dùng `GET /api/orders` và `normalizePage`. URL giữ `status` và `page` bắt đầu từ 1, API nhận `orderStatus` và `page` bắt đầu từ 0. Đổi tab về trang đầu. Sau khi tải được dữ liệu, trang vượt phạm vi được đưa về trang cuối hợp lệ. Query danh sách dùng tiền tố `[...qk.orders, userId, "list"]`.
- Cùng commit sửa `react-hooks/refs` ở submit handler D3. Đã chạy `npm run lint` và `npm run typecheck` trên `427e9d0`, cả hai đều đạt.
- Chưa ghi kết quả API/trình duyệt cho các ca lọc, phân trang, Back/Forward, reload, lỗi mạng, hết hạn, khóa tài khoản và đổi phiên khi request đang chờ. Các ca đơn khác chủ và 404 của trang chi tiết sẽ kiểm tra ở D5.
- Tiếp theo làm D5. Bắt đầu với `GET /api/orders/{id}`, route `/account/orders/:id` và link từ danh sách, sau đó nối checkout success và trang kết quả thanh toán.

### Bàn giao D5 — 11/11/2026

- Trang chi tiết và đường vào từ danh sách nằm trong commit `be5d2c9`. Trang xác nhận checkout có link **Xem đơn hàng** khi bản xác nhận khớp tài khoản hiện tại và mã đơn hợp lệ. Trang kết quả VNPay có link **Lịch sử đơn hàng** cho phiên đăng nhập hợp lệ.
- Checkout thành công đánh dấu danh sách đơn của đúng tài khoản cần tải lại. Kiểm tra logic bao phủ COD/VNPay cho checkout từ giỏ và mua ngay, bao gồm phản hồi đến sau khi đổi tài khoản.
- `npm run lint`, `npm run build` và `npm run verify:checkout` (16/16) đạt. Build còn cảnh báo kích thước chunk. Kiểm tra render React với phiên giả lập xác nhận link hiện đúng theo tài khoản, guest và phiên hết hạn.
- Người dùng xác nhận đã thử lại thanh toán VNPay thành công trên Sandbox sau khi gặp lỗi `70`. Chưa ghi kết quả riêng cho link lịch sử trên trang kết quả.
- Các ca tích hợp còn cần ghi nhận gồm mở đơn từ danh sách và URL trực tiếp, đơn khác chủ, đường dẫn từ COD và VNPay, cùng việc tải lại lịch sử khi quay về. Sau đó tiếp tục D6.

### Bàn giao D7 — 12/11/2026

- Trang chi tiết hiển thị **Thanh toán qua VNPay** theo `canPay` của backend, áp dụng cho cả đơn COD và VNPay đủ điều kiện. `POST /api/orders/{id}/pay` dùng phiên hiện tại và trả đường dẫn cho đơn đã có. Khi đang gửi hoặc chuyển trang, nút bị khóa. Lỗi mở đường dẫn hiển thị ngay tại đơn với nút **Tải lại chi tiết đơn**.
- Kiểm tra URL theo origin, đường dẫn và mã đơn trước khi chuyển cả trang. Khi POST báo đơn đã thanh toán hoặc trả lỗi có thể do trạng thái đơn đã đổi, tải lại chi tiết và đánh dấu các trang lịch sử của tài khoản cần cập nhật.
- Trang kết quả giữ luồng xác nhận công khai của C12. Với mã đơn hợp lệ từ response xác nhận và phiên còn hạn, gọi `GET /api/orders/{id}`. Chỉ sau khi GET thành công và khớp mã đơn mới hiện **Xem đơn hàng** và làm mới cache đơn của tài khoản đó.
- Source backend cho thấy giao dịch thành công cập nhật `paymentStatus` thành `PAID` và giữ `paymentMethod` lúc đặt. Vì vậy trang chi tiết ghi **Phương thức lúc đặt đơn**, còn badge hiển thị trạng thái thanh toán hiện tại.
- `npm run lint`, `npm run build` và `npm run verify:checkout` (20/20) đạt. Các ca D7 kiểm tra POST cho COD/VNPay, URL không hợp lệ, đơn đã thanh toán, đổi phiên, quyền xem đơn và điều kiện hiển thị khi render React. Build còn cảnh báo kích thước chunk.
- Backend dev tại cổng `8081` chưa phản hồi và chưa chạy được giao diện tương tác trên trình duyệt trong lượt này. Trên Sandbox, thử lần lượt đơn COD và VNPay có `canPay=true`: thanh toán thành công rồi mở lại đúng đơn và kiểm tra badge `PAID`; hủy hoặc làm giao dịch thất bại rồi kiểm tra đơn vẫn còn và có thể thanh toán lại theo `canPay`. Bước tiếp theo là D8.
- Commit D7 dùng thông điệp `feat(orders): retry payment for existing orders`.

### Bàn giao D8 — 13/11/2026

- Chi tiết đơn hiện nút **Mua lại** theo `canBuyAgain`. Sau POST thành công, badge và trang giỏ nhận `response.cart`. Dialog liệt kê các dòng đã thêm và chưa thêm được, kèm nút **Xem giỏ hàng** để kiểm tra số lượng thực tế.
- Mua lại, ghi giỏ tài khoản, đồng bộ giỏ guest và checkout từ giỏ dùng chung khóa theo tài khoản trong cùng tab. Cache chỉ được cập nhật khi user ID và token còn khớp. D8 chặn mua lại khi đang merge hoặc còn dấu merge cần đối chiếu.
- Cập nhật 14/11/2026: bỏ khối đối chiếu riêng trên trang giỏ. Khi timeout hoặc lỗi 5xx, đánh dấu cache giỏ cần làm mới và hiện link **Xem giỏ hàng** dưới nút **Mua lại**. Khi quay lại cùng đơn trong tab, lần bấm tiếp theo yêu cầu xác nhận trước khi gửi POST. Giỏ và checkout chỉ chịu khóa ghi khi thao tác đang chạy.
- `npm run lint`, `npm run build`, `git diff --check` và `npm run verify:checkout` (24/24) đạt. Bốn ca D8 kiểm tra cập nhật cache và khóa ghi, merge/đổi phiên, timeout/5xx cần xác nhận khi thử lại và hiển thị link tới giỏ trên trang chi tiết. Build còn cảnh báo kích thước chunk.
- Backend dev tại cổng `8081` chưa phản hồi. Cần thử trên trình duyệt với đơn đủ điều kiện, các tình huống thêm đủ, thêm một phần, không thêm được và dialog bằng bàn phím trước khi chốt kiểm thử tích hợp.
