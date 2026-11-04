# Phase 3 — Tiến độ và kế hoạch tiếp tục

> Cập nhật: 04/11/2026. Người dùng xác nhận đã kiểm thử C6/C8 và chức năng hiện ổn định. C6 hoàn thành; phần chọn/nhập địa chỉ hiện có của C8 đã được xác nhận. Phần gửi địa chỉ trong request tạo đơn sẽ nối và kiểm tra cùng C10. Bước tiếp theo: C9, sau đó C10 + chốt tích hợp C8/C11.
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

Người dùng xác nhận hoàn thành C1–C5; C4 đã thử trên web và C5 đã kiểm tra hết theo xác nhận ngày 29/10/2026. Ngày 01/11/2026, người dùng xác nhận đã bổ sung guard và thử toàn bộ trường hợp C7. Đối chiếu ngày 04/11/2026: guard C7, code sổ địa chỉ và UI địa chỉ checkout đều đã commit; working tree sạch trước khi cập nhật tài liệu này:

| Mốc | Kết quả | Commit |
|---|---|---|
| C1 | Giỏ guest persist; thêm variant/số lượng từ chi tiết sản phẩm | `792796e feat(cart): add persistent guest cart` |
| C2 | GET/POST giỏ user; `useCart()` chọn guest hoặc server cart | `23c128d feat(cart): connect authenticated cart` |
| C3 | `/cart`, ba component con, đổi số lượng bằng nút/bàn phím, xóa, tổng tiền, lỗi và cảnh báo | `0662960 feat(cart): build cart page and item controls` |
| C4 | Link `/cart` và badge số lượng guest/user trong header; người dùng xác nhận đã thử trên web | `cd1c50e feat(cart): add header entry and merge guest cart after login` |
| C5 | Người dùng xác nhận đã kiểm tra toàn bộ C5 và hoàn thành; chưa cung cấp log method/status chi tiết để ghi biên bản | Cùng commit `cd1c50e` |
| C7 | Hoàn thành code route/CTA, nguồn cart/Buy Now, validate giỏ user, guard phiên và guard dấu merge; người dùng xác nhận đã thử các trường hợp C7, chưa cung cấp log method/status/UI từng nhánh | `dc2257f` cho phần đầu; `fd865b9` cho guard dấu merge |
| C6 | Hoàn thành; người dùng xác nhận đã kiểm thử, chức năng ổn định ngày 04/11/2026; chưa cung cấp log chi tiết | `78a9316`, `ccba4ef`, `33b77f9` |
| C8 | Người dùng xác nhận đã kiểm thử, chức năng chọn/nhập địa chỉ hiện ổn định ngày 04/11/2026; đã chuẩn bị `addressFields`, phần gửi request đặt đơn kiểm tra cùng C10 | `756f874`; có bổ sung UI/email ở các commit sau |
| C11 | Đã có lối vào Buy Now với variant/số lượng đang chọn; chưa đặt đơn hoặc xác nhận giỏ được giữ nguyên sau tạo đơn | Cùng commit `dc2257f` |

Kiểm tra được ghi nhận: phiên C3 đạt build, lint và `git diff --check`; sau khi thêm C4–C5, `npm run build`, `npm run lint`, `npm run typecheck` và `git diff --check` đều đạt. Build còn cảnh báo chunk JavaScript lớn hơn 500 kB, không làm build thất bại. C4 đã được người dùng thử trên web nhưng chưa ghi chi tiết từng thao tác; C5 được người dùng xác nhận hoàn thành, chưa có biên bản merge thành công, lỗi một phần, timeout và đăng nhập lại để ghi method/status chi tiết. Không suy ra kết quả kiểm thử từ commit hoặc kiểm tra tĩnh.

Ngày 29/10/2026, người dùng xác nhận C5 đã kiểm tra hết và hoàn thành. Xác nhận này thay thế trạng thái "chưa thử" trong bàn giao cũ; chi tiết từng request và nhánh lỗi chưa được cung cấp để ghi lại. Không coi các kiểm tra tĩnh ở trên là bằng chứng thay cho xác nhận của người dùng.

Kiểm tra lại code C7 tại `dc2257f` ngày 31/10/2026: `npm run build` và `npm run lint` đạt; build cảnh báo chunk JavaScript > 500 kB. `git show --check HEAD` báo bốn dòng có khoảng trắng cuối dòng trong `ProductPurchaseOptions.tsx` (dòng 42, 70, 102, 141). Chưa có biên bản chạy đủ luồng C7 với backend/trình duyệt.

Ngày 01/11/2026: đã review diff guard mới; `npm run lint`, `npm run build` (bao gồm `tsc -b`) và `git diff --check` đều đạt. Build vẫn cảnh báo chunk JS > 500 kB. Người dùng xác nhận đã thử toàn bộ trường hợp C7 với hệ thống; chưa có log chi tiết để ghi method/status/UI từng nhánh. Đây là xác nhận kiểm thử của người dùng, không phải kết quả tự chạy browser/backend trong phiên này.

Ngày 04/11/2026: người dùng xác nhận “tôi đã kiểm thử C6/C8, hiện tại chức năng ổn định”. Ghi nhận C6 hoàn thành và C8 đạt kiểm thử chức năng hiện có. Chưa có log method/status/UI từng nhánh; không suy ra đã gửi payload tạo đơn vì C10 chưa triển khai. Không giao lại kiểm thử C6/C8 làm điều kiện bắt đầu C9.

Các điểm cần giữ lại khi tiếp tục:

- Giỏ guest dùng `ec.guestCart` trong Zustand persist. Giá/tồn kho trong snapshot là số liệu lúc thêm hàng, không phải tồn kho thời gian thực.
- Giỏ user dùng TanStack Query với key **`[...qk.cart, userId]`**, không ghi dữ liệu user vào key chung `qk.cart`.
- `CartRow.id`: guest là `variantId`; user là `cartItemId`. PUT/DELETE item phải dùng `cartItemId`.
- `CartSummary` đã có CTA `/checkout`, khóa khi giỏ rỗng/lỗi tồn kho/đang xử lý và khi có dấu merge chưa đối chiếu cho user hiện tại.
- Bản C3 hiện khóa thao tác khi mutation pending, nhập số lượng lưu khi Enter/blur. Debounce stepper 400 ms ghi trong master plan chưa được triển khai; không coi đây là tính năng đã có. Chỉ bổ sung khi nhiệm vụ cần hoặc người dùng yêu cầu, rồi ghi rõ kết quả.
- Merge C5 gọi sau login hoặc verify-email thành công, không chạy từ render/effect. Mỗi `POST /api/cart/items` cộng số lượng; `ec.cartMerge` lưu dấu item chưa rõ kết quả để tránh tự gửi lại sau timeout/refresh. Dấu này cần người dùng đối chiếu với server cart; frontend không bảo đảm exactly-once nếu backend chưa hỗ trợ idempotency.
- Trong lúc merge, `useCart()` khóa thêm/sửa/xóa giỏ; `CartPage` hiện trạng thái và khu vực đối chiếu khi có dấu tồn đọng. `CartCheckoutEntry` đã chặn cả merge đang chạy và dấu merge tồn đọng khi mở lại checkout đã vào trước đó.
- C6 và chức năng địa chỉ hiện có của C8 đã được người dùng kiểm thử, xác nhận ổn định. Dùng lại feature address và UI/state checkout hiện có; nối dữ liệu địa chỉ vào request đặt đơn cùng C10. C9 đã có code UI/state và đạt typecheck/lint/build, chưa xác nhận thử UI; VNPay vẫn khóa đến C12. C10 và C12 chưa triển khai; C11 mới có lối vào và preview, C13 chưa chốt.

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
| `src/features/checkout/components/CheckoutContent.tsx` | UI địa chỉ chung sau guard; chọn địa chỉ lưu/nhập tay, email tùy chọn; chưa có shipping/payment/coupon hoặc submit đơn |
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
- [x] Code nút Mua ngay lấy variant/số lượng đang chọn và điều hướng không thêm vào giỏ. Chưa thử giữ nguyên giỏ sau tạo đơn.
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

**Hoàn thành nhóm:** người dùng xác nhận nguồn/guard/CTA đã hoạt động đúng qua thử thật; C7 hoàn thành. C11 mới hoàn thành toàn bộ khi đặt được đơn Buy Now ở nhóm 4.

Đã commit code: `dc2257f feat(checkout): validate cart entry and support buy-now source`; giữ checklist C11 mở đến khi thử đặt đơn.

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
- [ ] Nối `addressFields` vào `CheckoutRequest` và thực sự gửi `addressId` hoặc đủ `recipientName`, `recipientPhone`, `shippingAddress` theo chế độ — thực hiện cùng C10.
- [x] Người dùng xác nhận đã kiểm thử C6, chức năng hiện ổn định ngày 04/11/2026; chưa cung cấp biên bản từng thao tác/status để ghi chi tiết.
- [x] Người dùng xác nhận đã kiểm thử C8, chức năng hiện ổn định ngày 04/11/2026; chưa cung cấp biên bản từng nhánh. Xác nhận payload gửi thật thuộc phần tích hợp C10 còn mở phía trên.

Các đầu việc code đã được review tĩnh; kết quả kiểm thử C6/C8 được ghi nhận từ xác nhận trực tiếp của người dùng. C6 hoàn thành; C8 đã đạt chức năng địa chỉ hiện có, còn kiểm tra dữ liệu gửi trong request đặt đơn cùng C10. Bước tiếp theo là C9.

**Hoàn thành khi:** CRUD backend chạy thật; địa chỉ được chọn/nhập đi đúng vào checkout payload; validation điện thoại và trường bắt buộc hoạt động.

**Không tạo trùng:** hai form địa chỉ có schema/state độc lập chỉ vì nằm ở hai trang. UI chọn địa chỉ có thể dùng select/list đơn giản; dialog chỉ thêm khi cần.

Commit gợi ý: `feat(address): manage customer addresses`, sau đó `feat(checkout): collect delivery address`.

### Nhóm 4 — Checkout và COD (C9 + C10 + chốt C11)

**Phụ thuộc:** nguồn hàng nhóm 2 và địa chỉ nhóm 3.

- [x] Đã có state shipping/payment/coupon trong `CheckoutContent`, dùng chung cho cart và Buy Now; COD mặc định, VNPay khóa đến C12.
- [x] Đã có selector STANDARD/EXPRESS và cấu hình 30.000/55.000 VND khớp `CheckoutServiceImpl`.
- [x] `OrderSummaryPanel` tính preview tiền hàng + phí; cả ba nơi render `CheckoutContent` đã truyền `subtotal` đúng nguồn.
- [ ] Khi nối C10, số tiền xác nhận/success phải lấy từ `CheckoutResponse`.
- [x] Đã có input coupon và thông báo sẽ kiểm tra khi đặt; chưa tự xác thực hoặc trừ tiền trên preview. Nối mã vào request tại C10.
- [ ] Thử UI C9: đổi STANDARD/EXPRESS cập nhật tổng; nhập/xóa coupon; COD/VNPay khóa; giữ lựa chọn khi đổi địa chỉ; kiểm tra guest cart/user cart/Buy Now và bàn phím.
- [ ] Dựng một hàm tạo `CheckoutRequest` theo nguồn hàng và chế độ địa chỉ.
- [ ] `POST /api/orders/checkout` dùng `meta: { noPublicRetry: true }`; chặn hết phiên và double-submit.
- [ ] Lỗi đặt hàng giữ dữ liệu form, lỗi coupon cho phép sửa/xóa mã rồi thử lại.
- [ ] Sau tạo đơn thành công: xử lý giỏ theo bảng nhóm 2, không xóa giỏ chỉ vì bắt đầu request.
- [ ] Lưu `CheckoutResponse` trong sessionStorage, kiểm tra đúng orderId khi hiển thị `/checkout/success/:orderId`.
- [ ] Thiếu dữ liệu xác nhận/reload có fallback hợp lý, không dựng thông tin đơn giả.
- [ ] Thử COD với guest cart, user cart, Buy Now guest và Buy Now user; xác nhận Buy Now giữ nguyên giỏ.

**Hoàn thành khi:** bốn luồng COD chạy thật và không double-submit; lỗi không làm mất form/giỏ. Đây là lúc chốt đầy đủ C11.

**VNPay:** có thể chuẩn bị kiểu payment từ đây; chỉ bật lựa chọn VNPay khi nhóm 5 đã có hành vi hoạt động.

Commit gợi ý: `feat(checkout): add shipping payment and order preview`, `feat(checkout): place COD orders and show confirmation`; commit Buy Now theo phần code thực tế.

### Nhóm 5 — Thanh toán VNPay (C12)

**Phụ thuộc:** API tạo đơn và xử lý response nhóm 4. Kiểm tra sớm cấu hình backend/sandbox để phát hiện trở ngại môi trường.

- [ ] Dùng lại checkout, không tạo form/payload đặt hàng thứ hai cho VNPay.
- [ ] Redirect toàn trang từ `paymentUrl` backend trả; đối chiếu URL tương đối/tuyệt đối với config hiện tại.
- [ ] `/payment/result` giữ nguyên query `vnp_*` để gửi return endpoint backend.
- [ ] Callback có tác dụng cập nhật thanh toán: tránh request lặp do render, retry hoặc focus; kiểm tra hành vi StrictMode và reload.
- [ ] Cache query với `staleTime: Infinity`/`retry: false` không bảo đảm chỉ gọi một lần qua reload, tab khác hoặc phiên mới. Xác nhận khả năng xử lý lặp/idempotency của backend trước khi tuyên bố bảo đảm đó.
- [ ] Hiển thị thành công/hủy/thất bại dựa trên kết quả backend; không tin riêng query string để kết luận đã thanh toán.
- [ ] Có đường tiếp tục mua sắm hoặc xem đơn phù hợp với quyền/routes hiện có; không gắn CTA dẫn tới route chưa triển khai.

**Hoàn thành khi:** có kết quả redirect và callback thật cho các nhánh có thể thử; ghi rõ nhánh sandbox/môi trường chưa xác nhận. Không suy ra thanh toán thành công từ việc mở được trang VNPay.

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

| Nội dung | Trạng thái tại 04/11/2026 |
|---|---|
| Hoàn thành được người dùng xác nhận | C1–C7; chức năng địa chỉ hiện có của C8 đã kiểm thử ổn định. C5/C7/C6/C8 chưa có log chi tiết từng nhánh |
| Commit gần nhất | HEAD `3cd8601`; guard C7 đã commit ở `fd865b9`, địa chỉ checkout ở `756f874` |
| Bước tiếp theo | C9: giao hàng, phương thức thanh toán, coupon và tổng tạm tính. Dùng lại C6/C8 đã được kiểm thử |
| Sau bước đó | C9: shipping/payment/coupon/tổng; C10: COD/success/cleanup giỏ; chốt C8 và C11 qua payload/đặt đơn thật |
| Chưa xác nhận hoàn thành | C8 còn tích hợp gửi payload cùng C10; C9 đã có code, còn thử UI và bật VNPay cùng C12; C10/C12 chưa triển khai; C11 một phần, C13 chưa chốt |
| Phần chuyển tiếp từ C3 | CTA checkout/disable đã nối ở C7; tồn kho guest là snapshot; debounce 400 ms chưa có |
| Biên bản còn thiếu chi tiết | C5/C7 và kiểm thử C6/C8 đã được người dùng xác nhận; có thể bổ sung method/status/UI từng nhánh khi cần truy vết |

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
