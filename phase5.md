# Phase 5 — Quản trị vận hành, dashboard và báo cáo

> Ngày lập: **13/11/2026**. Đối chiếu frontend tại HEAD `87eaa75`; working tree sạch trước khi lập kế hoạch.
> Nguồn: [frontend_master_plan.md](frontend_master_plan.md), [phase4.md](phase4.md), source frontend và source backend tham chiếu tại `../ecommerce-backend`.
> **Trạng thái: chỉ lập kế hoạch cho giai đoạn sau, chưa triển khai E1–E22.** Các contract dưới đây được đọc từ source, chưa được xác nhận bằng API/backend đang chạy.
> **Cách học bắt buộc: khi bắt đầu mỗi nhiệm vụ, sinh mã hướng dẫn theo từng bước và từng file để người dùng tự học, tự gõ code; cuối nhiệm vụ có nội dung commit.** Không tự triển khai source khi người dùng chỉ yêu cầu hướng dẫn.

## 1. Mục tiêu và điểm bắt đầu

Sau Phase 5, ADMIN/MANAGER/STAFF sử dụng các màn hình đúng quyền để vận hành cửa hàng: xử lý đơn, quản lý danh mục/thương hiệu/sản phẩm, điều chỉnh kho, xử lý trả hàng và đánh giá, quản lý coupon/người dùng, xem dashboard và xuất CSV.

- Giữ một frontend với `StorefrontLayout` và `AdminLayout`; dùng lại auth, Axios client, TanStack Query, React Hook Form, Zod, Zustand session và design tokens.
- `AdminLayout`, `AdminHomePage`, `RequireRole`, `PERMISSIONS`, `hasPermission`, `useCan` đã tồn tại. Hiện `/admin` mới có trang khung; chưa có màn hình nghiệp vụ quản trị.
- Không suy ra Phase 4 đã hoàn thành: tài liệu hiện ghi D5–D7 đã có code, D7 còn chờ thử tích hợp, D8–D13 chưa làm. C13 của Phase 3 cũng còn hồi quy tổng thể.
- Lộ trình mặc định: tiếp tục Phase 4 theo bàn giao của nó; khi chuyển sang Phase 5 bắt đầu **E1**. Có thể làm E1–E5 sớm để tạo đơn DELIVERED phục vụ D9/D12 nếu người dùng chọn; ghi rõ phần kiểm thử còn thiếu của từng phase.
- Không tách một mốc E0 chỉ để khảo sát. Đọc contract, chuẩn bị tài khoản/dữ liệu và kiểm tra Network ngay tại nhiệm vụ sử dụng, theo cách làm đã chốt ở Phase 4.

Ngoài phạm vi: triển khai production, tự động hoàn tiền VNPay, tạo API backend còn thiếu, chính sách B11, phần B12 còn hoãn, guest order tracking, gửi email xác nhận đơn, cài lại toàn bộ hệ thống test/CI đã hoãn. Chỉ ghi yêu cầu phối hợp backend khi gặp giới hạn; không tự sửa repository backend trong lúc hướng dẫn frontend.

## 2. Quy ước hướng dẫn tự học và commit

### 2.1 Đầu ra bắt buộc khi bắt đầu một nhiệm vụ

Mỗi E là một kết quả có thể kiểm tra, không phải yêu cầu sinh toàn bộ code Phase 5 một lần. AI hướng dẫn theo thứ tự:

1. **Kết quả:** mở URL nào, thao tác gì, dữ liệu nào phải xuất hiện/thay đổi.
2. **Kiến thức:** giải thích khái niệm mới ngay trước khi dùng, gồm cú pháp TypeScript/React nếu cần; chỉ rõ phần React, thư viện và backend chịu trách nhiệm.
3. **File và luồng dữ liệu:** liệt kê file tạo/sửa, chức năng từng file, phần tái sử dụng; mô tả `input → schema → API → backend → query/cache → UI`.
4. **Sinh mã hướng dẫn:** cung cấp các đoạn code đủ để tự thực hiện, chia theo file và bước nhỏ, ghi rõ vị trí chèn/thay thế và import cần thêm. Tránh `...` tại đoạn bắt buộc để code chạy. Giải thích quyết định quan trọng, không chỉ đưa code để sao chép.
5. **Người dùng tự code:** sau mỗi bước có thao tác kiểm tra nhanh và một câu hỏi/bài tập nhỏ giúp hiểu luồng. Khi nhận code đã làm, review diff rồi hướng dẫn sửa điểm còn thiếu. Không ghi đè phần người dùng đang làm.
6. **Kiểm tra và chốt:** ghi kết quả thực tế, giới hạn, cập nhật bảng tiến độ/bàn giao và kết thúc bằng commit của nhiệm vụ. Nếu mốc quá lớn cần tách E9a/E9b…, mỗi nhiệm vụ nhỏ cũng phải có commit riêng.

Không tự sửa source khi người dùng đang yêu cầu học/hướng dẫn. Khi có yêu cầu triển khai trực tiếp, vẫn giải thích các phần đã làm và cách kiểm tra. Dùng DTO viết tay, không chạy `gen:api`; chỉ thêm thư viện khi màn hình cần dùng và đã đối chiếu phiên bản/API tại thời điểm thực hiện.

### 2.2 Mẫu yêu cầu sinh mã cho một nhiệm vụ

```text
Hãy hướng dẫn tôi làm E<n> trong phase5.md theo chế độ tự học và tự code.
Đọc source hiện tại trước, giữ phần tôi đã làm và kiểm tra lại contract backend của mốc này.
Giải thích mục tiêu, kiến thức cần học, file cần sửa và luồng dữ liệu.
Sinh mã hướng dẫn theo từng file, từng bước nhỏ; chỉ rõ vị trí thêm/sửa và giải thích code.
Không tự ghi source thay tôi. Sau mỗi bước cho cách chạy, kiểm tra và một bài tập nhỏ.
Khi tôi gửi code, hãy review; chỉ đánh dấu hoàn thành theo kết quả kiểm tra thực tế.
Cuối nhiệm vụ ghi phần còn thiếu và nội dung commit tương ứng trong kế hoạch.
```

### 2.3 Quy ước commit

- Dòng **Commit cuối nhiệm vụ** ở mỗi E là thông điệp đề xuất để dùng sau khi hoàn thành phạm vi tương ứng; không phải commit đã được tạo.
- Commit nên chứa đúng thay đổi của mốc và cập nhật tiến độ liên quan. Đọc `git diff`, thêm các file của mốc bằng đường dẫn cụ thể rồi commit; không gom thay đổi ngoài nhiệm vụ.
- Chưa thử backend/browser thì ghi rõ trong bàn giao. Có commit không có nghĩa toàn bộ nghiệp vụ đã được nghiệm thu.
- Yêu cầu lập kế hoạch này chưa bao gồm thực hiện commit/push hoặc code E1. Chỉ chạy Git commit/push khi có yêu cầu tương ứng sau này.

## 3. Route, quyền và tổ chức code

### 3.1 Route đích và quyền

Ký hiệu: **A = ADMIN, M = MANAGER, S = STAFF**. CUSTOMER/guest không được vào các route nghiệp vụ admin. Menu, route guard và nút thao tác đều phải đúng quyền; backend vẫn là nơi kiểm tra quyền cuối cùng.

| Route | Quyền truy cập | Hành động hạn chế | Mốc |
|---|---|---|---|
| `/admin` | A/M/S | Giữ landing khi chưa có trang đích | E1 |
| `/admin/orders`, `/admin/orders/:id` | A/M/S | Hủy chỉ A/M | E2–E5 |
| `/admin/categories` | A/M | CRUD | E6 |
| `/admin/brands` | A/M | CRUD | E7 |
| `/admin/products` | A/M/S | Đổi trạng thái/ngừng bán variant chỉ A/M | E8, E12 |
| `/admin/products/new`, `/admin/products/:id/edit` | A/M/S | Cùng hạn chế hành động như trên | E9–E12 |
| `/admin/inventory` | A/M/S | Xem, điều chỉnh, lịch sử | E13–E14 |
| `/admin/return-requests` | A/M/S | Duyệt/từ chối chỉ A/M | E15 |
| `/admin/reviews` | A/M/S | Ẩn/hiện chỉ A/M; trả lời A/M/S | E16 |
| `/admin/coupons` | A/M/S | Tạo/sửa/bật tắt chỉ A/M | E17 |
| `/admin/users`, `/admin/users/:id` | A/M | Đổi role chỉ A; M chỉ khóa/mở CUSTOMER | E18 |
| `/admin/dashboard` | A/M | Chỉ đọc | E19 |
| `/admin/reports` | A/M | Xem trước và tải CSV | E20–E21 |

Chỉ thêm menu/whitelist cho route đã hoạt động. E2 có trang orders thì có thể đưa S từ `/admin` tới `/admin/orders`; E19 có dashboard thì đưa A/M tới `/admin/dashboard`. Không điều hướng tới trang chưa được tạo. Giữ đích được yêu cầu nếu hợp lệ và đúng quyền; không lấy fallback ghi đè mọi deep link.

### 3.2 Thư mục dự kiến

```text
src/features/admin/
  components/                 # Sidebar, PageHeader, FilterBar, DataTable khi cần
  navigation.ts               # Menu và quyền; không chứa hook trong vòng lặp
  pages/AdminHomePage.tsx      # Landing đang có
  orders/                     # types, api, queries, schemas, pages, components
  categories/
  brands/
  products/
  inventory/
  returns/
  reviews/
  coupons/
  users/
  dashboard/
  reports/
```

- Tạo module/file khi đến mốc sử dụng, không scaffold toàn bộ cây trống ở E1. Các đường dẫn module trong nhiệm vụ bên dưới tính từ `src/features/admin/`.
- Dùng lại `src/shared/components/{Pagination,StatusBadge}.tsx`, `src/lib/format.ts`, `src/shared/api/{client,errors,pagination,queryClient,queryKeys}.ts` và `src/shared/types/{common,enums}.ts`.
- Đọc lại kết quả Phase 4 trước khi tạo `ConfirmDialog` hoặc `ImageDropzone`: nếu đã có thì tái sử dụng, nếu chưa thì tạo tại mốc cần đầu tiên. Không mặc định các file dự kiến trong Phase 4 đã tồn tại.
- DTO quản trị tách khỏi DTO customer. Chỉ trích component trình bày đơn thuần khi thực sự dùng chung; không import hook đơn customer vào trang admin hoặc tạo vòng import giữa hai feature.
- Lazy-load nhánh admin theo router đang dùng; chart/table chỉ nằm trong phần admin cần chúng. Không tải toàn bộ dashboard khi khách mở storefront.

## 4. Contract hiện tại và những điểm không được chép nguyên từ master plan

| Vấn đề | Source tham chiếu ngày lập | Cách lập kế hoạch |
|---|---|---|
| Category | POST/PUT `/api/admin/categories` nhận **multipart** `name`, `status`, `image?`; DTO trả `imageUrl` | E6 dùng FormData, không JSON `{ logo }` như master cũ |
| Category/brand list | Có GET public `/api/categories`, `/api/brands`; không thấy GET admin riêng trong controller | Đối chiếu dữ liệu ACTIVE/INACTIVE trước khi dùng; không tự gọi endpoint admin GET chưa có |
| Brand | Multipart `name`, `status`, `logo`; tạo bắt buộc logo, sửa được bỏ logo | E7 giữ ảnh cũ khi không chọn file mới |
| Tạo product | Part `data` là chuỗi JSON, part `images` tùy chọn; controller parse thủ công, không gọi Bean Validation ở đường create | E9 validate form; ghi nhu cầu backend cưỡng chế validation. FE không thay thế validation server |
| Sửa product | PUT JSON; variant được khớp bằng **SKU**, không có variant ID trong request. SKU mới tạo variant; bỏ variant khỏi payload không xóa nó | SKU đã lưu không cho đổi tùy tiện. Xóa/ngừng bán dùng endpoint riêng E12 |
| Tồn kho khi sửa product | Gửi variant đã có sẽ `setQuantity(stock)` từ payload, chưa thấy lịch sử điều chỉnh ở nhánh này | E10 sửa thông tin chung bằng cách **bỏ trường variants**. Chặn riêng sửa giá/thuộc tính variant đã có cho đến khi backend có contract không ghi đè kho; không coi readonly stock/refetch trước lưu là giải quyết race |
| Ảnh sản phẩm | Có thêm/xóa/chọn primary; chưa có endpoint lưu thứ tự ảnh đã upload | E11 không hứa lưu drag-and-drop reorder. Kiểm tra field `isPrimary` thật, không đổi mọi field bắt đầu bằng `is` thành tên khác |
| Ngừng bán variant | DELETE `/products/{id}/variants/{variantId}` hiện đặt status INACTIVE | Dùng nhãn “Ngừng bán biến thể”, không mô tả là xóa cứng hoặc hứa khôi phục khi chưa có API |
| Trạng thái đơn | `/status` vẫn nhận CANCELLED; controller cho S gọi, service vẫn thực hiện hủy. `/cancel` riêng chỉ A/M; service chưa giới hạn mọi nhánh ngoài PENDING/PROCESSING | E4 chỉ expose luồng xử lý/giao hàng; E5 hủy riêng từ PENDING/PROCESSING. Ghi gap backend và kiểm thử quyền server, không kết luận ẩn nút đã sửa lỗ hổng |
| Trả hàng | Tạo request chưa đổi order sang RETURN_REQUESTED. Process duyệt/từ chối đổi trạng thái **cả đơn**; duyệt cộng tồn theo lượng trả | E15 xử lý qua return API, không qua dropdown status đơn. Ghi giới hạn trả một phần, nhiều request cùng đơn, variant bị xóa |
| Hoàn tiền/lịch sử kho khi trả | Chưa thấy process return cập nhật paymentStatus, gọi cổng hoàn tiền hoặc ghi InventoryHistory | Không hiển thị “Đã hoàn tiền” từ APPROVED. Refetch dữ liệu, ghi phần backend cần bổ sung |
| Chi tiết return | Admin controller chỉ có GET list và PUT process, chưa có GET detail | Mở drawer từ dữ liệu dòng; không tạo route chi tiết phụ thuộc RAM rồi hứa reload dùng được |
| Review | Toggle/reply trả MessageResponse; toggle chưa gọi tính lại averageRating | Refetch là đồng bộ dữ liệu server, không khẳng định điểm catalog đã đổi sau ẩn review |
| Users | M chỉ thay status CUSTOMER; service chưa thấy chặn tự khóa/tự đổi role | E18 chặn thao tác lên chính mình ở UI và ghi nhu cầu kiểm tra backend; không tự chỉnh role của phiên hiện tại |
| Dashboard/report | Service dùng `ZoneId.systemDefault()`; chart/report đã có bước điền ngày trống | Cần chốt timezone server/DB với giờ VN; không tự cộng lại các ngày hay mặc định backend luôn GMT+7 |
| Reports lỗi Blob | `normalizeError` hiện đã đọc Blob JSON; chưa có `download.ts` | E21 thêm download helper, kiểm tra lỗi JSON/text fallback và header thật; không viết lại toàn bộ client |
| Dạng response | Product mutation, user status/role, coupon toggle trả text; category/brand DELETE trả 204; review trả `{ message }` | Khai báo đúng API từng hàm, không ép tất cả thành JSON envelope |

Các nguồn cần đọc lại tại mốc sử dụng, tương đối từ `../ecommerce-backend/src/main/java/com/ecommerce/backend/`:

- `modules/{order,category,brand,product,inventory,returnrequest,review,coupon,auth,dashboard,report}/controller/Admin*Controller.java`.
- DTO request/response trong từng module; `common/utils/FileValidator.java` cho định dạng ảnh JPEG/PNG/WebP, giới hạn 5 MiB/file ở source hiện tại.
- `modules/order/{service/OrderAdminServiceImpl.java,enums/OrderStatus.java}`; `modules/product/service/ProductServiceImpl.java`.
- `modules/{returnrequest,review,auth}/service/{ReturnRequestServiceImpl,ReviewServiceImpl,UserServiceImpl}.java` tương ứng từng module.
- `modules/{dashboard,report}/service/{DashboardServiceImpl,ReportServiceImpl}.java` tương ứng và query thống kê trong `modules/order/repository/OrderRepository.java`.

Đây là phát hiện từ source chỉ đọc. Khi backend đổi, cập nhật mục này theo bằng chứng mới; không tự coi gap còn tồn tại hoặc đã sửa chỉ dựa vào tài liệu cũ.

## 5. Quy ước dữ liệu, cache và kiểm tra dùng chung

### 5.1 Dữ liệu và request

- ID luôn là `string`, dùng `ID`/`isPositiveLongId` đang có; không `Number(id)`/`parseInt(id)`. Tiền hiển thị bằng `formatVND`, tổng nghiệp vụ lấy từ server.
- URL page bắt đầu từ 1, API page bắt đầu từ 0. Dùng `normalizePage` cho Spring Page dạng `{ content, page: {...} }`. Đổi filter/size/sort đưa về trang đầu; xử lý trang vượt phạm vi sau mutation.
- Bảng orders/products/users/returns/reviews phân trang server. Inventory/coupons và các list category/brand trả mảng: phân trang phía client trên toàn bộ kết quả đã lấy, không giả tham số API page/size.
- Orders/products dùng `sortBy`, `direction`; reviews dùng Pageable `sort=createdAt,desc`; users/returns không expose sort tùy ý khi controller chưa nhận. Whitelist cột sort theo field entity, không gửi nhãn cột như `orderDate` làm field sort.
- Dùng FormData cho multipart, để browser/Axios tạo boundary; kiểm tra interceptor không ép `application/json` lên FormData. Product create: `data = JSON.stringify(payload)`, append nhiều file với cùng key `images`.
- Không lưu File, Blob, object URL hoặc token vào query key/Zustand persist. Thu hồi object URL khi thay file/unmount và sau download.
- Form giữ dữ liệu đang nhập khi request/refetch lỗi. Request thành công nhưng refetch lỗi phải nói đã lưu và chỉ thử GET lại; không tự phát mutation lần nữa.

### 5.2 Cache và phiên

Bổ sung query keys theo mốc, giữ key customer hiện có. Ví dụ hình dạng đề xuất:

```ts
["admin", userId, role, "orders", "list", normalizedParams]
["admin", userId, role, "orders", "detail", orderId]
["admin", userId, role, "products", "detail", productId]
["admin", userId, role, "inventory", "list", normalizedFilters]
["admin", userId, role, "inventory", "history", inventoryId]
["admin", userId, role, "reports", "preview", submittedDateRange]
```

- Query chỉ enabled khi phiên còn hạn và có quyền. Giữ dữ liệu trang trước chỉ trong cùng user/role, không để cache phiên A hiện trong phiên B.
- Mutation mặc định `retry: false`, khóa gửi lặp. Với thay kho, xử lý đơn/return, toggle và export, dùng cách không xếp hàng tự chạy khi reconnect như các mutation nhạy cảm đang có.
- Chụp user/token/role lúc bắt đầu; kiểm tra trước dispatch và trước ghi cache/toast/navigate/download sau các đoạn chờ. Response cũ sau logout/đổi tài khoản không được phục hồi cache hoặc tải file cho phiên mới.
- Dùng lifecycle logout và nhánh 401/tài khoản bị khóa hiện có. 403 là lỗi quyền, không tự logout mọi trường hợp; nếu quyền trên server đã đổi thì ngừng hành động và hướng tới cập nhật phiên.
- Dùng cập nhật sau thành công làm mặc định. Nếu học optimistic ở review/coupon: cancel query liên quan, snapshot đúng trang/phiên, khóa cùng dòng, rollback có kiểm soát, invalidate cuối cùng; không bật optimistic cho kho/đơn/return.
- Toggle là thao tác đảo trạng thái: timeout chưa chắc chưa thực hiện. GET lại trước khi cho bấm tiếp; không tự retry để “đạt trạng thái mong muốn”.

| Sau mutation | Dữ liệu cần làm mới |
|---|---|
| Status/hủy đơn | Detail + mọi list orders admin đang liên quan; dashboard/reports; kho/catalog nếu hủy hoàn tồn |
| Category/brand | List admin/public; tên/ảnh/filter trên catalog và product detail liên quan |
| Product/ảnh/variant | List/detail admin, catalog list/detail/compare, kho nếu thay variant; cart liên quan chỉ qua cache/query đã có |
| Điều chỉnh kho | List/history kho, product admin/public và dashboard cảnh báo tồn |
| Process return | List return các status, detail/list order, kho, dashboard/reports; không tự đặt paymentStatus |
| Review | List review admin; query customer/catalog liên quan nếu đã tồn tại, theo dữ liệu backend thật |
| Coupon | List coupon; lần checkout sau phải tính lại giá bằng API hiện có, không sửa tổng đơn cũ |
| User status/role | Detail/list user; không sửa cache/session của một tài khoản khác thành phiên đang dùng |

Invalidation chỉ tác động QueryClient đang chạy; không hứa tự cập nhật cửa sổ/tài khoản khác. Hồi quy đa phiên phải refetch/reload riêng, không đưa realtime vào phạm vi.

### 5.3 Kiểm tra ở mỗi mốc

- Chạy `npm run lint` và `npm run typecheck` sau thay đổi code; `npm run build` khi thay router/lazy load/dependency hoặc chốt nhóm module, và ở E22.
- Chạy script có sẵn phù hợp phần ảnh hưởng: `verify:catalog`, `verify:checkout`, `verify:profile`. Không chạy mọi bộ kiểm tra lặp lại cho mỗi thay đổi tài liệu nhỏ.
- Ca logic có rủi ro như phân quyền, transition, giữ ID, payload variant không đè kho, ngày báo cáo và filename download có thể bổ sung kiểm tra Node theo cách repo đang dùng. Không cài framework/CI mới chỉ để đạt checklist.
- Mỗi màn hình cần thử happy path, loading/error/empty, 403/404 phù hợp, dữ liệu null, reload/Back/Forward, submit lặp và đổi phiên khi request chậm. Với mutation có tác động nghiệp vụ, thử trên dữ liệu dev/sandbox.
- Ghi riêng: đã code; kiểm tra tĩnh; logic với API giả lập; backend/browser thật; người dùng xác nhận. Chỉ đánh dấu hoàn thành theo tiêu chí đã kiểm chứng.

## 6. Bảng nhiệm vụ và phụ thuộc

| Mốc | Kết quả | Phụ thuộc chính | Trạng thái |
|---|---|---|---|
| E1 | Admin shell, menu và guard theo quyền | Auth đang có | Chưa bắt đầu |
| E2 | Danh sách đơn và DataTable server | E1 | Chưa bắt đầu |
| E3 | Chi tiết đơn admin | E2 | Chưa bắt đầu |
| E4 | Chuyển trạng thái xử lý/giao hàng | E3 | Chưa bắt đầu |
| E5 | Hủy đơn có lý do | E3 | Chưa bắt đầu |
| E6 | Danh mục và upload ảnh | E1 | Chưa bắt đầu |
| E7 | Thương hiệu và logo | E6 để dùng lại upload/form | Chưa bắt đầu |
| E8 | Danh sách sản phẩm admin | E2, E6–E7 | Chưa bắt đầu |
| E9 | Tạo sản phẩm, thông số, biến thể | E8 | Chưa bắt đầu |
| E10 | Sửa thông tin sản phẩm an toàn với tồn kho | E9; contract riêng cho sửa variant cũ | Chưa bắt đầu |
| E11 | Quản lý ảnh sản phẩm | E10 | Chưa bắt đầu |
| E12 | Trạng thái sản phẩm, ngừng bán variant | E10 | Chưa bắt đầu |
| E13 | Danh sách tồn kho và bộ lọc | E8 | Chưa bắt đầu |
| E14 | Điều chỉnh kho và lịch sử | E13 | Chưa bắt đầu |
| E15 | Xem và xử lý yêu cầu trả hàng | E3–E4, E14; D12 hoặc dữ liệu return dev | Chưa bắt đầu |
| E16 | Kiểm duyệt và trả lời đánh giá | E2; D9 hoặc dữ liệu review dev | Chưa bắt đầu |
| E17 | Coupon và khoảng hiệu lực | E1; checkout hiện có để hồi quy | Chưa bắt đầu |
| E18 | Danh sách/chi tiết và quản lý người dùng | E1 | Chưa bắt đầu |
| E19 | Dashboard và bộ lọc thời gian | E4, E14; dữ liệu thống kê dev | Chưa bắt đầu |
| E20 | Xem trước báo cáo doanh thu | E19 để dùng lại bộ lọc ngày | Chưa bắt đầu |
| E21 | Tải CSV có xác thực | E20 | Chưa bắt đầu |
| E22 | Hồi quy và bàn giao Phase 5 | E1–E21 trong phạm vi đã chốt | Chưa bắt đầu |

Thứ tự mặc định E1 → E22. Có thể chuyển sang module độc lập khi một phần bị vướng backend, nhưng phải ghi mốc còn thiếu; không đánh dấu cả phase hoàn thành. Không cần hoàn thành dashboard để bắt đầu xử lý đơn.

## 7. Chi tiết từng nhiệm vụ

### E1 — Admin shell, điều hướng và phân quyền

**Kết quả:** A/M/S mở `/admin`, thấy khung quản trị responsive; CUSTOMER bị đưa tới `/forbidden`, guest đăng nhập rồi quay lại route hợp lệ.

**Kiến thức và mã hướng dẫn:** nested route, `Outlet`, menu cấu hình, guard so với quyền nút, lazy route. Sinh từng phần sửa `src/app/layouts/AdminLayout.tsx`, `src/app/router.tsx`, `src/shared/auth/{permissions,redirect}.ts` và tạo `navigation.ts`, `components/{AdminSidebar,AdminPageHeader}.tsx`.

**Các bước tự code:**

1. Dùng lại guard/session, tạo sidebar và vùng nội dung có loading/error phù hợp; hỗ trợ đóng/mở menu ở màn hình nhỏ và focus bàn phím.
2. Lọc menu bằng `hasPermission` với role đọc một lần, hoặc component riêng dùng `useCan`; không gọi hook trong `.filter()`/vòng lặp.
3. Thêm quyền còn thiếu như `user.changeStatus`, `product.deleteVariant` tại mốc sử dụng. Không dùng `product.write` để cho S ngừng bán variant.
4. Chuẩn bị cách kiểm tra quyền cho từng route con; chỉ đăng ký/menu những trang đã tạo. Giữ landing `/admin` và mở rộng deep link khi các mốc sau có trang thật.

**Kiểm tra/hoàn thành:** thử guest/CUSTOMER/S/M/A, URL trực tiếp, logout, mobile/bàn phím; kiểm tra nhánh admin được tải riêng và không phá các route account. Bài tập: giải thích vì sao giấu menu chưa đủ để bảo vệ API.

**Commit cuối nhiệm vụ:** `feat(admin): add role-aware admin shell and navigation`

### E2 — Danh sách đơn và DataTable đầu tiên

**Kết quả:** `/admin/orders` lấy đơn thật, tìm kiếm/lọc/phân trang/sort được giữ trong URL.

**Kiến thức và mã hướng dẫn:** DTO admin, query key, URL state, debounce, phân trang server và bảng khai báo cột. Sinh `orders/{types,api,queries,filters}.ts`, `orders/pages/AdminOrdersPage.tsx`, `components/{DataTable,FilterBar}.tsx`. Theo định hướng master, đưa TanStack Table vào tại đây nếu vẫn chọn dùng; kiểm tra package/API trước khi hướng dẫn cài, không giả định đã có trong `package.json`.

**Các bước tự code:** GET `/api/admin/orders` với `keyword, orderStatus, paymentStatus, page, size, sortBy, direction`; normalize page; hiển thị mã, khách, tổng, ngày và trạng thái. Whitelist `createdAt/totalPrice`, phân biệt `orderDate` ở response với field sort. Đổi filter về trang đầu, debounce keyword, truyền AbortSignal. Bảng nhận page/count từ server, không sort riêng một trang rồi mô tả là toàn bộ dữ liệu. Đăng ký route/menu và đích đăng nhập S khi trang hoạt động.

**Kiểm tra/hoàn thành:** danh sách rỗng, nhiều trang, query URL sai, trang vượt phạm vi, sort số tiền, Back/reload, request tìm kiếm đến sai thứ tự và chuyển tài khoản. Bài tập: vẽ đường đi URL page 2 tới API page 1.

**Commit cuối nhiệm vụ:** `feat(admin-orders): add searchable paginated order list`

### E3 — Chi tiết đơn quản trị

**Kết quả:** `/admin/orders/:id` reload được và hiển thị chi tiết từ GET `/api/admin/orders/{id}`.

**Kiến thức và mã hướng dẫn:** route param, kiểm tra ID, nullable DTO, trạng thái tải/404, tách component trình bày. Mở rộng `orders/{types,api,queries}.ts`, tạo `orders/pages/AdminOrderDetailPage.tsx` và các khối thông tin người nhận, dòng đơn, tổng tiền.

**Các bước tự code:** nối link từ E2, query detail theo phiên và ID; đọc DTO admin riêng. Nhận diện đơn guest bằng `userId === null` ở detail, không suy ra chỉ từ tên khách ở list. Không dựng link sản phẩm từ variantId. Giữ giá/tên/ảnh snapshot của dòng đơn; chỉ hiển thị thời điểm có thật, không dùng updatedAt làm ngày giao hàng chắc chắn. Chưa gắn mutation status/hủy trong mốc đọc dữ liệu.

**Kiểm tra/hoàn thành:** đơn guest/user, ID lớn còn nguyên, URL sai, 403/404, variant đã xóa/null, tổng tiền/giảm giá và reload. Bài tập: giải thích vì sao không dùng lại nguyên query `/api/orders/{id}` của khách hàng.

**Commit cuối nhiệm vụ:** `feat(admin-orders): show order details and recipient information`

### E4 — Cập nhật trạng thái xử lý và giao hàng

**Kết quả:** A/M/S chuyển được `PENDING → PROCESSING → SHIPPED → DELIVERED` theo từng bước, xác nhận trước khi gửi.

**Kiến thức và mã hướng dẫn:** bảng chuyển trạng thái, mutation, khóa submit, xử lý dữ liệu cũ và invalidation. Sinh `orders/orderActions.ts`, schema và `orders/components/UpdateOrderStatusDialog.tsx`; mở rộng API/query.

**Các bước tự code:** PUT `/api/admin/orders/{id}/status` với `{ newStatus }`. Tạo danh sách hành động vận hành từ trạng thái hiện tại; không đưa CANCELLED hoặc nhánh RETURN_* vào dropdown chung. Dùng `ConfirmDialog` nếu Phase 4 đã có. Thành công nhận detail chuẩn từ server; thất bại do trạng thái đã đổi thì tải lại và yêu cầu chọn lại, không tự gửi trạng thái kế tiếp.

**Kiểm tra/hoàn thành:** thử từng chuyển trạng thái, bước nhảy không hợp lệ, đơn đã đổi ở tab khác, gửi lặp và đổi phiên. Kiểm tra dữ liệu DELIVERED để dùng D9/D12; không tự đặt COD thành PAID nếu API chưa làm. Ghi gap S gọi CANCELLED trực tiếp còn cần backend chặn. Bài tập: chỉ ra phần nào UI kiểm soát và phần nào bắt buộc server kiểm soát.

**Commit cuối nhiệm vụ:** `feat(admin-orders): update fulfillment status with confirmation`

### E5 — Hủy đơn có lý do theo quyền

**Kết quả:** A/M hủy đơn PENDING/PROCESSING qua dialog; S không có hành động này.

**Kiến thức và mã hướng dẫn:** tái sử dụng dialog nhưng tách nghiệp vụ customer/admin, lỗi form và phản hồi không chắc chắn. Tạo `orders/components/AdminCancelOrderDialog.tsx`, request/schema/mutation trong module orders.

**Các bước tự code:** PUT `/api/admin/orders/{id}/cancel` với `{ reason }`; trim và yêu cầu lý do theo DTO hiện hành. Kiểm tra quyền và trạng thái trước gửi, khóa dialog submit khi pending; sau thành công cập nhật đơn và invalidate kho/catalog liên quan. Nếu server trả PENDING_REFUND thì hiển thị “Chờ hoàn tiền”; không mô tả tiền đã về. Timeout phải GET lại trước khi đề xuất gửi hủy lần nữa.

**Kiểm tra/hoàn thành:** đơn chưa trả tiền/đã trả tiền, thiếu lý do, S bị 403 khi gọi trực tiếp, đơn đã giao/đã hủy và hai tab cùng thao tác. Đối chiếu số lượng kho sau hủy để phát hiện hoàn tồn lặp. Gap kiểm tra trạng thái backend ghi ở mục 4 vẫn cần phối hợp. Bài tập: giải thích vì sao không dùng `/status` để hủy.

**Commit cuối nhiệm vụ:** `feat(admin-orders): cancel eligible orders with a reason`

### E6 — Quản lý danh mục và ảnh danh mục

**Kết quả:** `/admin/categories` cho A/M xem, tạo, sửa và xóa danh mục hợp lệ.

**Kiến thức và mã hướng dẫn:** list dạng mảng, dialog form, FormData, File so với URL ảnh, object URL cleanup. Sinh `categories/{types,api,queries,schemas}.ts`, page/form; tạo hoặc dùng lại `ImageDropzone` tại mốc này.

**Các bước tự code:** GET public `/api/categories` với keyword nếu cần; kiểm tra có hiển thị INACTIVE. POST/PUT `/api/admin/categories[/{id}]` bằng multipart `name`, `status`, `image?`, nhận CategoryResponse có `imageUrl`. DELETE nhận 204. Cho nhập status rõ ràng; không chọn ảnh mới thì giữ ảnh server, không hứa xóa ảnh riêng khi chưa có API. Dùng validation ảnh theo mục 4 và làm mới dữ liệu public sau lưu.

**Kiểm tra/hoàn thành:** trùng tên, file sai loại/quá dung lượng, giữ/thay ảnh cũ, list inactive, xóa danh mục trống và bị chặn khi còn sản phẩm. `totalProducts` giúp UI nhưng server quyết định xóa; không đọc body JSON của 204. Bài tập: xem Network và giải thích vì sao key file là `image`.

**Commit cuối nhiệm vụ:** `feat(admin-categories): manage categories with image uploads`

### E7 — Quản lý thương hiệu và logo

**Kết quả:** `/admin/brands` cho A/M CRUD thương hiệu và xem logo đúng sau reload.

**Kiến thức và mã hướng dẫn:** tái sử dụng upload/form có giới hạn, schema create/update khác nhau, lỗi field từ server. Sinh module `brands/` theo cấu trúc E6, giữ type/contract riêng.

**Các bước tự code:** GET `/api/brands`; POST/PUT `/api/admin/brands[/{id}]` multipart `name`, `status`, `logo`. Tạo bắt buộc file; sửa bỏ file để giữ logo. DELETE trả 204. Không đổi tên field `logo` thành `image` vì dùng cùng component chọn file. Invalidate brand public và catalog liên quan sau mutation.

**Kiểm tra/hoàn thành:** tạo thiếu logo, file lỗi, tên trùng, sửa không thay logo, INACTIVE và xóa khi còn sản phẩm. Bài tập: phân biệt phần có thể tái sử dụng giữa category/brand với phần phải giữ riêng.

**Commit cuối nhiệm vụ:** `feat(admin-brands): manage brands and logo uploads`

### E8 — Danh sách sản phẩm quản trị

**Kết quả:** `/admin/products` lọc được sản phẩm theo tên, status, category, brand và phân trang server.

**Kiến thức và mã hướng dẫn:** dùng lại DataTable, filter phụ thuộc dữ liệu tham chiếu, tách admin/public DTO. Sinh `products/{types,api,queries,filters}.ts`, `products/pages/AdminProductsPage.tsx`.

**Các bước tự code:** GET `/api/admin/products`; map `keyword, status, categoryId, brandId, page, size, sortBy, direction`. Đối chiếu field sort entity trước khi whitelist; không đưa `totalStock/variantCount` là trường tổng hợp vào sort server nếu chưa hỗ trợ. Hiển thị ảnh, giá, trạng thái, tổng tồn, số variant. Chỉ bật link tạo/sửa khi E9/E10 đã có route; không lấy public list ACTIVE thay cho danh sách admin.

**Kiểm tra/hoàn thành:** ACTIVE/INACTIVE/HIDDEN, category/brand null hoặc không còn lựa chọn, nhiều filter, reset trang, ID không mất chính xác và role S xem được. Bài tập: giải thích vì sao phải có DTO và query key admin riêng.

**Commit cuối nhiệm vụ:** `feat(admin-products): list products with server-side filters`

### E9 — Tạo sản phẩm, thông số và biến thể

**Kết quả:** `/admin/products/new` tạo một sản phẩm có thông tin chung, thông số, ít nhất một biến thể theo quy tắc UI và ảnh tùy chọn.

**Kiến thức và mã hướng dẫn:** React Hook Form, `useFieldArray`, object key/value, schema nested, chuyển form value thành DTO. Sinh `products/schemas.ts`, `products/components/{ProductForm,SpecificationEditor,VariantFields}.tsx`, page tạo, hàm build request và mutation. Chia hướng dẫn thành thông tin chung → thông số → variants → upload/submit, cho chạy được sau mỗi bước.

**Các bước tự code:** POST multipart `/api/admin/products`, `data` chứa JSON AdminProductRequest, nhiều `images` nếu có. Validate tên/category, tiền không âm, stock nguyên không âm, SKU không rỗng/trùng trong form, khóa key/value trùng gây mất dữ liệu. Giữ ID dạng string. Bản đầu tự thêm từng variant; sinh tổ hợp thuộc tính/SKU tự động để mở rộng sau khi luồng thủ công ổn định. Response hiện chỉ có text, nên sau thành công về danh sách và refetch; không bịa ID để navigate detail.

**Kiểm tra/hoàn thành:** nhiều variant, ảnh lỗi, SKU trùng, category đã bị xóa, submit lặp, tạo thành công rồi refetch lỗi. Timeout không POST lại tự động; kiểm tra danh sách trước. Ghi thiếu validation create phía backend, không tuyên bố Zod đã xử lý toàn bộ nghiệp vụ. Bài tập: viết một payload mẫu từ form và giải thích string ID/number stock.

**Commit cuối nhiệm vụ:** `feat(admin-products): create products with specifications and variants`

### E10 — Sửa sản phẩm mà không ghi đè tồn kho

**Kết quả:** `/admin/products/:id/edit` tải GET detail, sửa được tên/category/brand/giá cơ bản/mô tả/thông số và giữ tồn kho hiện tại.

**Kiến thức và mã hướng dẫn:** DTO → form defaults, reset có điều kiện, tách create/update payload, cập nhật một phần theo hành vi backend. Mở rộng types/builder/form, thêm `products/pages/EditProductPage.tsx` và PUT mutation.

**Các bước tự code:** PUT JSON `/api/admin/products/{id}`; khi chỉ sửa thông tin chung thì **không gửi `variants`**, vì service bỏ qua nhánh variant khi trường null/không có. Type request phải cho phép trường này vắng mặt; schema create vẫn yêu cầu variant theo UI E9. Không reset form đang dirty vì refetch nền. Hiện variant đã lưu ở chế độ xem, SKU ổn định; nếu hỗ trợ thêm mới thì payload chỉ chứa variant mới, kiểm tra SKU không trùng các variant đang có.

**Phần phụ thuộc backend:** chưa bật sửa giá/attributes của variant cũ bằng cách gửi lại stock snapshot. Muốn hoàn thiện phần đó, backend cần API/DTO nhận variant ID và cập nhật metadata không chạm tồn, hoặc cơ chế tương đương có kiểm soát cạnh tranh. Sau khi contract được sửa, bổ sung bước hướng dẫn và commit riêng `feat(admin-products): edit existing variant details safely`; không đánh dấu phần này xong theo commit sửa thông tin chung.

**Kiểm tra/hoàn thành phần độc lập:** sửa mô tả trong khi tab khác điều chỉnh kho, xác nhận request không có variants và tồn mới được giữ; reload form, brand null, dữ liệu không tìm thấy, PUT thành công/GET lỗi. Bài tập: giải thích vì sao chỉ khóa ô stock vẫn có thể làm mất cập nhật kho.

**Commit cuối nhiệm vụ:** `feat(admin-products): edit product metadata without overwriting inventory`

### E11 — Thêm, xóa và chọn ảnh đại diện sản phẩm

**Kết quả:** khu ảnh trên trang sửa quản lý được ảnh server và phản ánh đúng ở catalog sau làm mới.

**Kiến thức và mã hướng dẫn:** phân biệt file đang chọn với entity ảnh đã lưu, mutation theo dòng, lỗi từng thao tác. Sinh `products/components/ProductImageManager.tsx` và API/query cho ảnh.

**Các bước tự code:** POST `/{id}/images` multipart `images`; DELETE `/{id}/images/{imageId}`; PATCH `/{id}/images/{imageId}/primary`, đều dưới `/api/admin/products`. Mỗi hành động hoàn tất refetch detail, không đoán imageId hoặc ảnh primary còn lại. Dùng FileValidator làm tham chiếu, cleanup preview. Chưa làm lưu thứ tự ảnh đã upload vì không có endpoint.

**Kiểm tra/hoàn thành:** thêm nhiều file, ảnh lỗi, xóa ảnh primary, xóa ảnh đã bị xóa ở tab khác, chọn primary rồi reload, ảnh thiếu fallback. Bài tập: chỉ ra dữ liệu nào thuộc local preview và dữ liệu nào phải lấy lại từ backend.

**Commit cuối nhiệm vụ:** `feat(admin-products): manage product images and primary selection`

### E12 — Đổi trạng thái sản phẩm và ngừng bán biến thể

**Kết quả:** A/M đổi ACTIVE/INACTIVE/HIDDEN của sản phẩm và ngừng bán variant; S chỉ có phần xem/sửa được backend cho phép.

**Kiến thức và mã hướng dẫn:** quyền cấp hành động, thao tác cần xác nhận, soft delete và ảnh hưởng liên feature. Thêm `products/components/{ProductStatusAction,DeactivateVariantAction}.tsx`, permission và mutations tương ứng.

**Các bước tự code:** PATCH `/api/admin/products/{id}/status?status=...`; DELETE `/api/admin/products/{id}/variants/{variantId}`. Hiển thị trạng thái trả về sau refetch, giữ ID và giải thích ngừng bán variant không xóa snapshot đơn cũ. Không thêm nút xóa cứng toàn sản phẩm/khôi phục variant nếu chưa có API. Làm mới public list/detail/compare và dữ liệu tồn liên quan.

**Kiểm tra/hoàn thành:** S không gọi được hành động hạn chế, sản phẩm ẩn khỏi luồng public theo backend, variant đang ở giỏ/đơn cũ có fallback hợp lệ, request đồng thời và 404. Bài tập: giải thích vì sao không thể xóa variant chỉ bằng cách bỏ dòng khỏi form E10.

**Commit cuối nhiệm vụ:** `feat(admin-products): control product visibility and deactivate variants`

### E13 — Danh sách tồn kho và bộ lọc

**Kết quả:** `/admin/inventory` xem được kho theo SKU/tên, status và khoảng tồn; link từ dashboard sau này mở đúng bộ lọc.

**Kiến thức và mã hướng dẫn:** phân trang client khác server, dữ liệu suy ra, chuẩn hóa filter. Sinh `inventory/{types,api,queries,filters}.ts`, `inventory/pages/InventoryPage.tsx`.

**Các bước tự code:** GET `/api/admin/inventory` với `keyword, status, minQuantity, maxQuantity`, nhận mảng. Giữ bộ lọc ở URL; validate số nguyên không âm và min ≤ max. Sort/page trong client trên toàn bộ response; status dùng enum IN_STOCK/LOW_STOCK/OUT_OF_STOCK. Phân biệt `inventoryId`, `variantId`, `productId`. Chưa thêm virtualization nếu chưa đo được vấn đề hiệu năng thực tế.

**Kiểm tra/hoàn thành:** tồn 0, ngưỡng status từ server, min/max sai, keyword SKU, mảng rỗng/lớn, reload URL và không gửi API page/size giả. Bài tập: xác định ID nào phải truyền khi điều chỉnh kho.

**Commit cuối nhiệm vụ:** `feat(admin-inventory): list stock levels with filters`

### E14 — Điều chỉnh tồn và xem lịch sử

**Kết quả:** A/M/S thêm/trừ kho, đọc được lịch sử sau thao tác và catalog phản ánh tồn mới khi tải lại.

**Kiến thức và mã hướng dẫn:** validation phụ thuộc dữ liệu server, mutation không optimistic, query chỉ tải khi mở drawer. Sinh schema, `inventory/components/{AdjustStockDialog,InventoryHistoryDrawer}.tsx` và mở rộng API/query.

**Các bước tự code:** POST `/api/admin/inventory/{inventoryId}/adjust` với `{ quantity, action, reason? }`; số nguyên dương, ADD/DEDUCT rõ ràng. Preview tồn mới chỉ là dự tính; backend quyết định kết quả. GET `/{inventoryId}/history` khi mở lịch sử. Sau thành công invalidate list/history/product/dashboard, xử lý dòng rời filter do status/tồn đã đổi. Hiển thị performedBy đúng response; source hiện có giá trị “Admin”, không suy ra tên người thao tác cụ thể.

**Kiểm tra/hoàn thành:** ADD, DEDUCT vừa đủ/vượt tồn, số 0/âm/lẻ, hai tab, double-click, timeout sau gửi và reload lịch sử. Khi không biết kết quả thì GET lại, không phát lại điều chỉnh tự động. Bài tập: giải thích vì sao không `setStock(old + quantity)` làm kết quả cuối.

**Commit cuối nhiệm vụ:** `feat(admin-inventory): adjust stock and inspect history`

### E15 — Xem và xử lý yêu cầu trả hàng

**Kết quả:** `/admin/return-requests?status=PENDING&page=1` hiển thị request và ảnh bằng chứng; A/M duyệt hoặc từ chối có lý do, S chỉ xem.

**Kiến thức và mã hướng dẫn:** filter enum, drawer từ list, schema điều kiện, nghiệp vụ nhiều thực thể. Sinh module `returns/`, `ReturnRequestsPage`, `ReturnRequestDrawer`, `ProcessReturnDialog`.

**Các bước tự code:** GET `/api/admin/return-requests` với `status, page, size`; PUT `/{id}/process` với `{ status: APPROVED | REJECTED, rejectReason? }`. REJECTED cần lý do không trắng. Drawer hiển thị dữ liệu dòng, gallery và link orderId sang E3; chưa thêm GET detail giả. Khóa khi đang gửi, refetch nếu đã được xử lý nơi khác. Duyệt xong tải lại order/kho/list request, không tự chuyển paymentStatus hay thêm bản ghi lịch sử kho ở frontend.

**Kiểm tra/hoàn thành:** PENDING/APPROVED/REJECTED, thiếu lý do, S bị 403, xử lý lặp, trả một phần và nhiều dòng cùng đơn, variant không còn. Ghi rõ giới hạn backend ở mục 4; không nghiệm thu hoàn tiền hoặc tính đúng nghiệp vụ nhiều request nếu chưa xác nhận. Khi D12 chưa sẵn, dùng dữ liệu dev hợp lệ và ghi chưa thử end-to-end customer → admin. Bài tập: phân biệt trạng thái request, order và payment.

**Commit cuối nhiệm vụ:** `feat(admin-returns): review and process return requests`

### E16 — Kiểm duyệt và trả lời đánh giá

**Kết quả:** `/admin/reviews` lọc theo rating/tên sản phẩm, A/M ẩn/hiện, A/M/S trả lời review.

**Kiến thức và mã hướng dẫn:** Pageable sort, mutation theo row, cập nhật sau thành công và optimistic có rollback nếu thực hiện. Sinh module `reviews/`, `AdminReviewsPage`, `ReviewReplyForm`, `ReviewVisibilityAction`.

**Các bước tự code:** GET `/api/admin/reviews` với `rating, productName, page, size, sort=createdAt,desc`; PATCH `/{id}/toggle-visibility`; POST `/{id}/reply` với `{ replyText }`. Kiểm tra JSON field `hidden`, MessageResponse và validation reply thực tế. Bản đầu refetch sau thành công; bài tập mở rộng optimistic phải tuân thủ mục 5.2. 404 do customer xóa thì làm mới list và đóng form phù hợp.

**Kiểm tra/hoàn thành:** giới hạn quyền, reply trống, gửi lặp, review bị xóa khi đang mở, timeout toggle và đổi trang. Kiểm tra averageRating thực tế; source toggle chưa tính lại nên không tự trừ/cộng điểm ở FE. Bài tập: giải thích vì sao toggle không được retry mù.

**Commit cuối nhiệm vụ:** `feat(admin-reviews): moderate visibility and reply to reviews`

### E17 — Quản lý coupon và thời gian hiệu lực

**Kết quả:** `/admin/coupons` cho A/M tạo/sửa/bật tắt coupon; S xem danh sách và trạng thái hiệu lực.

**Kiến thức và mã hướng dẫn:** schema điều kiện theo DiscountType, Instant so với ngày địa phương, badge dẫn xuất. Sinh module `coupons/`, `CouponsPage`, `CouponForm`, bộ chuyển thời gian và badge.

**Các bước tự code:** GET `/api/admin/coupons` trả mảng; POST/PUT `[/{id}]` JSON CouponRequest; PUT `/{id}/toggle-status` trả text. FE áp dụng `0 < percentage ≤ 100`, giá trị giảm cố định dương, minOrderValue không âm, usageLimit nguyên ≥ 1, end ≥ start; ghi phần nào là quy tắc UI mạnh hơn DTO server. Form hiển thị giờ VN và chuyển sang Instant UTC có offset rõ ràng, không phụ thuộc timezone máy người nhập. Badge phân biệt tắt/chưa tới hạn/hết hạn/hết lượt/đang chạy; `active` đọc theo JSON xác nhận.

**Kiểm tra/hoàn thành:** code trùng 409, 100%/>100%, thời gian biên ngày VN, giới hạn lượt, S chỉ đọc, toggle timeout. Thử coupon tại checkout bằng quote/server hiện có; không sửa tổng đơn đã đặt. Bài tập: đổi một thời điểm GMT+7 sang payload UTC và giải thích ngày có thể khác.

**Commit cuối nhiệm vụ:** `feat(admin-coupons): manage discounts and validity periods`

### E18 — Người dùng, khóa/mở tài khoản và đổi role

**Kết quả:** `/admin/users` và `/admin/users/:id` tìm/xem người dùng; thao tác quản trị đúng quyền và đúng tài khoản đích.

**Kiến thức và mã hướng dẫn:** quyền theo actor và target, query param mutation, session cũ sau thay quyền. Sinh module `users/`, list/detail, `UserStatusAction`, `UserRoleDialog`; bổ sung permission hành động nếu còn thiếu.

**Các bước tự code:** GET `/api/admin/users?keyword=&page=&size=` và `/{id}`; PUT `/{id}/status?status=...`, PUT `/{id}/role?role=...` trả text. M chỉ khóa/mở CUSTOMER, A mới đổi role. UI khóa/mở chỉ gửi ACTIVE/INACTIVE theo nghiệp vụ đã xác nhận; PENDING hiển thị trạng thái chờ xác thực, không giả là nút phê duyệt tài khoản. Chặn tự khóa/tự đổi role, xác nhận trước thay quyền, refetch user đích. Không viết lại session hiện tại bằng response của user khác.

**Kiểm tra/hoàn thành:** A/M/S/CUSTOMER, M thao tác lên role khác, URL trực tiếp, user không tồn tại, phiên của tài khoản bị khóa/đổi role đang mở ở trình duyệt khác. Ghi rõ backend chưa thấy chặn tự sửa và cần kiểm tra quyền có hiệu lực với JWT cũ ra sao. Bài tập: phân biệt quyền “xem users” và quyền “thay status của user này”.

**Commit cuối nhiệm vụ:** `feat(admin-users): manage account status and roles`

### E19 — Dashboard và thống kê theo khoảng ngày

**Kết quả:** A/M mở `/admin/dashboard`, đổi khoảng ngày để xem tổng quan, biểu đồ doanh thu/đơn, phân bố trạng thái và cảnh báo tồn.

**Kiến thức và mã hướng dẫn:** date-only filter, dữ liệu tổng hợp, biểu đồ có đơn vị rõ, lazy-load theo route. Sinh module `dashboard/`, `DashboardPage`, `DateRangeFilter`, `StatCard`, chart và bảng low stock. Chọn thư viện chart tại thời điểm làm nếu cần, đối chiếu dependency/API trước khi sinh mã.

**Các bước tự code:** GET `/api/admin/dashboard?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd`; mặc định/preset 7 ngày/30 ngày/tháng này/tùy chọn. Validate start ≤ end, chênh lệch ngày ≤ 365 theo service; chốt timezone backend trước khi đối chiếu ngày. Hiện số server trả, kiểm tra định nghĩa doanh thu trong repository, phạm vi thời gian của từng chỉ số và ngưỡng tồn. Không tự coi mọi chỉ số đều cùng điều kiện lọc. Backend đã điền ngày trống, tránh nhân đôi dòng. Link low stock sang inventory theo SKU. Sau khi trang dùng được mới đổi landing A/M tới dashboard.

**Kiểm tra/hoàn thành:** rỗng, một ngày, đúng giới hạn 365/vượt giới hạn, preset qua tháng/năm, dữ liệu ít nhất vài đơn biết trước, S bị 403, loading lần đầu/refetch. Biểu đồ đọc được bằng chú giải/bảng hoặc thông tin chữ, không chỉ màu. Bài tập: giải thích vì sao số đơn và doanh thu cần đơn vị khác nhau.

**Commit cuối nhiệm vụ:** `feat(admin-dashboard): show operational metrics and date filters`

### E20 — Xem trước báo cáo doanh thu

**Kết quả:** `/admin/reports` chọn khoảng ngày rồi bấm xem trước, bảng và tổng lấy từ API cùng một khoảng ngày đã gửi.

**Kiến thức và mã hướng dẫn:** form draft so với submitted filters, query enabled, đối chiếu aggregate với dòng dữ liệu. Sinh `reports/{types,api,queries,schemas}.ts`, `reports/pages/ReportsPage.tsx`, `reports/components/RevenueReportTable.tsx`; dùng lại date filter khi phù hợp.

**Các bước tự code:** GET `/api/admin/reports/preview` với startDate/endDate bắt buộc. Validate start ≤ end, end không sau hôm nay theo timezone đã chốt, chênh lệch ngày ≤ 365; source dùng `DAYS.between`, cần kiểm thử biên inclusive thay vì tự đổi thành 365 dòng. Chỉ query theo khoảng đã submit, giữ nhãn khoảng báo cáo đang xem. Hiện grossRevenue, discountAmount, shippingFee, netRevenue và tổng từ response; đối chiếu công thức backend trước khi gắn ý nghĩa. Không tự tính lại từ trang đơn đã phân trang.

**Kiểm tra/hoàn thành:** khoảng rỗng, thiếu ngày, ngày tương lai, start > end, biên ngày VN/server, submit rồi sửa draft chưa bấm xem, đối chiếu số liệu với dữ liệu đơn dev. Bài tập: giải thích vì sao khoảng export sau này phải lấy từ submitted range.

**Commit cuối nhiệm vụ:** `feat(admin-reports): preview revenue reports by date range`

### E21 — Tải CSV có xác thực và đúng tên file

**Kết quả:** bấm xuất tại báo cáo đã xem sẽ tải CSV của đúng khoảng ngày, hiển thị lỗi rõ khi không có dữ liệu hoặc thiếu quyền.

**Kiến thức và mã hướng dẫn:** Blob, response headers, download object URL, lỗi JSON trong response blob. Tạo `src/shared/api/download.ts`; mở rộng reports API và `reports/components/ExportReportButton.tsx`.

**Các bước tự code:** GET `/api/admin/reports/export` qua Axios client với `responseType: 'blob'`, dùng khoảng đã submit. Đọc `Content-Disposition` gồm filename/filename*, fallback tên có khoảng ngày nếu thiếu/không đọc được; chuẩn hóa thành tên file, bỏ đường dẫn/ký tự điều khiển. Tạo URL Blob, click link tải rồi revoke. Khóa xuất khi pending/preview chưa hợp lệ, kiểm tra phiên trước khi trigger download. Nếu khác origin, xác nhận CORS expose header; không tự sửa backend trong mốc FE. Dùng `normalizeError` hiện có cho lỗi Blob và giữ fallback cho body không phải JSON.

**Kiểm tra/hoàn thành:** file đúng tên/ngày, tiếng Việt/dấu phân cách đọc được, preview và CSV khớp; 404 không có dữ liệu, 401/403, mất mạng, double-click, đổi tài khoản khi đang tải, header không có filename. Không tải file lỗi JSON thành `.csv`. Bài tập: giải thích thời điểm tạo và thu hồi object URL.

**Commit cuối nhiệm vụ:** `feat(admin-reports): download authenticated CSV exports`

### E22 — Hồi quy liên module và bàn giao Phase 5

**Kết quả:** có bằng chứng vận hành xuyên luồng và danh sách phần hoàn thành/còn thiếu để tiếp tục sau này.

**Kiến thức và mã hướng dẫn:** lập kịch bản theo vai trò, phân biệt lỗi contract/FE/backend, ghi bằng chứng kiểm thử. Hướng dẫn chạy các kiểm tra đã có, bổ sung kiểm tra logic cần thiết nếu phát hiện rủi ro chưa phủ; cập nhật `phase5.md`, phần Phase 5 trong master plan và README khi có hướng dẫn chạy admin cần ghi.

**Các bước tự thực hiện:**

1. Chạy `npm run lint`, `npm run typecheck`, `npm run build` và các script hồi quy liên quan sau các thay đổi cuối. Ghi cảnh báo build còn lại; sửa lỗi do Phase 5 gây ra trước khi chốt.
2. Luồng catalog/kho: tạo category/brand/product → xem public → điều chỉnh tồn → checkout → đối chiếu tồn/đơn; ngừng bán variant và kiểm tra giỏ/đơn cũ.
3. Luồng đơn: COD/VNPay dev/sandbox → admin xác nhận/giao hàng → customer xem đơn → review/return → admin xử lý; thử hủy chưa trả/đã trả và đối chiếu tồn, trạng thái thanh toán thực tế.
4. Luồng quản trị: mỗi role xem URL/menu/nút đúng quyền; request trực tiếp không được vượt quyền; khóa user/đổi role, logout/đổi phiên khi request chậm, nhiều tab cùng thao tác.
5. Luồng thống kê: chọn tập đơn dev biết trước → dashboard → preview → CSV; ghi điều kiện doanh thu/timezone và lý do khác nhau nếu có, không sửa số hiển thị để ép khớp.
6. Kiểm tra mobile, bàn phím/focus dialog, loading/error/empty, reload/deep link, admin chunk và ảnh preview/download không rò object URL. Ghi lại các ca C13/D13 đã thực sự thử, không tự chốt hai phase trước chỉ vì đã chạy admin.

**Tiêu chí chốt:** từng mốc có trạng thái và kiểm tra rõ; phần variant cũ E10, gap quyền server, nghiệp vụ return/refund và timezone được giải quyết hoặc ghi thành phạm vi còn thiếu được người dùng chấp nhận. Nếu vẫn thiếu, bàn giao “Phase 5 hoàn thành một phần”, không đánh dấu toàn bộ xong. Dữ liệu kiểm thử không chứa token/password hoặc URL thanh toán có chữ ký.

**Commit cuối nhiệm vụ:** `docs(admin): record phase 5 verification and handoff`

## 8. Backlog và điểm phối hợp backend

| Việc | Khi cần xử lý | Ảnh hưởng tới hoàn thành |
|---|---|---|
| Chặn CANCELLED qua status của S; giới hạn cancel đúng trạng thái | Trước nghiệm thu E4/E5 về quyền/nghiệp vụ | UI vẫn triển khai được, bảo vệ server còn phải xác nhận |
| Tách cập nhật variant metadata khỏi tồn kho, định danh variant ổn định | Khi làm phần sửa variant cũ E10 | Không chặn sửa thông tin chung; chưa chốt quản lý variant đầy đủ |
| Cưỡng chế validation tạo product và quy tắc coupon phía server | Khi tích hợp E9/E17 | Validation FE không thay thế server |
| Return: trạng thái đơn khi tạo, trả một phần/nhiều request, hoàn tiền, lịch sử kho | E15 và hồi quy D12/E22 | Chỉ ghi kết quả đã có; không hứa tự động hoàn tiền |
| Chặn tự khóa/tự đổi role trên server; xác định hiệu lực quyền với JWT cũ | E18 | Cần kiểm thử quyền trực tiếp ngoài UI |
| Thống nhất timezone/định nghĩa chỉ số và expose header download khi cần | E19–E21 | Cần xác minh số liệu/date range và tên file ở môi trường thật |
| GET detail return; đọc lịch sử return customer | Khi mở rộng sau E15 | Chưa xây route/detail giả |
| Lưu thứ tự ảnh, phục hồi variant, phân trang inventory/coupon, sinh SKU tự động | Sau luồng cơ bản | Mở rộng, không phải điều kiện bắt đầu Phase 5 |
| Điểm trung bình sau moderation review | E16 nếu cần điểm loại review ẩn | Phải thống nhất nghiệp vụ và backend, không tính bù ở FE |

## 9. Mẫu bàn giao sau mỗi nhiệm vụ

```text
Mốc / ngày:
Phạm vi đã làm và URL kiểm tra:
Kiến thức đã học / bài tập tự làm:
File đã sửa:
Contract API đã đối chiếu (source / response thật):
Kiểm tra tĩnh và kết quả:
Kiểm tra logic với API giả lập:
Kiểm thử backend/browser hoặc xác nhận người dùng:
Phần chưa làm / phụ thuộc backend / lỗi còn lại:
Trạng thái: chưa bắt đầu / đang làm / đã code chờ kiểm thử / hoàn thành phạm vi / vướng một phần
Commit gợi ý hoặc hash đã tạo:
Bước tiếp theo:
```

### Bàn giao lập kế hoạch — 13/11/2026

- Đã chia Phase 5 thành E1–E22, gắn kiến thức, file, API, bước tự code, tiêu chí kiểm tra và commit cuối từng nhiệm vụ.
- Đã ghi chế độ sinh mã hướng dẫn để người dùng tự học/tự code, mẫu yêu cầu bắt đầu nhiệm vụ và các khác biệt quan trọng so với master plan.
- Đã kiểm tra đủ 22 mốc liên tục, mỗi mốc có hướng dẫn/tiêu chí kiểm tra/commit ở cuối; liên kết nội bộ, code fence, UTF-8 và whitespace đạt. Master plan đã có liên kết tới kế hoạch chi tiết này.
- Chỉ lập tài liệu; chưa code Phase 5, chưa sửa backend, chưa chạy API/browser hoặc build/lint cho chức năng admin, chưa tạo commit/push.
- Khi bắt đầu giai đoạn này: đọc lại trạng thái Phase 4 và source hiện tại, rồi hướng dẫn **E1**. Không giao lại phần auth/guard/session đã có.
