# Phase 3 — Tiến độ và kế hoạch tiếp tục

> Cập nhật: 07/11/2026. Người dùng xác nhận đã kiểm thử VNPay thành công và yêu cầu kết thúc nhiệm vụ C12. Ghi nhận C12 hoàn thành theo xác nhận này; C1–C11 đã được chốt trong phạm vi giỏ, địa chỉ và COD trước đó. Code đạt kiểm tra tĩnh và 15 kiểm tra logic/giả lập ở phiên triển khai; chưa có biên bản chi tiết từng nhánh thanh toán thật. Bước tiếp theo: C13 — hồi quy tổng thể và chốt Phase 3.
> Mục đích: giúp người dùng và AI tiếp tục đúng tiến độ, dùng lại code đã có và hạn chế sửa lại checkout.
> Tài liệu gốc: [frontend_master_plan.md — Phase 3](frontend_master_plan.md#phase-3--transaction-flow-cart-address-checkout-payment).

## 1. Cách dùng tài liệu

1. Đọc trạng thái và bàn giao bên dưới; kiểm tra `git status` và source thực tế trước khi hướng dẫn hoặc sửa code.
2. Làm theo sáu nhóm theo thứ tự. Giữ mã C1–C13 để đối chiếu với master plan.
3. Mặc định người dùng tự code; AI giao đủ phạm vi và các file của một mốc/nhóm trong một lượt, giải thích và review sau khi người dùng làm xong. Khi người dùng yêu cầu sửa/triển khai trực tiếp thì thực hiện trong phạm vi đó. Yêu cầu mới nhất của người dùng quyết định cách phối hợp.
4. Không giao lại C1–C4 từ đầu. Chỉ sửa hồi quy hoặc phần liên quan trực tiếp đến nhiệm vụ đang làm.
5. Không suy ra đã kiểm thử backend chỉ từ việc có code hoặc build đạt. Ghi riêng kết quả đã chạy và phần chưa xác nhận.
6. Sau mỗi phần có kết quả chạy được, cập nhật mục bàn giao cuối file. Chỉ commit/push khi có yêu cầu hoặc ủy quyền phù hợp của người dùng.

## 2. Trạng thái hiện tại

Người dùng xác nhận hoàn thành C1–C5; C4 đã thử trên web và C5 đã kiểm tra hết theo xác nhận ngày 29/10/2026. C7 được xác nhận ngày 01/11/2026; C6 và UI địa chỉ C8 ngày 04/11/2026; UI C9 ngày 05/11/2026. Ngày 06/11/2026, người dùng xác nhận chức năng đặt hàng đã kiểm thử xong và chạy ổn định, chốt C10 cùng phần tích hợp C8/C11. HEAD hiện là `6a4485b`; working tree sạch trước lần cập nhật tài liệu này. Đây là xác nhận tổng thể của người dùng, chưa có log method/status/UI từng nhánh:

| Mốc | Kết quả | Commit |
|---|---|---|
| C1 | Giỏ guest persist; thêm variant/số lượng từ chi tiết sản phẩm | `792796e feat(cart): add persistent guest cart` |
| C2 | GET/POST giỏ user; `useCart()` chọn guest hoặc server cart | `23c128d feat(cart): connect authenticated cart` |
| C3 | `/cart`, ba component con, đổi số lượng bằng nút/bàn phím, xóa, tổng tiền, lỗi và cảnh báo | `0662960 feat(cart): build cart page and item controls` |
| C4 | Link `/cart` và badge số lượng guest/user trong header; người dùng xác nhận đã thử trên web | `cd1c50e feat(cart): add header entry and merge guest cart after login` |
| C5 | Người dùng xác nhận đã kiểm tra toàn bộ C5 và hoàn thành; chưa cung cấp log method/status chi tiết để ghi biên bản | Cùng commit `cd1c50e` |
| C7 | Hoàn thành code route/CTA, nguồn cart/Buy Now, validate giỏ user, guard phiên và guard dấu merge; người dùng xác nhận đã thử các trường hợp C7, chưa cung cấp log method/status/UI từng nhánh | `dc2257f` cho phần đầu; `fd865b9` cho guard dấu merge |
| C6 | Hoàn thành; người dùng xác nhận đã kiểm thử, chức năng ổn định ngày 04/11/2026; chưa cung cấp log chi tiết | `78a9316`, `ccba4ef`, `33b77f9` |
| C8 | Hoàn thành: UI địa chỉ được xác nhận ngày 04/11/2026; tích hợp request đặt đơn được chốt cùng xác nhận C10 ngày 06/11/2026 | `756f874`, `6a4485b`; có bổ sung UI/email ở các commit khác |
| C9 | Shipping/payment/coupon và tổng preview; người dùng xác nhận UI ổn ngày 05/11/2026. VNPay tiếp tục ở C12 | `4abac2a` |
| C10 | Đặt COD, guard phiên/request lặp, success và cleanup giỏ; người dùng xác nhận kiểm thử xong, chạy ổn định ngày 06/11/2026 | `6a4485b feat(checkout): place COD orders and show confirmation` |
| C11 | Lối vào và đặt đơn Buy Now đã nối; ghi nhận hoàn thành cùng xác nhận kiểm thử chức năng ngày 06/11/2026, chưa có biên bản riêng từng luồng | `dc2257f`, `6a4485b` |
| C12 | Hoàn thành theo xác nhận kiểm thử thành công của người dùng ngày 07/11/2026; có redirect/callback VNPay và các trạng thái kết quả. Chưa có log chi tiết từng nhánh; hồi quy bổ sung ở C13 | Chưa commit; gợi ý `feat(payment): handle VNPay redirect and result` |

Kiểm tra được ghi nhận: phiên C3 đạt build, lint và `git diff --check`; sau khi thêm C4–C5, `npm run build`, `npm run lint`, `npm run typecheck` và `git diff --check` đều đạt. Build còn cảnh báo chunk JavaScript lớn hơn 500 kB, không làm build thất bại. C4 đã được người dùng thử trên web nhưng chưa ghi chi tiết từng thao tác; C5 được người dùng xác nhận hoàn thành, chưa có biên bản merge thành công, lỗi một phần, timeout và đăng nhập lại để ghi method/status chi tiết. Không suy ra kết quả kiểm thử từ commit hoặc kiểm tra tĩnh.

Ngày 29/10/2026, người dùng xác nhận C5 đã kiểm tra hết và hoàn thành. Xác nhận này thay thế trạng thái "chưa thử" trong bàn giao cũ; chi tiết từng request và nhánh lỗi chưa được cung cấp để ghi lại. Không coi các kiểm tra tĩnh ở trên là bằng chứng thay cho xác nhận của người dùng.

Kiểm tra lại code C7 tại `dc2257f` ngày 31/10/2026: `npm run build` và `npm run lint` đạt; build cảnh báo chunk JavaScript > 500 kB. `git show --check HEAD` báo bốn dòng có khoảng trắng cuối dòng trong `ProductPurchaseOptions.tsx` (dòng 42, 70, 102, 141). Chưa có biên bản chạy đủ luồng C7 với backend/trình duyệt.

Ngày 01/11/2026: đã review diff guard mới; `npm run lint`, `npm run build` (bao gồm `tsc -b`) và `git diff --check` đều đạt. Build vẫn cảnh báo chunk JS > 500 kB. Người dùng xác nhận đã thử toàn bộ trường hợp C7 với hệ thống; chưa có log chi tiết để ghi method/status/UI từng nhánh. Đây là xác nhận kiểm thử của người dùng, không phải kết quả tự chạy browser/backend trong phiên này.

Ngày 04/11/2026: người dùng xác nhận “tôi đã kiểm thử C6/C8, hiện tại chức năng ổn định”. Ghi nhận C6 hoàn thành và C8 đạt kiểm thử chức năng hiện có. Chưa có log method/status/UI từng nhánh; không suy ra đã gửi payload tạo đơn vì C10 chưa triển khai. Không giao lại kiểm thử C6/C8 làm điều kiện bắt đầu C9.

Ngày 06/11/2026: người dùng xác nhận “Tôi đã test xong chức năng, đã chạy ổn định”. Trong phạm vi nhiệm vụ đặt COD vừa triển khai và checklist đã hướng dẫn, ghi nhận C10 cùng phần tích hợp C8/C11 hoàn thành theo xác nhận của người dùng. Xác nhận này thay thế trạng thái chờ kiểm thử trong các bàn giao ngày 05/11/2026. Chưa có log request/status hoặc biên bản tách từng trường hợp; phiên cập nhật tài liệu này không tự chạy lại browser/backend.

Ngày 07/11/2026: sau thay đổi bỏ dấu `#` trong `vnp_OrderInfo` backend, người dùng xác nhận “đã test thành công” và yêu cầu cập nhật tài liệu để kết thúc nhiệm vụ C12. Ghi nhận C12 hoàn thành theo xác nhận của người dùng, thay thế trạng thái chờ sandbox/lỗi 71 trong các bàn giao trước. Chưa có log request/status, paymentStatus/TransactionLog hoặc biên bản riêng cho thành công/hủy/thất bại/IPN. Không khẳng định dấu `#` là nguyên nhân trực tiếp của lỗi 71, hoặc merchant đã được phê duyệt bởi VNPay, chỉ từ kết quả thử lại.

Các điểm cần giữ lại khi tiếp tục:

- Giỏ guest dùng `ec.guestCart` trong Zustand persist. Giá/tồn kho trong snapshot là số liệu lúc thêm hàng, không phải tồn kho thời gian thực.
- Giỏ user dùng TanStack Query với key **`[...qk.cart, userId]`**, không ghi dữ liệu user vào key chung `qk.cart`.
- `CartRow.id`: guest là `variantId`; user là `cartItemId`. PUT/DELETE item phải dùng `cartItemId`.
- `CartSummary` đã có CTA `/checkout`, khóa khi giỏ rỗng/lỗi tồn kho/đang xử lý và khi có dấu merge chưa đối chiếu cho user hiện tại.
- Bản C3 hiện khóa thao tác khi mutation pending, nhập số lượng lưu khi Enter/blur. Debounce stepper 400 ms ghi trong master plan chưa được triển khai; không coi đây là tính năng đã có. Chỉ bổ sung khi nhiệm vụ cần hoặc người dùng yêu cầu, rồi ghi rõ kết quả.
- Merge C5 gọi sau login hoặc verify-email thành công, không chạy từ render/effect. Mỗi `POST /api/cart/items` cộng số lượng; `ec.cartMerge` lưu dấu item chưa rõ kết quả để tránh tự gửi lại sau timeout/refresh. Dấu này cần người dùng đối chiếu với server cart; frontend không bảo đảm exactly-once nếu backend chưa hỗ trợ idempotency.
- Trong lúc merge, `useCart()` khóa thêm/sửa/xóa giỏ; `CartPage` hiện trạng thái và khu vực đối chiếu khi có dấu tồn đọng. `CartCheckoutEntry` đã chặn cả merge đang chạy và dấu merge tồn đọng khi mở lại checkout đã vào trước đó.
- C6/C8/C9/C10/C11 đã được ghi nhận hoàn thành trong phạm vi địa chỉ và COD theo xác nhận của người dùng; C12 hoàn thành theo xác nhận kiểm thử VNPay ngày 07/11/2026. Lựa chọn VNPay đã mở. Tiếp tục C13 để hồi quy sau tích hợp thanh toán, không giao lại triển khai C12 từ đầu.
- Email checkout hiện chỉ được lưu vào `contact_email`; backend chưa gửi email xác nhận tạo đơn. Đơn guest được lưu trong database với `user_id = null`; sessionStorage chỉ là bản xác nhận tạm trên trình duyệt. Xác nhận chức năng ổn định không đồng nghĩa đã có gửi email; gửi email chưa thuộc phần triển khai C10 hiện có.

## 3. Bản đồ code để AI tìm đúng chỗ

| Đường dẫn | Vai trò |
|---|---|
| `src/features/cart/guestCart.store.ts` | Guest items, thêm, đặt số lượng, xóa, xóa hết, persist; dọn dấu merge khi xóa item |
| `src/features/cart/api.ts` | HTTP cho giỏ user và validate checkout |
| `src/features/cart/queries.ts` | Query giỏ, mutation, optimistic update/rollback và query validate checkout |
| `src/features/cart/useCart.ts` | Interface chung cho guest/user; khóa thao tác và báo trạng thái merge |
| `src/features/cart/cartMerge.store.ts` | `isMerging` và dấu request chưa rõ kết quả trong `ec.cartMerge` |
| `src/features/cart/mergeGuestCart.ts` | Merge tuần tự, single-flight trong tab, kiểm tra phiên và cập nhật cache theo userId |
| `src/features/cart/pages/CartPage.tsx` | Loading/error/empty, chuẩn hóa rows, điều phối thao tác và hiện trạng thái merge |
| `src/features/cart/components/` | `CartItemRow`, `CartIssueBanner`, `CartSummary`, `CartMergeReview` để đối chiếu request chưa rõ kết quả |
| `src/features/cart/cartView.types.ts` | Kiểu dữ liệu hiển thị `CartRow` |
| `src/app/layouts/StorefrontLayout.tsx` | Link `/cart`, badge giỏ và trạng thái đang đồng bộ |
| `src/app/router.tsx` | Khai báo route |
| `src/features/auth/queries.ts` | Gọi merge sau login/verify-email thành công |
| `src/shared/auth/session.store.ts` | Session, userId, dọn cache khi clear session |
| `src/shared/auth/session.lifecycle.ts` | Hết phiên và đồng bộ thay đổi session |
| `src/features/catalog/components/ProductPurchaseOptions.tsx` | Variant/số lượng, thêm giỏ và nút Mua ngay không thêm vào cart |
| `src/features/checkout/entry.ts` | Kiểu và kiểm tra navigation state cho nguồn cart/Buy Now |
| `src/features/checkout/pages/CheckoutPage.tsx` | Guard nguồn/phiên/giỏ, gọi validate cho user cart và hiện preview tạm tính |
| `src/features/address/{types,api,queries,schemas}.ts` | DTO/API CRUD, cache theo userId, schema và hàm chuyển payload sổ địa chỉ/checkout nhập tay |
| `src/features/address/components/` và `pages/AddressesPage.tsx` | Form/schema dùng chung, địa giới tỉnh/xã có fallback nhập tay, card và UI CRUD |
| `src/features/checkout/components/CheckoutContent.tsx` | UI chung địa chỉ/email/shipping/payment/coupon; validation, đặt COD/VNPay, redirect sau tạo đơn và khóa gửi lại khi điều hướng lỗi |
| `src/features/checkout/{types,buildCheckoutRequest,api,queries,session}.ts` | Schema response, payload theo nguồn hàng, API/mutation không retry, guard phiên, khóa request trong tab và cleanup giỏ |
| `src/features/checkout/confirmation.storage.ts` và `pages/CheckoutSuccessPage.tsx` | Lưu/đọc response theo orderId và chủ đơn; success dùng số tiền backend, có fallback khi thiếu dữ liệu |
| `src/features/payment/{api,queries,redirect}.ts` | Dựng URL redirect đúng backend/orderId; API xác nhận giữ nguyên query và bỏ token; query hạn chế retry/refetch/request lặp |
| `src/features/payment/pages/PaymentResultPage.tsx` và `components/PaymentResultView.tsx` | Route public `/payment/result`; hiển thị chờ/thành công/hủy/thất bại/chưa xác định từ kết quả backend và CTA mua sắm |
| `scripts/verify-checkout.cjs` | 15 kiểm tra logic/adapter/QueryObserver giả lập bằng Node cho COD/VNPay; không thay thế kiểm thử backend/browser |
| `src/shared/api/client.ts` | Axios, interceptor, `meta.noPublicRetry` |
| `src/shared/api/queryKeys.ts` | Query key hiện có; bổ sung khi feature dùng đến |
| `src/lib/format.ts` | `formatVND` |

Backend tham chiếu trong môi trường hiện tại: `../ecommerce-backend`. Đọc controller, request/response DTO và service tương ứng trước khi nối endpoint mới. Contract trong source backend đang dùng là căn cứ khi tài liệu khác source.

## 4. Thứ tự mới và ước lượng

Ước lượng ban đầu là giờ tập trung, gồm code, giải thích ngắn, review và thử backend thông thường. Không gồm sửa môi trường backend/VNPay bị lỗi hoặc thiết kế lại UI. Tổng ban đầu khoảng **28–42 giờ**; dự trù **34–50 giờ** khi có lỗi tích hợp; đây không phải ước lượng phần còn lại tại 04/11/2026. Deadline cũ hết Chủ nhật **01/11/2026** đã qua; chưa có deadline mới.

| Thứ tự | Nhóm | Mốc gốc | Độ khó | Ước lượng |
|---|---|---|---|---:|
| 1 | Lối vào giỏ và hợp nhất sau login | C4 + C5 | Vừa | 3–5 giờ |
| 2 | Nguồn hàng và điều kiện vào checkout | C7 + phần đầu C11 | Khá | 4–6 giờ |
| 3 | Địa chỉ dùng chung | C6 + C8 | Cao | 7–10 giờ |
| 4 | Checkout và đặt COD | C9 + C10 + kiểm tra C11 | Cao | 6–9 giờ |
| 5 | VNPay | C12 + lựa chọn VNPay từ C9 | Cao | 4–6 giờ |
| 6 | Kiểm tra tổng thể và chốt | C13 | Khá | 4–6 giờ |

Gom theo nhóm để dùng lại state/component và kiểm tra tích hợp sớm; vẫn có thể chia commit theo từng mốc C. Không bắt buộc gom cả nhóm lớn thành một commit.

### Nhóm 1 — Lối vào giỏ và merge (C4 + C5)

**Phụ thuộc:** C1–C3 đã có.

- [x] C4: link `/cart` và badge lấy từ `useCart().totalItems`; người dùng xác nhận đã thử trên web. Chưa ghi chi tiết kết quả riêng guest/user.
- [x] C5: người dùng xác nhận đã kiểm tra toàn bộ và hoàn thành ngày 29/10/2026; chưa có biên bản chi tiết từng request.
- [x] Code thêm từng item guest tuần tự qua `POST /api/cart/items`; dùng response để cập nhật cache đúng userId.
- [x] Code xóa từng item guest sau response thành công; giữ item lỗi và thông báo kết quả một phần. Chưa thử nhánh lỗi thật.
- [x] Merge khởi chạy từ callback đăng nhập/xác thực, có single-flight trong tab; không tự chạy lại do render, StrictMode hoặc refresh. Chưa kiểm tra nhiều tab đồng thời.
- [x] Code kiểm tra token/userId trước và sau các bước chờ; dừng phần còn lại và không ghi response cũ vào cache phiên khác. Chưa thử đổi phiên giữa request thật.
- [x] Code khóa thao tác giỏ và thể hiện trạng thái đang đồng bộ; C7 đã chặn checkout khi merge đang chạy.
- [x] Người dùng xác nhận đã kiểm tra hết các nhánh C5; chưa cung cấp method/status và kết quả UI từng nhánh để ghi biên bản chi tiết.

**Rủi ro:** POST thêm hàng là cộng số lượng. Không tự retry khi timeout mà chưa biết backend đã thêm hay chưa; frontend không thể bảo đảm exactly-once sau mất kết nối nếu backend chưa hỗ trợ idempotency. Đối chiếu server cart và thông báo tình trạng chưa xác định trước khi cho thử lại.

**Hoàn thành khi:** badge đúng cho hai chế độ; merge thành công/một phần lỗi chạy thật; login lại không tự cộng trùng các item đã xử lý.

**Giới hạn phạm vi:** làm link/badge trước. MiniCartDrawer là tùy chọn, có thể làm sau luồng đặt hàng; không bắt buộc cho deadline.

Đã commit code C4–C5: `cd1c50e feat(cart): add header entry and merge guest cart after login`. Commit không thay thế biên bản thử backend C5.

### Nhóm 2 — Nguồn checkout và Mua ngay (C7 + phần đầu C11)

**Phụ thuộc:** giỏ đã có; merge cần ổn định trước checkout user.

- [x] Code `/checkout` và CTA từ `/cart`; khóa khi giỏ rỗng, có lỗi tồn kho hoặc đang xử lý.
- [x] Code phân biệt nguồn cart/Buy Now độc lập với trạng thái đăng nhập (`CheckoutEntry.kind` và `startedUserId`).
- [x] Nút Mua ngay lấy variant/số lượng đang chọn và điều hướng không thêm vào giỏ; C11 đã nối đặt COD và được chốt theo xác nhận kiểm thử chức năng ngày 06/11/2026, chưa có biên bản riêng từng nhánh.
- [x] Code giỏ user gọi `POST /api/cart/validate-checkout`, có nhánh `issues` và link quay lại giỏ.
- [x] Code nhánh Buy Now không dùng server cart ở checkout.
- [x] Code fallback khi thiếu/hỏng navigation state Buy Now; có link quay lại.
- [x] Code ghi nhận `startedUserId` và chặn khi phiên đang checkout bị mất/đổi; không tự chuyển user checkout thành guest.
- [x] `CartSummary` khóa CTA khi có dấu merge chưa đối chiếu thuộc user hiện tại và item guest còn lưu.
- [x] `CartCheckoutEntry` chặn mở lại checkout đã vào trước đó khi dấu merge chưa đối chiếu xuất hiện.
- [x] Người dùng xác nhận đã thử toàn bộ trường hợp C7 với backend/trình duyệt: guest cart, user cart valid/invalid, Buy Now guest/user khi cart rỗng/lỗi, refresh/thiếu state, đổi phiên và dấu merge tồn đọng. Chưa cung cấp log method/status/UI từng nhánh.

| Nguồn | `directItems` khi đặt | Validate server cart | Sau tạo đơn thành công |
|---|---|---|---|
| Guest cart | Bắt buộc | Không | Xóa guest cart đã dùng để đặt |
| User cart | Không gửi | Có | Đồng bộ lại server cart, backend tự clear |
| Buy Now guest/user | Có | Không | Giữ giỏ hiện có |

**Trạng thái nhóm:** C7 hoàn thành theo xác nhận trước đó. Phần đặt COD của C11 ở nhóm 4 đã được chốt theo xác nhận kiểm thử chức năng ngày 06/11/2026.

Đã commit code nguồn/guard: `dc2257f feat(checkout): validate cart entry and support buy-now source`; phần đặt đơn và cleanup đúng nguồn ở `6a4485b`.

Vệ sinh commit còn thiếu: bỏ bốn dòng khoảng trắng cuối dòng trong `ProductPurchaseOptions.tsx`; `git diff --check` trên working tree sạch không phát hiện khoảng trắng đã nằm trong commit cũ, nên dùng `git show --check HEAD` để kiểm tra commit này.

### Nhóm 3 — Địa chỉ tài khoản và checkout (C6 + C8)

**Phụ thuộc:** khung checkout nhóm 2.

- [x] Đã đối chiếu `AddressController`, `AddressRequest`, `AddressResponse`, `AddressServiceImpl`; có API/hook CRUD và query key `[...qk.addresses, userId]`.
- [x] Đã chọn API v2 `provinces.open-api.vn` cho tỉnh/xã, lưu tên dạng string và fallback nhập tay khi lỗi; `district` nhập tay vì DTO backend vẫn bắt buộc. Người dùng xác nhận C6/C8 hiện ổn định; chưa có biên bản riêng từng nhánh địa giới.
- [x] Đã có `addressSchema`, `AddressForm`, `AddressGeographyFields` dùng chung; kiểm tra trường bắt buộc và regex điện thoại khớp backend.
- [x] Đã có route `/account/addresses` bọc `RequireAuth`, link trong `UserMenu`; UI list/loading/error/empty, thêm/sửa/xóa/đặt mặc định.
- [x] `AddressCard` khóa xóa mặc định; các mutation trả `MessageResponse` invalidate danh sách đúng userId. Backend cũng chặn xóa mặc định.
- [x] `CheckoutContent` dùng chung sau guard cho guest cart/user cart/Buy Now: guest nhập tay, user chọn mặc định/khác hoặc nhập tay; sổ rỗng chuyển nhập tay.
- [x] Đã có `toAddressRequest` và `toManualCheckoutAddress`; `addressFields` chuẩn bị riêng `{ addressId }` hoặc ba trường nhập tay.
- [x] Đã nối `addressFields` vào `CheckoutRequest`: `addressId` hoặc đủ `recipientName`, `recipientPhone`, `shippingAddress` theo chế độ; chốt tích hợp C8 cùng xác nhận kiểm thử C10 ngày 06/11/2026.
- [x] Người dùng xác nhận đã kiểm thử C6, chức năng hiện ổn định ngày 04/11/2026; chưa cung cấp biên bản từng thao tác/status để ghi chi tiết.
- [x] Người dùng xác nhận UI C8 ổn ngày 04/11/2026 và chức năng đặt hàng ổn ngày 06/11/2026; phần tích hợp C8/C10 đã chốt theo xác nhận này, chưa có biên bản từng nhánh.

Các đầu việc code đã được review tĩnh; kết quả kiểm thử được ghi nhận từ xác nhận trực tiếp của người dùng. C6 và C8 hoàn thành, bao gồm tích hợp địa chỉ vào request đặt COD. Bước tiếp theo hiện tại là C13 sau khi C12 được chốt ngày 07/11/2026; không giao lại nhóm địa chỉ từ đầu.

**Hoàn thành khi:** CRUD backend chạy thật; địa chỉ được chọn/nhập đi đúng vào checkout payload; validation điện thoại và trường bắt buộc hoạt động.

**Không tạo trùng:** hai form địa chỉ có schema/state độc lập chỉ vì nằm ở hai trang. UI chọn địa chỉ có thể dùng select/list đơn giản; dialog chỉ thêm khi cần.

Commit gợi ý: `feat(address): manage customer addresses`, sau đó `feat(checkout): collect delivery address`.

### Nhóm 4 — Checkout và COD (C9 + C10 + chốt C11)

**Phụ thuộc:** nguồn hàng nhóm 2 và địa chỉ nhóm 3.

- [x] Đã có state shipping/payment/coupon trong `CheckoutContent`, dùng chung cho cart và Buy Now; COD mặc định, VNPay đã được mở ở C12.
- [x] Đã có selector STANDARD/EXPRESS và cấu hình 30.000/55.000 VND khớp `CheckoutServiceImpl`.
- [x] `OrderSummaryPanel` tính preview tiền hàng + phí; cả ba nơi render `CheckoutContent` đã truyền `subtotal` đúng nguồn.
- [x] C10 lấy số tiền xác nhận/success từ `CheckoutResponse`; chức năng đặt hàng đã được người dùng xác nhận ổn ngày 06/11/2026, chưa có bản đối chiếu số tiền từng đơn.
- [x] Đã có input coupon, nối mã vào request C10; backend kiểm tra và áp dụng khi đặt. Preview chưa tự trừ giảm giá.
- [x] Ngày 05/11/2026, người dùng xác nhận đã thử UI C9 (đổi giao hàng/phí/tổng, nhập coupon, chọn COD), hoạt động ổn. Chưa có biên bản riêng cho từng nguồn hàng, giữ lựa chọn khi đổi địa chỉ và bàn phím; kiểm tra hồi quy các nhánh này cùng C10/C13. VNPay vẫn khóa đến C12.
- [x] Đã có `buildCheckoutRequest` theo nguồn hàng và chế độ địa chỉ; kiểm tra logic bằng Node đạt.
- [x] Code `POST /api/orders/checkout` dùng `meta: { noPublicRetry: true }`, `retry: false`, `networkMode: "always"`; guard session tại dispatch và khóa request trong tab. Kiểm tra adapter giả lập đạt; người dùng xác nhận chức năng ổn ngày 06/11/2026, chưa có log nhấn lặp riêng.
- [x] Code giữ state form khi lỗi, hiện message backend; timeout/5xx khóa gửi lại trên trang hiện tại vì chưa rõ kết quả. Chức năng được xác nhận ổn ngày 06/11/2026; chưa có biên bản riêng lỗi coupon/mạng.
- [x] Code chỉ cleanup sau response hợp lệ: guest trừ số lượng đã gửi, user cart invalidate đúng userId, Buy Now giữ giỏ. Kiểm tra logic giả lập đạt.
- [x] Đã lưu response trong sessionStorage, kiểm tra schema/orderId/chủ đơn khi hiển thị `/checkout/success/:orderId`; navigation state làm fallback khi storage bị chặn.
- [x] Code có fallback khi thiếu/hỏng xác nhận; không tự POST hoặc dựng đơn giả trên trang success. Người dùng xác nhận chức năng ổn ngày 06/11/2026; chưa có biên bản riêng ca reload/fallback.
- [x] Phạm vi COD gồm guest cart, user cart, Buy Now guest và Buy Now user, cleanup đúng nguồn và giữ giỏ khi Buy Now. Ghi nhận hoàn thành theo xác nhận kiểm thử tổng thể của người dùng ngày 06/11/2026; chưa có biên bản tách từng luồng.

**Hoàn thành khi:** bốn luồng COD chạy thật và không double-submit; lỗi không làm mất form/giỏ. Đây là lúc chốt đầy đủ C11.

**Trạng thái:** Nhóm 4 hoàn thành trong phạm vi COD theo xác nhận của người dùng ngày 06/11/2026. C8/C10/C11 đã chốt; chi tiết method/status/UI từng trường hợp chưa được cung cấp. C12 được chốt theo xác nhận ngày 07/11/2026; C13 vẫn mở cho hồi quy tổng thể.

**VNPay:** có thể chuẩn bị kiểu payment từ đây; chỉ bật lựa chọn VNPay khi nhóm 5 đã có hành vi hoạt động.

Commit gợi ý: `feat(checkout): add shipping payment and order preview`, `feat(checkout): place COD orders and show confirmation`; commit Buy Now theo phần code thực tế.

### Nhóm 5 — Thanh toán VNPay (C12)

**Phụ thuộc:** API tạo đơn và xử lý response nhóm 4. Kiểm tra sớm cấu hình backend/sandbox để phát hiện trở ngại môi trường.

- [x] Code dùng lại checkout, không tạo form/payload thứ hai; radio VNPay đã mở. Kiểm tra giả lập mutation đủ bốn luồng COD và VNPay, cleanup đúng nguồn và lưu xác nhận trước redirect.
- [x] Code redirect toàn trang từ `paymentUrl`; kiểm tra URL tương đối/tuyệt đối đúng backend và orderId, từ chối URL thiếu/sai origin/sai endpoint. Người dùng đã cung cấp URL redirect sandbox và sau đó xác nhận thử thành công ngày 07/11/2026.
- [x] `/payment/result` giữ nguyên query để gửi return endpoint; kiểm tra Axios adapter xác nhận không tái mã hóa query, không gửi token hoặc header nội bộ.
- [x] Query tắt retry, retry-on-mount, refetch-on-mount/focus/reconnect; cache vô hạn. Kiểm tra QueryObserver subscribe/unsubscribe trong lúc request chạy và mount lại sau thành công/lỗi đạt. Đây là giả lập vòng đời query, chưa phải thử React StrictMode trong trình duyệt.
- [x] Đã đối chiếu source backend: return/IPN dùng transaction và khóa dòng `findByIdForUpdate`; đơn PAID được bỏ qua, callback trùng kiểm tra trước ghi TransactionLog. Cache frontend không bảo đảm chỉ gọi một lần qua reload/tab khác; chưa xác nhận idempotency bằng backend thật.
- [x] Code hiển thị thành công/hủy/thất bại/chưa xác định dựa trên response backend; mã 24 chỉ phân loại hủy sau xác minh có orderId. Không kết luận thanh toán thành công từ query; lỗi mạng và response không hợp lệ giữ trạng thái chưa xác định.
- [x] CTA tiếp tục mua sắm về `/products`, route có thật. Trang xác nhận ghi rõ trạng thái VNPay trong snapshot là lúc tạo đơn.
- [x] Người dùng xác nhận kiểm thử VNPay thành công ngày 07/11/2026 và yêu cầu kết thúc C12; chưa cung cấp biên bản riêng từng request hoặc từng nhánh. Đây là xác nhận người dùng, không phải kết quả AI tự chạy sandbox.
- [ ] Hồi quy C13: thành công/hủy/thất bại, chữ ký/số tiền sai; ghi endpoint/status và kết quả UI/database cho các nhánh chưa có biên bản.
- [ ] Hồi quy C13: StrictMode, focus, reload, callback lặp và nhiều tab với backend thật; đối chiếu paymentStatus/TransactionLog, IPN công khai và bốn nguồn guest cart/user cart/Buy Now guest/user. Chưa đánh dấu các ca này đã chạy từ xác nhận tổng thể.

Cấu hình đã đối chiếu trong source: Vite port 3000; backend dùng `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_RETURN_URL` (mặc định `http://localhost:3000/payment/result`); frontend dùng `VITE_BACKEND_ORIGIN` cho redirect. Chưa kiểm tra giá trị môi trường đang chạy; hash secret chỉ thuộc backend.

**Hoàn thành khi:** có kết quả redirect và callback thật cho các nhánh có thể thử; ghi rõ nhánh sandbox/môi trường chưa xác nhận. Không suy ra thanh toán thành công từ việc mở được trang VNPay.

**Trạng thái chốt ngày 07/11/2026:** C12 hoàn thành theo xác nhận kiểm thử thành công của người dùng và yêu cầu kết thúc nhiệm vụ. Không ghi nhận đã quan sát đầy đủ các nhánh lỗi, callback/IPN hoặc database; các ca hồi quy bổ sung chuyển C13. Không yêu cầu triển khai lại C12. Lỗi 71 trước đó được giữ trong lịch sử, không còn là trở ngại đang chờ xử lý theo xác nhận mới nhất.

Commit gợi ý: `feat(payment): handle VNPay redirect and result`.

### Nhóm 6 — Chốt Phase 3 (C13)

**Phụ thuộc:** nhóm 1–5. Thử hành vi ngay trong từng nhóm; nhóm này dành cho hồi quy tích hợp.

- [ ] Guest cart và user cart: thêm/sửa/xóa/persist, badge và merge.
- [ ] Bốn nguồn/chế độ COD ở nhóm 4; VNPay guest/user theo khả năng backend.
- [ ] Giỏ rỗng, thiếu/hết hàng, lỗi địa chỉ/coupon, lỗi mạng, hết phiên, double-submit, callback lặp.
- [ ] Refresh checkout/success/payment result, điều hướng quay lại và giữ form khi lỗi.
- [ ] Điện thoại/desktop, tên/giá dài, bàn phím, focus, label input, một h1 và metadata cần thiết.
- [x] Kiểm tra source tại 04/11/2026: `npm run build` (gồm `tsc -b`), `npm run lint`, `git diff --check` đạt. Build cảnh báo chunk > 500 kB: index khoảng 707 kB, HeroScene khoảng 1.001 kB; ảnh hưởng kích thước tải, không làm build thất bại. Cần chạy lại sau khi triển khai C9–C12 trước khi chốt C13.
- [ ] Biên bản luồng thật: thao tác, endpoint/status, phản hồi UI, kết quả và giới hạn.
- [ ] Cập nhật file này và tiến độ master plan bằng kết quả có bằng chứng.

Commit gợi ý: `chore(checkout): finalize phase 3 verification`.

## 5. Quy ước kỹ thuật phải giữ

- Mọi ID là string; không ép TSID sang number.
- API ở `api.ts`, query/mutation ở `queries.ts`, component nhận props khi có thể; dùng lại Axios/error/session hiện có.
- Backend quyết định tồn kho, giá, coupon và kết quả thanh toán. Snapshot/preview frontend không thay thế xác nhận backend.
- Cache dữ liệu cá nhân theo userId; response đến muộn không ghi vào phiên khác. QueryClient cache không phải localStorage.
- Mutation không tự cập nhật các query liên quan: response đủ dữ liệu thì `setQueryData`, thiếu thì invalidate query thích hợp.
- Không tự retry thao tác tạo đơn hoặc POST cộng hàng nếu chưa có chiến lược chống lặp phù hợp.
- Không đổi token hết hạn thành checkout guest; endpoint checkout là public nhưng luồng user phải giữ yêu cầu session.
- Tránh state trùng cho cùng dữ liệu checkout; phân biệt nguồn hàng với tình trạng đăng nhập.
- Giữ flow Buy Now không sửa hoặc xóa cart. Backend có thể dùng tên `isBuyNow` cho nhánh `directItems`; frontend vẫn phải phân biệt guest cart với Buy Now để cleanup đúng.
- Không cài thêm hạ tầng/test framework, tạo CI hoặc generate OpenAPI chỉ để bắt đầu các mốc này. Kiểm tra phù hợp rủi ro và yêu cầu đang làm; người dùng đã hoãn bộ test tự động/CI từ các phase trước.

## 6. Bàn giao cho lần tiếp theo

| Nội dung | Trạng thái cập nhật tại 07/11/2026 |
|---|---|
| Hoàn thành được người dùng xác nhận | C1–C12: giỏ, địa chỉ, COD và VNPay; C12 được chốt ngày 07/11/2026. Chưa có log chi tiết từng nhánh |
| Commit gần nhất | HEAD `6a4485b feat(checkout): place COD orders and show confirmation`; C9 ở `4abac2a` |
| Bước tiếp theo | C13 — hồi quy giỏ/địa chỉ/COD/VNPay, responsive/accessibility; bổ sung biên bản các nhánh lỗi/callback lặp/IPN và đối chiếu TransactionLog |
| Sau bước đó | Chốt Phase 3 và cập nhật tiến độ master plan khi đạt C13 |
| Chưa xác nhận hoàn thành | C13 chưa chốt; không coi chốt C12 là hoàn thành toàn bộ Phase 3. Email xác nhận đặt đơn chưa được backend gửi, không ghi nhận là chức năng đã có |
| Phần chuyển tiếp từ C3 | CTA checkout/disable đã nối ở C7; tồn kho guest là snapshot; debounce 400 ms chưa có |
| Biên bản còn thiếu chi tiết | C5/C7/C6/C8, COD C10/C11 và VNPay C12 đã được người dùng xác nhận; chưa có method/status/UI từng nhánh để truy vết |

Bàn giao trước khi có xác nhận C5, lưu để tham chiếu lịch sử:

```text
Nhóm / mã C đang làm: Nhóm 1 — C4 và C5
Đã thay đổi: Link/badge giỏ; merge guest tuần tự sau login/verify-email; dấu request chưa rõ kết quả; khóa thao tác và UI đối chiếu.
Kiểm tra đã chạy và kết quả: npm run build, npm run lint, npm run typecheck, git diff --check đều đạt. Build cảnh báo chunk JS > 500 kB. Người dùng xác nhận đã thử C4 trên web.
Chưa kiểm tra / khác biệt với plan: Chưa có biên bản thử C5 với backend thật; checkout guard chuyển sang C7 vì route chưa có. MiniCartDrawer không làm vì tùy chọn.
Commit: cd1c50e feat(cart): add header entry and merge guest cart after login
Bước tiếp theo cụ thể: Thử các nhánh C5 với backend, ghi endpoint/status và kết quả UI; sau khi đạt thì bắt đầu C7 + phần đầu C11.
```

Bàn giao bổ sung ngày 29/10/2026:

```text
Nhóm / mã C đang làm: Nhóm 2 — C7 và phần đầu C11
Đã thay đổi: Người dùng xác nhận C5 đã kiểm tra hết và hoàn thành; chưa sửa source checkout.
Kiểm tra đã chạy và kết quả: Xác nhận trực tiếp từ người dùng; chưa được cung cấp log method/status/UI từng nhánh để ghi biên bản.
Chưa kiểm tra / khác biệt với plan: C6–C13 chưa hoàn thành; tại thời điểm bàn giao này C7 chưa có route hoặc feature checkout.
Commit (nếu có): Không có commit mới cho xác nhận này.
Bước tiếp theo cụ thể: Hướng dẫn người dùng tự code C7 theo từng phần nhỏ, bắt đầu từ nguồn hàng checkout và route/CTA từ giỏ.
```

Bàn giao bổ sung sau bước đầu C7 ngày 29/10/2026:

```text
Nhóm / mã C đang làm: Nhóm 2 — C7, bước route và CTA từ giỏ
Đã thay đổi: Người dùng tạo CheckoutPage khung, route /checkout và CTA trong CartSummary; source còn thay đổi toast trước đó.
Kiểm tra đã chạy và kết quả: npm run typecheck, npm run lint, git diff --check đều đạt. Chưa ghi nhận thử trên trình duyệt.
Chưa kiểm tra / khác biệt với plan: Chưa có guard tại /checkout, nguồn Buy Now, xác minh giỏ user qua backend hoặc chặn session hết hạn. C7 chưa hoàn thành.
Commit (nếu có): Chưa có commit mới.
Bước tiếp theo cụ thể: Sửa nhãn CTA thành bước vào checkout, bỏ space-x-2 trên aside; thêm guard ở trang checkout và tách nguồn cart/Buy Now để Buy Now không phụ thuộc giỏ.
```

Bàn giao bổ sung ngày 31/10/2026:

```text
Nhóm / mã C đang làm: Kết thúc Nhóm 2, chuẩn bị Nhóm 3 — C6 và C8
Đã thay đổi: Commit dc2257f thêm route checkout, nguồn cart/Buy Now, kiểm tra giỏ user và guard phiên; CartSummary khóa CTA khi còn dấu merge cần đối chiếu.
Kiểm tra đã chạy và kết quả: npm run build và npm run lint đạt tại dc2257f; build cảnh báo chunk JS > 500 kB. git show --check HEAD báo bốn dòng khoảng trắng cuối dòng trong ProductPurchaseOptions.tsx. Chưa ghi nhận biên bản thử browser/backend cho toàn bộ C7.
Chưa kiểm tra / khác biệt với plan: CheckoutPage hiện chưa khóa đường vào trực tiếp khi còn dấu merge chưa đối chiếu. C11 mới có lối vào Mua ngay, chưa đặt đơn.
Commit (nếu có): dc2257f feat(checkout): validate cart entry and support buy-now source
Bước tiếp theo cụ thể: Bổ sung guard dấu merge trong CartCheckoutEntry, thử lại C7; sau đó triển khai C6 + C8 với một schema/form địa chỉ dùng chung.
```

Bàn giao bổ sung ngày 01/11/2026:

```text
Nhóm / mã C đang làm: Nhóm 2 hoàn thành — C7; tiếp theo Nhóm 3 — C6 và C8
Đã thay đổi: Người dùng bổ sung guard dấu merge chưa đối chiếu trong CartCheckoutEntry và xác nhận đã thử toàn bộ trường hợp C7.
Kiểm tra đã chạy và kết quả: npm run lint, npm run typecheck, npm run build và git diff --check đều đạt. Build cảnh báo chunk JS > 500 kB. Đã review diff guard, chưa thấy lỗi chặn luồng C7.
Chưa kiểm tra / khác biệt với plan: Chưa có log method/status/UI từng nhánh do người dùng cung cấp; phiên này không tự chạy backend/browser. C11 mới có lối vào Buy Now, chưa đặt đơn. Bốn dòng khoảng trắng cuối dòng ở commit dc2257f vẫn là vấn đề vệ sinh commit cũ.
Commit (nếu có): Guard mới chưa commit; phase3.md hiện là file chưa được git theo dõi.
Bước tiếp theo cụ thể: Triển khai trọn Nhóm 3 — C6 + C8, dùng chung schema/form địa chỉ và kiểm tra CRUD backend cùng luồng chọn/nhập địa chỉ tại checkout.
```

Sau mỗi lần làm, ghi thêm theo mẫu:

```text
Ngày:
Nhóm / mã C đang làm:
Đã thay đổi:
Kiểm tra đã chạy và kết quả:
Chưa kiểm tra / khác biệt với plan:
Commit (nếu có):
Bước tiếp theo cụ thể:
```

### Bàn giao ngày 02/11/2026 — Nhóm 3

- Bổ sung sau khi người dùng tự thêm code: CheckoutContent và AddressGeographyFields đã có trong source. Theo yêu cầu sửa trực tiếp mới nhất, AI đã bỏ hai trường province/ward bị render trùng trong mảng fields của AddressForm; hai trường này do AddressGeographyFields quản lý. Build (gồm typecheck) và git diff --check đạt; vẫn cảnh báo chunk JS khoảng 698 kB. Chưa xác nhận các ca thử UI/backend C6/C8.

- Cách phối hợp: mặc định AI gửi code trong chat để người dùng tự thêm. Người dùng đã yêu cầu sửa trực tiếp lỗi trường trùng và cho phép commit phần code hiện tại; cập nhật trực tiếp phase3.md được cho phép.
- Source đã có: address/types.ts, api.ts, queries.ts (hook useGetAddresses), schemas.ts, AddressForm, AddressCard, AddressesPage; route /account/addresses với RequireAuth và link trong UserMenu.
- AddressesPage đã xóa formError/actionError khi mở thêm hoặc sửa; handleSave quản lý formError, thao tác xóa/đặt mặc định quản lý actionError.
- Kiểm tra đã chạy trên source C6 hiện có: typecheck, lint, build, git diff --check đạt. Build cảnh báo chunk JavaScript khoảng 691 kB. Chưa thử CRUD bằng tài khoản trên browser/backend.
- Source hiện có thêm CheckoutContent và AddressGeographyFields; đã nối ba nhánh checkout thành công vào UI địa chỉ chung. Build (gồm typecheck), lint và git diff --check đạt sau khi sửa trường trùng.
- Địa giới đề xuất: API v2 provinces.open-api.vn cho tỉnh/xã, fallback nhập tay khi lỗi. Backend vẫn bắt buộc district nên giữ ô khu vực/quận/huyện nhập tay; khác checklist selector ba cấp cũ.
- C8 cần dùng chung CheckoutContent sau guard C7 cho guest cart, user cart và Buy Now; địa chỉ chuẩn bị thành addressId hoặc ba trường recipientName/recipientPhone/shippingAddress. Chưa gửi POST tạo đơn (C10).
- Bước tiếp theo: thử CRUD, chọn địa chỉ mặc định/khác, nhập tay, lỗi nguồn địa giới và guard phiên theo checklist trong chat. Code được commit theo yêu cầu người dùng; chưa đánh dấu C6/C8 hoàn thành kiểm thử. Sau khi thử đạt, tiếp tục C9/C10.

### Bàn giao ngày 04/11/2026 — Đối chiếu tiến độ với source

- Phạm vi phiên này: kiểm tra source và cập nhật `phase3.md`; không sửa code ứng dụng, không commit/push. Các bàn giao ngày cũ ở trên là lịch sử, không thay thế trạng thái hiện tại.
- Đã đối chiếu: API/DTO/service địa chỉ và `CheckoutRequest`/phí giao hàng trong backend; route, hook, form và ba nhánh checkout trong frontend. Bảy đầu việc code ở Nhóm 3 đã có nhưng chưa tick; đã cập nhật. C6 chưa được xác nhận CRUD chạy thật; C8 chưa gửi payload đặt đơn.
- Guard C7 đã commit ở `fd865b9`; form/CRUD địa chỉ ở `78a9316`, `ccba4ef`, `33b77f9`; UI địa chỉ checkout ở `756f874`. HEAD khi kiểm tra là `3cd8601`; `phase3.md` đã được Git theo dõi, working tree ban đầu sạch.
- Kiểm tra đã chạy: `npm run build` (gồm typecheck), `npm run lint`, `git diff --check` đạt. Build còn cảnh báo chunk > 500 kB (index khoảng 707 kB, HeroScene khoảng 1.001 kB). Chưa chạy luồng browser/backend trong phiên này.
- C8 hiện chuẩn bị `addressFields` nội bộ và có email liên hệ tùy chọn với validation; cả địa chỉ lẫn email chưa được nối vào `CheckoutRequest`. Chưa có API/mutation đặt đơn, selector shipping/payment/coupon, route success hoặc route payment result. Tổng tạm tính hiện có mới là tiền hàng, chưa gồm phí giao hàng.
- Việc tiếp theo theo thứ tự:
  1. Thử C6/C8 đang có: CRUD, mặc định/khác/nhập tay, sổ rỗng, validation điện thoại, sửa địa chỉ sau xác nhận, lỗi địa giới/fallback và guard phiên. Ghi kết quả UI/endpoint/status; chỉ chốt C6 khi đạt, giữ phần payload C8 mở đến C10.
  2. C9: dùng chung state checkout cho shipping/payment/coupon; thêm STANDARD/EXPRESS 30.000/55.000 VND, tổng tiền hàng + phí, coupon chưa xác thực. Chuẩn bị kiểu payment, bật COD trước; bật VNPay khi C12 hoạt động.
  3. C10 + phần còn lại C8/C11: tạo `CheckoutRequest` đúng nguồn hàng/địa chỉ và `contactEmail` tùy chọn; POST không retry công khai, chặn đổi/hết phiên và double-submit; giữ form khi lỗi; success từ response/sessionStorage; cleanup đúng cart và giữ nguyên giỏ khi Buy Now. Thử đủ bốn luồng COD.
  4. C12: redirect VNPay và xác nhận callback với backend; sau đó C13 kiểm tra hồi quy, responsive/accessibility và cập nhật tiến độ master plan.

### Bàn giao bổ sung ngày 04/11/2026 — Người dùng xác nhận kiểm thử C6/C8

- Người dùng xác nhận đã kiểm thử C6/C8 và chức năng hiện ổn định. Xác nhận này thay thế trạng thái chưa kiểm thử và bước yêu cầu thử lại C6/C8 trong bàn giao trước.
- Đã đánh dấu kiểm thử chức năng hiện có; C6 hoàn thành. C8 còn tích hợp `addressFields` vào request tạo đơn cùng C10, không coi xác nhận này là bằng chứng đã gọi API đặt đơn.
- Chỉ cập nhật tài liệu; không sửa code ứng dụng, không chạy lại build/lint cho thay đổi tài liệu, không commit/push. Chưa có log chi tiết từng nhánh do người dùng cung cấp.
- Bước tiếp theo: C9 — state checkout dùng chung cho shipping/payment/coupon, STANDARD/EXPRESS 30.000/55.000 VND, tổng tiền hàng + phí giao hàng; coupon chỉ ghi sẽ áp dụng khi đặt. Chuẩn bị kiểu payment, bật COD trước và bật VNPay khi C12 hoạt động. Sau đó C10 + chốt tích hợp C8/C11.

### Review code C9 ngày 04/11/2026

- Người dùng đã thêm `checkoutOptions.ts`, `CheckoutOptions.tsx`, `OrderSummaryPanel.tsx` và nối state/props trong `CheckoutContent`/`CheckoutPage`. Review tĩnh chưa thấy lỗi logic chặn phạm vi C9: phí đúng, tổng suy ra trực tiếp, không giảm giá giả, ba nguồn dùng chung UI và VNPay đang khóa.
- Đã chạy `npm run typecheck`, `npm run lint`, `npm run build`: đều đạt. Build cảnh báo chunk > 500 kB: index khoảng 711 kB, HeroScene khoảng 1.001 kB; không làm build thất bại.
- `git diff --check` chưa đạt: khoảng trắng cuối dòng tại `CheckoutPage.tsx` dòng 86, 87, 88, 176. Đây là lỗi định dạng; chưa sửa code thay người dùng trong phiên review này.
- Chưa chạy browser/backend cho C9; chưa xác nhận UI giữ lựa chọn, bàn phím hoặc các nhánh thực tế. Chưa chốt C9 hoàn thành. Bước tiếp theo: xóa khoảng trắng, thử UI C9; sau khi đạt chuyển C10 + tích hợp C8/C11.
- Chỉ cập nhật tiến độ tài liệu sau review; không commit/push.

### Điều chỉnh UI giao hàng ngày 04/11/2026

- Theo yêu cầu thu gọn của người dùng, đổi hai card radio giao hàng thành một `select` có tên phương thức và phí. Desktop đặt label và select cùng hàng, mobile xếp label phía trên; dùng lại state/callback và cấu hình phí C9.
- `npm run lint` và `npm run build` (gồm typecheck) đạt; build vẫn cảnh báo chunk > 500 kB. `git diff --check` còn bốn dòng khoảng trắng cuối dòng đã ghi nhận trong `CheckoutPage.tsx`.
- Chưa thử trực tiếp trên browser. Khi thử C9, dùng select STANDARD/EXPRESS thay cho radio; kiểm tra phí/tổng cập nhật và thao tác bàn phím. Không commit/push.

### Bàn giao ngày 05/11/2026 — Xác nhận C9, hướng dẫn C10

- HEAD khi đối chiếu: `4abac2a feat(checkout): add shipping payment and order preview`; working tree ban đầu sạch. `git diff --check` không báo lỗi trên working tree ban đầu; không dùng kết quả này để kết luận khoảng trắng trong commit cũ đã được sửa.
- Người dùng xác nhận đã thử UI C9 (đổi giao hàng/phí/tổng, nhập coupon và chọn COD), hoạt động ổn. Đây là xác nhận của người dùng; phiên này không tự chạy browser/backend hoặc build/lint.
- Đã đọc `CheckoutRequest`, `CheckoutItem`, `CheckoutResponse`, `OrderItemResponse`, `OrderController` và `CheckoutServiceImpl` để chuẩn bị hướng dẫn. Checkout trả response trực tiếp, HTTP 200; user cart bỏ `directItems`, guest cart và Buy Now gửi `directItems`. Backend chỉ clear server cart khi user đặt từ cart.
- Bước tiếp theo: người dùng tự triển khai trọn C10 — types, hàm dựng payload, API/mutation không retry, nối ba nơi render `CheckoutContent`, submit COD có guard phiên/chống nhấn lặp, lưu response và route success, cleanup đúng nguồn. Dùng lại state/form C8/C9; chưa sửa source ứng dụng trong phiên hướng dẫn này.
- Chưa chốt C8/C10/C11 trước khi thử thật guest cart, user cart, Buy Now guest và Buy Now user; giữ nguyên giỏ khi Buy Now. Chưa commit/push.

### Bàn giao bổ sung ngày 05/11/2026 — Triển khai trực tiếp C10

- Người dùng yêu cầu thêm code trực tiếp và giải thích từng file; yêu cầu này thay thế cách phối hợp tự code trong bàn giao ngay trước.
- Thêm types/schema response, builder payload, API, mutation, helper session, lưu xác nhận và trang success. Nối nguồn hàng ở ba nơi render CheckoutContent và thêm route `/checkout/success/:orderId`.
- CheckoutContent dùng lại state C8/C9; xác thực địa chỉ/email khi submit, khóa thao tác khi pending, không tạo form lồng nhau. Lỗi giữ form; timeout/5xx không tự retry và khóa đặt lại trên trang hiện tại.
- Axios có `meta.checkoutSession`: kiểm tra token/user ngay tại dispatch; response 401 không refresh/replay hoặc retry thành guest cho request này. Lỗi ApiError từ guard được giữ nguyên.
- Mutation khóa request theo user/guest trong tab, `retry: false`, `networkMode: "always"`; kiểm tra phiên sau response. Response đến muộn không sửa giỏ/cache hoặc lưu dữ liệu cho phiên mới.
- Guest cleanup trừ số lượng đã mua, giữ phần thêm trong lúc chờ; user cart chỉ invalidate key đúng userId rồi refetch GET trên success; Buy Now không cleanup giỏ. Lỗi storage/cache sau thành công không biến thành lỗi tạo đơn.
- Xác nhận lưu theo orderId và chủ đơn trong sessionStorage; kiểm tra schema/orderId/userId khi đọc. Navigation state hỗ trợ khi storage không ghi được; dữ liệu thiếu/hỏng có fallback. Số tiền và trạng thái lấy từ backend response.
- Có `npm run verify:checkout`: script Node dùng TypeScript có sẵn và Axios adapter giả lập; không cài test framework, không tạo CI. Chín ca kiểm tra logic đạt (payload bốn luồng, cleanup, storage, guard dispatch, 401/timeout không retry, mutation bốn luồng, khóa request/lỗi giữ giỏ, response muộn, lỗi hậu xử lý).
- Kiểm tra cuối: `npm run verify:checkout` đạt 9/9; `npm run lint`, `npm run build` (bao gồm typecheck) và `git diff --check` đạt. Build cảnh báo chunk > 500 kB (index khoảng 838 kB, HeroScene khoảng 1.000 kB).
- Chưa chạy trình duyệt/backend thật; chưa chốt C8/C10/C11. Khóa request hiện ở trong tab và khóa lỗi chưa rõ kết quả ở trang hiện tại; không bảo đảm exactly-once sau reload/tab khác nếu backend chưa có idempotency. Giỏ guest nhiều tab vẫn theo cơ chế persist hiện có, chưa có đồng bộ giao dịch xuyên tab.
- Không commit/push. Tiếp theo: thử bốn luồng COD thật và các ca lỗi ở checklist Nhóm 4 trước C12.

### Bàn giao ngày 06/11/2026 — Người dùng xác nhận hoàn thành kiểm thử COD

- Người dùng xác nhận: “Tôi đã test xong chức năng, đã chạy ổn định”, yêu cầu cập nhật `phase3.md`. Ghi nhận hoàn thành C10 và tích hợp C8/C11 trong phạm vi chức năng COD vừa triển khai; C9 đã được xác nhận trước đó. Không yêu cầu thử lại COD làm điều kiện bắt đầu C12.
- Đây là xác nhận kiểm thử tổng thể của người dùng, chưa có log request/status hoặc biên bản riêng cho bốn luồng và các nhánh lỗi. Không ghi thành kết quả AI tự chạy hoặc khẳng định đã quan sát từng ca cụ thể. C13 vẫn dành cho hồi quy sau khi nối VNPay.
- HEAD khi kiểm tra: `6a4485b feat(checkout): place COD orders and show confirmation`; working tree ban đầu sạch. Tài liệu đã cập nhật phần trạng thái, checklist Nhóm 2–4 và bảng bàn giao; giữ các ghi nhận ngày cũ để tham chiếu lịch sử.
- Giữ rõ giới hạn đã trao đổi: đơn guest lưu tại database, không gắn tài khoản (`user_id = null`); frontend giữ bản xác nhận tạm ở sessionStorage. Email nhập tại checkout được lưu vào `contact_email`, backend hiện chưa gửi email xác nhận tạo đơn. Không đánh dấu tính năng email hoàn thành theo xác nhận kiểm thử COD.
- Chỉ sửa tài liệu; không sửa source ứng dụng, không chạy lại build/lint/browser/backend, không commit/push. Kiểm tra `git diff --check` cho thay đổi tài liệu trước khi bàn giao.
- Bước tiếp theo: C12 — đối chiếu API/config VNPay backend, dùng lại payload và mutation checkout; xử lý `paymentUrl`, route `/payment/result` và kết quả backend trước khi bật VNPay. Sau C12 thực hiện C13.

### Bàn giao bổ sung ngày 06/11/2026 — Nối redirect trong handlePlaceOrder

- Theo yêu cầu sửa trực tiếp, đã nối `handlePlaceOrder` trong `CheckoutContent.tsx` với helper `getVnpayRedirectUrl` người dùng đã thêm: COD mở trang xác nhận, VNPAY redirect toàn trang. Giữ validation, guard phiên, khóa request lặp và xử lý lỗi chưa rõ kết quả; không điều hướng nếu component đã unmount trong lúc chờ.
- Sau khi có response tạo đơn, khóa submit kể cả khi điều hướng lỗi; hiện mã đơn và link mở lại cổng thanh toán nếu đã có URL hợp lệ. Cập nhật nhãn nút theo phương thức và trạng thái đã tạo đơn.
- Kiểm tra: `npm run build` (gồm typecheck), `npm run lint` và `git diff --check` đạt. Build còn cảnh báo chunk > 500 kB. Chưa chạy browser/backend/sandbox; chưa chạy `verify:checkout` trong phiên này.
- C12 chưa hoàn thành: radio VNPay vẫn khóa; kiểm tra cũ trong `scripts/verify-checkout.cjs` vẫn kỳ vọng payload VNPAY bị từ chối, cần cập nhật theo contract mới. Tiếp tục các bước hướng dẫn còn lại và thử callback thật trước khi chốt C12. Không commit/push.

### Bàn giao bổ sung ngày 06/11/2026 — Rà soát và bổ sung phần code C12 còn thiếu

- Người dùng yêu cầu kiểm tra code C12 đã tự thêm và bổ sung phần thiếu. Đã đọc toàn bộ feature payment, router, checkout, interceptor, cấu hình và source xử lý callback backend; giữ các thay đổi có sẵn của người dùng.
- Phần chính đã có: builder nhận VNPAY, redirect sau tạo đơn, API return public giữ query nguyên vẹn, query hạn chế request lặp, route public và UI các trạng thái. Không cần tạo luồng đặt đơn mới.
- Bổ sung: mở radio VNPay và callback đổi phương thức trong `CheckoutOptions.tsx`; giải thích snapshot trạng thái thanh toán ở `CheckoutSuccessPage.tsx`; cập nhật kiểm tra cũ từ từ chối VNPAY sang từ chối phương thức không hợp lệ.
- Mở rộng script Node sẵn có, không cài framework: mutation đủ bốn luồng COD/VNPay, payload/ID, URL redirect, query callback nguyên vẹn và không token, HTTP 401/500/timeout không retry và không xóa phiên, response backend/schema, QueryObserver mount lại/focus/reconnect sau thành công và lỗi.
- Kết quả: `npm run verify:checkout` đạt 15/15; `npm run lint`, `npm run build` (gồm typecheck) và `git diff --check` đạt. Build vẫn cảnh báo chunk > 500 kB (index khoảng 841 kB, HeroScene khoảng 1.000 kB).
- Chưa chạy trình duyệt/backend/VNPay sandbox, chưa kiểm tra giao dịch hoặc TransactionLog thật. Không suy ra kiểm thử StrictMode/reload/backend idempotency đã đạt từ kiểm tra QueryObserver. C12 đã đủ phần code theo checklist hiện tại nhưng chờ thử thật trước khi chốt; không commit/push.

### Bàn giao ngày 07/11/2026 — Sandbox trả lỗi phê duyệt terminal

- Người dùng đã thử redirect sandbox và cung cấp URL tạo thanh toán có đủ query, TmnCode `OSDJ38NS`, thời gian tạo 00:18:36 và hết hạn 00:33:36 ngày 07/11/2026 (GMT+7). Không lưu lại toàn bộ URL có chữ ký trong tài liệu.
- Người dùng xác nhận TmnCode/SecretKey khớp email VNPay; URL trang lỗi cuối cùng là `https://sandbox.vnpayment.vn/paymentv2/Payment/Error.html?code=71`, hiển thị “Website này chưa được phê duyệt”. Đây là kết quả do người dùng cung cấp, không phải giao dịch AI tự chạy.
- Mã 71 phù hợp với “Terminal chưa được duyệt” trong [tài liệu kỹ thuật thanh toán định kỳ VNPay](https://sandbox.vnpayment.vn/apis/files/VNPAYGW_RecurringPayment_Techspec2.1.0-VN.pdf). Nguồn này thuộc sản phẩm định kỳ; thông báo trực tiếp từ trang lỗi sandbox của người dùng là bằng chứng chính cho hướng xử lý trạng thái phê duyệt merchant hiện tại. Chưa truy cập được trạng thái merchant trên hệ thống quản trị VNPay.
- Bước tiếp theo: phản hồi email VNPay, cung cấp TmnCode và URL/mã lỗi 71 để yêu cầu kiểm tra phê duyệt/kích hoạt terminal sandbox; hỏi rõ URL IPN cần đăng ký. Backend đã có `/api/payments/vnpay/ipn`, nhưng chưa xác nhận IPN công khai được đăng ký với VNPay. Không suy ra thiếu IPN chính là nguyên nhân chưa duyệt.
- Chưa có kết quả thanh toán thành công/hủy/thất bại hoặc callback/IPN thật; C12 vẫn chờ kiểm thử sau khi VNPay xử lý trạng thái terminal. Việc bỏ dấu `#` trong OrderInfo hoặc chuẩn hóa IPv6 loopback là kiểm tra riêng, chưa có bằng chứng chúng gây lỗi 71. Không sửa source hoặc commit/push trong lần cập nhật này.

### Bổ sung ngày 07/11/2026 — Bỏ dấu # trong nội dung thanh toán

- Theo yêu cầu người dùng, đã đổi đúng dòng dựng `vnp_OrderInfo` trong backend `VnPayServiceImpl.java` từ `Thanh toan don hang #` thành `Thanh toan don hang `, giữ nguyên mã đơn và cơ chế ký URL. Chưa thay đổi xử lý IP.
- Đã đọc lại dòng sau khi sửa và kiểm tra `git diff --check` của file backend đạt; không chạy build hoặc sandbox cho thay đổi chuỗi này. Cần khởi động lại backend và tạo lại link để thử. Chưa có bằng chứng thay đổi này xử lý lỗi 71; trạng thái phê duyệt terminal vẫn cần VNPay kiểm tra. Không commit/push.

### Bàn giao ngày 07/11/2026 — Người dùng xác nhận kiểm thử thành công, chốt C12

- Người dùng xác nhận “đã test thành công”, sau đó yêu cầu nội dung commit C12 và cập nhật `phase3.md` để kết thúc nhiệm vụ. Ghi nhận C12 hoàn thành theo xác nhận này; thay thế trạng thái chờ sandbox/lỗi 71 của các bàn giao trước. Không khẳng định riêng việc bỏ dấu `#` đã trực tiếp gây ra hay sửa lỗi 71.
- Phạm vi frontend: mở phương thức VNPay, dùng lại payload/mutation checkout theo nguồn hàng; redirect toàn trang sau khi lưu xác nhận và cleanup đúng nguồn; kiểm tra URL backend/orderId; route public `/payment/result`; gửi query nguyên vẹn, bỏ token và không retry; query hạn chế gọi lặp; UI chờ/thành công/hủy/thất bại/chưa xác định cùng đường tiếp tục mua sắm. Giữ khóa tạo đơn khi redirect lỗi và ghi rõ trạng thái snapshot trên success.
- Backend tham chiếu có thay đổi riêng: bỏ dấu `#` trong nội dung `vnp_OrderInfo`, giữ mã đơn và cơ chế ký. Backend thuộc repository khác, không gộp thay đổi đó vào commit frontend.
- Kiểm tra đã có từ phiên triển khai: `npm run verify:checkout` đạt 15/15; lint, build (gồm typecheck) và diff check đạt; build còn cảnh báo chunk > 500 kB. Phiên chốt này chỉ cập nhật tài liệu, đối chiếu source/diff và soạn nội dung commit; không chạy lại build/lint/sandbox.
- Kết quả chạy thật là xác nhận của người dùng; chưa có log request/status/UI riêng các nhánh hủy/thất bại/sai chữ ký, bằng chứng PAID/TransactionLog hoặc IPN công khai để ghi chi tiết. Không suy ra đã thử hết các ca này; kiểm tra bổ sung ở C13.
- Commit frontend gợi ý: `feat(payment): handle VNPay redirect and result`. Commit backend riêng cho thay đổi nội dung: `fix(payment): remove hash character from VNPay order info`. Chưa thực hiện commit/push theo yêu cầu chỉ soạn nội dung.
- Bước tiếp theo: C13 — hồi quy tổng thể và chốt Phase 3. Không giao lại code C12 hoặc giữ lỗi 71 như trở ngại đang chờ xác nhận.
