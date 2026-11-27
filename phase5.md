# Phase 5 — Quản trị vận hành, dashboard và báo cáo

> Ngày lập: **13/11/2026**. Đối chiếu frontend tại HEAD `87eaa75`; working tree sạch trước khi lập kế hoạch.
> Nguồn: [frontend_master_plan.md](frontend_master_plan.md), [phase4.md](phase4.md), source frontend và source backend tham chiếu tại `../ecommerce-backend`.
> **Trạng thái — 27/11/2026: E1–E9, phần sửa thông tin chung E10 và E11–E21 đã có code, chờ review và kiểm thử nghiệp vụ tích hợp có đăng nhập; E22 chưa triển khai. E20/E21 đã có preview và tải CSV có xác thực, test mock đạt; chưa đối soát/tải file bằng browser có đăng nhập. E19 đã có dashboard, bộ lọc date-only, biểu đồ SVG/bảng số liệu và landing A/M; chưa đối soát dữ liệu có đăng nhập hoặc chốt timezone runtime JVM/MySQL.** E10 không gửi variants; sửa metadata biến thể cũ vẫn phụ thuộc backend. E12b đã bổ sung bán lại biến thể và cải thiện thẻ; backend đổi trạng thái sản phẩm không còn ghi đè trạng thái biến thể. E13 lọc SKU/tên phía client vì backend keyword hiện chỉ tìm tên. E14 có ADD/DEDUCT, GET lịch sử và xử lý kết quả chưa xác định. E15 có list/drawer bằng chứng và xử lý A/M; E16 có lọc/phân trang đánh giá, trả lời A/M/S và ẩn/hiện A/M; E17 có danh sách, tạo/sửa/toggle coupon, giờ VN/UTC và 13/13 test mock; chưa thử ghi có đăng nhập trên backend thật. Contract được đối chiếu source; E9 đã kiểm tra GET public 200/admin chưa đăng nhập 401 trên backend dev, chưa xác nhận POST tạo thật. Xem bàn giao cuối tài liệu.
> **Cách học bắt buộc: khi bắt đầu mỗi nhiệm vụ, sinh mã hướng dẫn theo từng bước và từng file để người dùng tự học, tự gõ code; cuối nhiệm vụ có nội dung commit.** Không tự triển khai source khi người dùng chỉ yêu cầu hướng dẫn.

## 1. Mục tiêu và điểm bắt đầu

Sau Phase 5, ADMIN/MANAGER/STAFF sử dụng các màn hình đúng quyền để vận hành cửa hàng: xử lý đơn, quản lý danh mục/thương hiệu/sản phẩm, điều chỉnh kho, xử lý trả hàng và đánh giá, quản lý coupon/người dùng, xem dashboard và xuất CSV.

- Giữ một frontend với `StorefrontLayout` và `AdminLayout`; dùng lại auth, Axios client, TanStack Query, React Hook Form, Zod, Zustand session và design tokens.
- `AdminLayout`, `AdminHomePage`, `RequireRole`, `PERMISSIONS`, `hasPermission`, `useCan` đã tồn tại. Hiện `/admin` mới có trang khung; chưa có màn hình nghiệp vụ quản trị.
- Không suy ra Phase 4 đã hoàn thành: tài liệu hiện ghi D5–D7 đã có code, D7 còn chờ thử tích hợp, D8–D13 chưa làm. C13 của Phase 3 cũng còn hồi quy tổng thể.
- Lộ trình mặc định: tiếp tục Phase 4 theo bàn giao của nó; khi chuyển sang Phase 5 bắt đầu **E1**. Có thể làm E1–E5 sớm để tạo đơn DELIVERED phục vụ D9/D12 nếu người dùng chọn; ghi rõ phần kiểm thử còn thiếu của từng phase.
- Không tách một mốc E0 chỉ để khảo sát. Đọc contract, chuẩn bị tài khoản/dữ liệu và kiểm tra Network ngay tại nhiệm vụ sử dụng, theo cách làm đã chốt ở Phase 4.

Ngoài phạm vi: triển khai production, tự động hoàn tiền VNPay, tạo API backend còn thiếu, chính sách B11, phần B12 còn hoãn, guest order tracking, gửi email xác nhận đơn, cài lại toàn bộ hệ thống test/CI đã hoãn. Chỉ ghi yêu cầu phối hợp backend khi gặp giới hạn; không tự sửa repository backend trong lúc hướng dẫn frontend.

Ngoại lệ được yêu cầu triển khai trực tiếp ngày 24/11/2026: E12b bổ sung API bán lại biến thể và tách trạng thái sản phẩm/biến thể trong backend, cùng giao diện tương ứng. Ngoại lệ này không mở rộng sang các API backend còn thiếu của mốc khác.

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

**Quy ước giao diện cập nhật theo yêu cầu người dùng:** mục **Trang quản trị** đứng đầu sidebar. Các màn hình admin không có nút tải lại thủ công, kể cả nút Thử lại chỉ gọi GET; lỗi tải dữ liệu hướng dẫn nhấn F5. Vẫn giữ GET tự động sau mutation và khi query cần cập nhật. F5 xóa draft/file chọn/state cục bộ; với request timeout cần xác minh kết quả máy chủ trước thao tác ghi mới. Quy ước này thay thế các mô tả nút tải lại trong bàn giao cũ của E3/E6–E15.

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
| Ngừng bán/bán lại variant — E12b 24/11/2026 | DELETE `/products/{id}/variants/{variantId}` đặt INACTIVE; PATCH cùng đường dẫn thêm `/status?status=ACTIVE` bán lại, chỉ A/M | Giữ ID/giá/tồn; cập nhật product.updatedAt khi trạng thái thực sự đổi. Status sản phẩm độc lập, không bật lại mọi variant khi sản phẩm ACTIVE |
| Trạng thái đơn | Đọc lại 20/11/2026: `/status` vẫn nhận CANCELLED và cho S gọi. `/cancel` riêng chỉ A/M; service hiện đã chặn SHIPPED, DELIVERED, CANCELLED và RETURN_*, chỉ còn PENDING/PROCESSING trong enum hiện tại | E4 chỉ expose luồng xử lý/giao hàng; E5 hủy riêng từ PENDING/PROCESSING. Còn gap quyền S qua `/status`; cần kiểm thử server và hai request đồng thời/hoàn tồn lặp, không kết luận ẩn nút đã sửa lỗ hổng |
| Trả hàng | Đọc lại 20/11/2026: tạo request đã đặt RETURN_REQUESTED; create/process dùng trạng thái hiệu lực theo yêu cầu trả hàng, ưu tiên PENDING → APPROVED → REJECTED. Dữ liệu cũ có thể còn orderStatus khác trạng thái hiệu lực | Đồng bộ response và lọc orders admin theo trạng thái hiệu lực. E15 vẫn xử lý qua return API, không qua dropdown status đơn; không suy ra hoàn tiền từ APPROVED |
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
| E1 | Admin shell, menu và guard theo quyền | Auth đang có | Đã code, chờ review và kiểm thử |
| E2 | Danh sách đơn và DataTable server | E1 | Đã code, kiểm tra tự động đạt; chờ browser/backend |
| E3 | Chi tiết đơn admin | E2 | Đã code, kiểm tra tự động đạt; chờ browser/backend |
| E4 | Chuyển trạng thái xử lý/giao hàng | E3 | Đã code, kiểm tra tự động đạt; chờ browser/backend |
| E5 | Hủy đơn có lý do | E3 | Đã code, kiểm tra tự động đạt; chờ browser/backend |
| E6 | Danh mục và upload ảnh | E1 | Đã code, kiểm tra tự động đạt; chờ review và kiểm thử browser/backend |
| E7 | Thương hiệu và logo | E6 để dùng lại upload/form | Đã code, kiểm tra tự động đạt; chờ review và kiểm thử browser/backend |
| E8 | Danh sách sản phẩm admin | E2, E6–E7 | Đã code, kiểm tra tự động đạt; chờ review và kiểm thử browser/backend |
| E9 | Tạo sản phẩm, thông số, biến thể | E8 | Đã code, kiểm tra tự động đạt; chờ review và kiểm thử browser/backend có đăng nhập |
| E10 | Sửa thông tin sản phẩm an toàn với tồn kho | E9; contract riêng cho sửa variant cũ | Đã code thông tin chung, kiểm tra tự động đạt; chờ browser/backend; variant cũ còn phụ thuộc backend |
| E11 | Quản lý ảnh sản phẩm | E10 | Đã code; kiểm tra tự động đạt, chờ browser/backend có đăng nhập |
| E12 | Trạng thái sản phẩm, ngừng bán variant | E10 | Đã code, kiểm tra tự động đạt; chờ review và tích hợp có đăng nhập |
| E12b | Bán lại biến thể, tách trạng thái sản phẩm/biến thể và cải thiện thẻ | E12 | Đã code frontend/backend, kiểm tra tự động và preview responsive; chờ tích hợp có đăng nhập |
| E13 | Danh sách tồn kho và bộ lọc | E8 | Đã code; chờ review và tích hợp đăng nhập |
| E14 | Điều chỉnh kho và lịch sử | E13 | Đã code; chờ review và tích hợp đăng nhập |
| E15 | Xem và xử lý yêu cầu trả hàng | E3–E4, E14; D12 hoặc dữ liệu return dev | Đã code; 10/10 kiểm tra mock đạt, chờ review và tích hợp có đăng nhập |
| E16 | Kiểm duyệt và trả lời đánh giá | E2; D9 hoặc dữ liệu review dev | Đã code; 14/14 kiểm tra mock đạt, chờ review và tích hợp có đăng nhập |
| E17 | Coupon và khoảng hiệu lực | E1; checkout hiện có để hồi quy | Đã code; 13/13 test mock E17 và 24/24 checkout đạt; chờ browser/backend có đăng nhập và checkout tích hợp |
| E18 | Danh sách/chi tiết và quản lý người dùng | E1 | Đã code; 12/12 test mock đạt; chờ browser/backend có đăng nhập, kiểm tra JWT cũ và review |
| E19 | Dashboard và bộ lọc thời gian | E4, E14; dữ liệu thống kê dev | Đã code; 10/10 test mock/render; chờ đối soát có đăng nhập và timezone runtime |
| E20 | Xem trước báo cáo doanh thu | E19 để dùng lại bộ lọc ngày | Đã code; test mock đạt; chờ tích hợp có đăng nhập |
| E21 | Tải CSV có xác thực | E20 | Đã code; test mock đạt; chờ tải file/CORS runtime |
| E22 | Hồi quy và bàn giao Phase 5 | E1–E21 trong phạm vi đã chốt | Chưa bắt đầu |

Thứ tự mặc định E1 → E22. Có thể chuyển sang module độc lập khi một phần bị vướng backend, nhưng phải ghi mốc còn thiếu; không đánh dấu cả phase hoàn thành. Không cần hoàn thành dashboard để bắt đầu xử lý đơn.

## 7. Chi tiết từng nhiệm vụ

### E1 — Admin shell, điều hướng và phân quyền

**Trạng thái — 19/11/2026:** đã triển khai theo yêu cầu trực tiếp của người dùng để review. Xem bàn giao cuối tài liệu; chưa nghiệm thu browser/backend.

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

**Code và hướng dẫn — 19/11/2026:** đã bổ sung theo yêu cầu triển khai trực tiếp. Đọc code theo thứ tự types → filters → API → query → page → components → router/menu/redirect. Bảng khai báo cột bằng React thuần, chưa thêm TanStack Table/dependency mới. Kết quả kiểm tra và giới hạn ở bàn giao E2 cuối tài liệu.

**Kết quả:** `/admin/orders` lấy đơn thật, tìm kiếm/lọc/phân trang/sort được giữ trong URL.

**Kiến thức và mã hướng dẫn:** DTO admin, query key, URL state, debounce, phân trang server và bảng khai báo cột. Sinh `orders/{types,api,queries,filters}.ts`, `orders/pages/AdminOrdersPage.tsx`, `components/{DataTable,FilterBar}.tsx`. Theo định hướng master, đưa TanStack Table vào tại đây nếu vẫn chọn dùng; kiểm tra package/API trước khi hướng dẫn cài, không giả định đã có trong `package.json`.

**Các bước tự code:** GET `/api/admin/orders` với `keyword, orderStatus, paymentStatus, page, size, sortBy, direction`; normalize page; hiển thị mã, khách, tổng, ngày và trạng thái. Whitelist `createdAt/totalPrice`, phân biệt `orderDate` ở response với field sort. Đổi filter về trang đầu, debounce keyword, truyền AbortSignal. Bảng nhận page/count từ server, không sort riêng một trang rồi mô tả là toàn bộ dữ liệu. Đăng ký route/menu và đích đăng nhập S khi trang hoạt động.

**Kiểm tra/hoàn thành:** danh sách rỗng, nhiều trang, query URL sai, trang vượt phạm vi, sort số tiền, Back/reload, request tìm kiếm đến sai thứ tự và chuyển tài khoản. Bài tập: vẽ đường đi URL page 2 tới API page 1.

**Commit cuối nhiệm vụ:** `feat(admin-orders): add searchable paginated order list`

### E3 — Chi tiết đơn quản trị

**Code và hướng dẫn — 19/11/2026:** đã triển khai theo yêu cầu trực tiếp. Flow, từng file và cú pháp đã được giải thích trong chat; file hướng dẫn riêng đã xóa. Bộ test admin orders đã được khôi phục theo yêu cầu mới, chạy đạt 13/13; toàn bộ 7 bộ kiểm tra đạt 87/87. Kết quả và giới hạn xem bàn giao E3 cuối tài liệu.

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

**Code và hướng dẫn — 20/11/2026:** đã triển khai theo yêu cầu trực tiếp. Đọc theo thứ tự `types.ts` → `schemas.ts` → `orderActions.ts` → `api.ts` → `queries.ts` → `components/AdminCancelOrderDialog.tsx` → `pages/AdminOrderDetailPage.tsx`. Flow, trách nhiệm từng file và cú pháp được giải thích trong chat; kết quả kiểm tra và phần tích hợp còn thiếu ở bàn giao E5 cuối tài liệu.

**Kết quả:** A/M hủy đơn PENDING/PROCESSING qua dialog; S không có hành động này.

**Kiến thức và mã hướng dẫn:** tái sử dụng dialog nhưng tách nghiệp vụ customer/admin, lỗi form và phản hồi không chắc chắn. Tạo `orders/components/AdminCancelOrderDialog.tsx`, request/schema/mutation trong module orders.

**Các bước tự code:** PUT `/api/admin/orders/{id}/cancel` với `{ reason }`; trim và yêu cầu lý do theo DTO hiện hành. Kiểm tra quyền và trạng thái trước gửi, khóa dialog submit khi pending; sau thành công cập nhật đơn và invalidate kho/catalog liên quan. Nếu server trả PENDING_REFUND thì hiển thị “Chờ hoàn tiền”; không mô tả tiền đã về. Timeout phải GET lại trước khi đề xuất gửi hủy lần nữa.

**Kiểm tra/hoàn thành:** đơn chưa trả tiền/đã trả tiền, thiếu lý do, S bị 403 khi gọi trực tiếp, đơn đã giao/đã hủy và hai tab cùng thao tác. Đối chiếu số lượng kho sau hủy để phát hiện hoàn tồn lặp. Đọc lại 20/11/2026 cho thấy `/cancel` đã chặn trạng thái ngoài PENDING/PROCESSING trong enum hiện tại; còn cần phối hợp gap quyền `/status` và xác nhận chống hoàn tồn lặp khi có request đồng thời. Bài tập: giải thích vì sao không dùng `/status` để hủy.

**Commit cuối nhiệm vụ:** `feat(admin-orders): cancel eligible orders with a reason`

### E6 — Quản lý danh mục và ảnh danh mục

**Code và hướng dẫn — 20/11/2026:** đã triển khai theo yêu cầu trực tiếp. Đọc `categories/types.ts` → `schemas.ts` → `api.ts` → `queries.ts` → `filters.ts` → `shared/components/ImageDropzone.tsx` → `categories/components/{CategoryFormDialog,DeleteCategoryDialog}.tsx` → `categories/pages/AdminCategoriesPage.tsx` → router/menu/redirect. Flow, từng file và cú pháp được giải thích trong chat. Kết quả kiểm tra, giới hạn và nội dung commit ở bàn giao E6 cuối tài liệu.

**Kết quả:** `/admin/categories` cho A/M xem, tạo, sửa và xóa danh mục hợp lệ.

**Kiến thức và mã hướng dẫn:** list dạng mảng, dialog form, FormData, File so với URL ảnh, object URL cleanup. Sinh `categories/{types,api,queries,schemas}.ts`, page/form; tạo hoặc dùng lại `ImageDropzone` tại mốc này.

**Các bước tự code:** GET public `/api/categories` với keyword nếu cần; kiểm tra có hiển thị INACTIVE. POST/PUT `/api/admin/categories[/{id}]` bằng multipart `name`, `status`, `image?`, nhận CategoryResponse có `imageUrl`. DELETE nhận 204. Cho nhập status rõ ràng; không chọn ảnh mới thì giữ ảnh server, không hứa xóa ảnh riêng khi chưa có API. Dùng validation ảnh theo mục 4 và làm mới dữ liệu public sau lưu.

**Kiểm tra/hoàn thành:** trùng tên, file sai loại/quá dung lượng, giữ/thay ảnh cũ, list inactive, xóa danh mục trống và bị chặn khi còn sản phẩm. `totalProducts` giúp UI nhưng server quyết định xóa; không đọc body JSON của 204. Bài tập: xem Network và giải thích vì sao key file là `image`.

**Commit cuối nhiệm vụ:** `feat(admin-categories): manage categories with image uploads`

### E7 — Quản lý thương hiệu và logo

**Code và hướng dẫn — 20/11/2026:** đã triển khai trực tiếp theo yêu cầu người dùng. Thứ tự đọc: `brands/types.ts` → `schemas.ts` → `api.ts` → `queries.ts` → `filters.ts` → `shared/components/ImageDropzone.tsx` → `brands/components/{BrandFormDialog,DeleteBrandDialog}.tsx` → `brands/pages/AdminBrandsPage.tsx` → router/menu/redirect. Luồng dữ liệu, vai trò từng file và cú pháp chính được giải thích trong chat. Kết quả kiểm tra, giới hạn và nội dung commit ở bàn giao E7 cuối tài liệu.

**Kết quả:** `/admin/brands` cho A/M CRUD thương hiệu và xem logo đúng sau reload.

**Kiến thức và mã hướng dẫn:** tái sử dụng upload/form có giới hạn, schema create/update khác nhau, lỗi field từ server. Sinh module `brands/` theo cấu trúc E6, giữ type/contract riêng.

**Các bước tự code:** GET `/api/brands`; POST/PUT `/api/admin/brands[/{id}]` multipart `name`, `status`, `logo`. Tạo bắt buộc file; sửa bỏ file để giữ logo. DELETE trả 204. Không đổi tên field `logo` thành `image` vì dùng cùng component chọn file. Invalidate brand public và catalog liên quan sau mutation.

**Kiểm tra/hoàn thành:** tạo thiếu logo, file lỗi, tên trùng, sửa không thay logo, INACTIVE và xóa khi còn sản phẩm. Bài tập: phân biệt phần có thể tái sử dụng giữa category/brand với phần phải giữ riêng.

**Commit cuối nhiệm vụ:** `feat(admin-brands): manage brands and logo uploads`

### E8 — Danh sách sản phẩm quản trị

**Trạng thái — 21/11/2026:** đã triển khai theo yêu cầu trực tiếp; xem hướng dẫn đọc code bên dưới và bàn giao cuối tài liệu. Chưa nghiệm thu browser/backend.

**Kết quả:** `/admin/products` lọc được sản phẩm theo tên, status, category, brand và phân trang server.

**Kiến thức và mã hướng dẫn:** dùng lại DataTable, filter phụ thuộc dữ liệu tham chiếu, tách admin/public DTO. Sinh `products/{types,api,queries,filters}.ts`, `products/pages/AdminProductsPage.tsx`.

**Các bước tự code:** GET `/api/admin/products`; map `keyword, status, categoryId, brandId, page, size, sortBy, direction`. Đối chiếu field sort entity trước khi whitelist; không đưa `totalStock/variantCount` là trường tổng hợp vào sort server nếu chưa hỗ trợ. Hiển thị ảnh, giá, trạng thái, tổng tồn, số variant. Chỉ bật link tạo/sửa khi E9/E10 đã có route; không lấy public list ACTIVE thay cho danh sách admin.

**Kiểm tra/hoàn thành:** ACTIVE/INACTIVE/HIDDEN, category/brand null hoặc không còn lựa chọn, nhiều filter, reset trang, ID không mất chính xác và role S xem được. Bài tập: giải thích vì sao phải có DTO và query key admin riêng.

**Commit cuối nhiệm vụ:** `feat(admin-products): list products with server-side filters`

**Hướng dẫn đọc code E8 đã triển khai:**

1. Mở `src/features/admin/products/types.ts` trước. `AdminProductListResponse` là DTO (hình dạng dữ liệu backend trả), khác DTO catalog vì có `categoryId`, `brandId`, `totalStock`, `variantCount`, timestamp và đủ ba trạng thái. `interface` mô tả object để TypeScript kiểm tra khi lập trình, không tự kiểm tra JSON lúc chạy. `import type` chỉ nhập kiểu, không cần giá trị JavaScript lúc chạy. `ID` là alias của `string`; `Money` là alias của `number`. `string | null` là field có thể nhận null; `status?: ProductStatus` là field có thể vắng mặt. `"createdAt" | "name" | "basePrice"` là union chỉ cho phép ba chuỗi sort. `GetAdminProductsParams = AdminProductsFilters` là alias cùng cấu trúc, nhưng khác quy ước page; chỉ đổi page tại `toAdminProductsParams`. Tự kiểm tra: tại sao ID `9223372036854775807` không được chuyển thành Number?

2. Đọc `products/filters.ts`: `parseAdminProductsFilters(URLSearchParams)` đọc và chuẩn hóa URL, `serializeAdminProductsFilters` tạo URL, `toAdminProductsParams` tạo request. URL dùng page từ 1, API dùng page từ 0. Whitelist chỉ nhận size 10/20/50 và sort trên field entity thật. `as const` giữ giá trị literal và tuple chỉ đọc; `readonly T[]` ngăn sửa mảng qua kiểu này. `Record<ProductStatus, string>` bắt buộc khai báo nhãn cho đủ trạng thái. `.find((value) => condition)` trả phần tử đầu tiên thỏa điều kiện hoặc undefined. `??` chỉ dùng giá trị bên phải nếu bên trái null/undefined. `isPositiveLongId` kiểm tra chuỗi số dương trong giới hạn Java Long bằng độ dài/so sánh chuỗi, giữ nguyên độ chính xác. Regex `/^[1-9]\d*$/` yêu cầu số nguyên dương không có số 0 ở đầu. `Number` chỉ dùng cho page, không dùng cho ID. `{ ...filters, page: filters.page - 1 }` sao chép object và ghi đè field page trên bản sao. Kiểm tra nhanh: mở URL có `sortBy=totalStock&categoryId=abc&page=-1`; chúng phải được chuẩn hóa về giá trị hợp lệ. Bài tập: URL page=3 thì request page bằng bao nhiêu?

3. Đọc `products/api.ts`: `getAdminProducts` gọi đúng `GET /api/admin/products`. `async` trả Promise; `await` chờ kết quả. `const { data } = ...` là destructuring lấy response body của Axios. Generic `api.get<BackendPage<AdminProductListResponse>>` mô tả kiểu body, không phải ép backend trả đúng schema. `signal` truyền yêu cầu hủy GET; `meta.authToken` giữ token của phiên bắt đầu request; `noPublicRetry` ngăn client phát lại request theo luồng khách. `normalizePage` trong `src/shared/api/pagination.ts` đổi `{ content, page: {...} }` thành `{ items, page, size, totalItems, totalPages }` cho UI. Kiểm tra Network khi backend chạy: URL phải bắt đầu `/api/admin/products`, request không phải `/api/products`. Bài tập: vì sao không dùng public API chỉ có sản phẩm ACTIVE?

4. Đọc `products/queries.ts`: `useProductSession` lấy userId/role/token từ Zustand bằng selector. `isCurrentProductSession` kiểm tra phiên chưa hết hạn, user/role/token vẫn khớp và có quyền `product.write` (quyền sẵn có cho A/M/S). Cú pháp trả về `session is ProductSession` là type predicate: nhánh true giúp TypeScript biết session không còn null. `readForSession<T>` là hàm generic dùng chung để đọc nhiều kiểu dữ liệu; tham số `read` là một hàm nhận signal/token và trả `Promise<T>`. Nó kiểm tra phiên trước request và sau await, kiểm tra abort trước/sau request; dữ liệu cũ không được trả cho Query để ghi cache khi người dùng đã đổi phiên. Đây là bảo vệ frontend; backend vẫn quyết định quyền thật. Bài tập: nếu logout xảy ra trong lúc GET đang chờ thì đoạn kiểm tra nào ngăn response cũ đi vào cache?

5. Tiếp tục `products/queries.ts`: `useAdminProducts` gọi `useQuery`, có `queryKey = ["admin", userId, role, "products", "list", params]`. `...qk.admin` trải phần tử của mảng `["admin"]` vào key. `session?.userId` dùng optional chaining, trả undefined nếu session null. `enabled` ngăn tự tải khi URL đang chuẩn hóa/debounce hoặc phiên không hợp lệ; `retry: false` tắt retry tự động khi lỗi. `queryFn: ({ signal }) => ...` nhận signal của TanStack Query rồi trả Promise API. Khi params/key đổi, Query chọn cache/truy vấn tương ứng; không giữ trang cũ bằng placeholderData. Hai hook `useAdminProductCategories/Brands` dùng lại hàm API E6/E7 nhưng dùng quyền đọc sản phẩm, để STAFF có bộ lọc mà không được quản lý danh mục/thương hiệu. Chúng nằm dưới key `products/filters/...`, nên invalidation products sau E6/E7 cũng làm mới lựa chọn. GET brands không truyền categoryId vì nhánh đó chỉ trả ACTIVE. Kiểm tra nhanh: STAFF có cả hai bộ lọc; brand INACTIVE vẫn có trong lựa chọn. Bài tập: vì sao không gọi thẳng hook `useAdminBrands` của E7?

6. Đọc `products/pages/AdminProductsPage.tsx` từ phần `columns`. `DataTableColumn<AdminProductListResponse, AdminProductSortBy>` dùng generic xác định kiểu dòng và sort hợp lệ. `cell: (product) => (...)` là hàm render một ô từ dữ liệu dòng. JSX `{expression}` chèn biểu thức JavaScript; `.map()` tạo nhiều phần tử; `key` giúp React nhận diện dòng/option. Chỉ tên, giá cơ bản và ngày tạo có `sortBy`; tổng tồn/số biến thể chỉ hiển thị giá trị server đã tính, bao gồm cả variant INACTIVE theo mapper backend hiện tại. `StatusBadge`, `formatVND`, `formatDateTime` được tái sử dụng. `categoryName ?? ...` và `brandName ?? ...` xử lý quan hệ null. `ProductThumbnail` dùng `useState(false)` để chuyển sang icon khi ảnh lỗi; `key` theo URL ảnh giúp reset state khi ảnh đổi. Kiểm tra nhanh: ảnh null không gây ảnh vỡ, null brand/category có nhãn thay thế, chỉ ba cột có nút sort. Bài tập: vì sao không tự cộng tồn chỉ từ các variant đang bán?

7. Tiếp tục đọc thân `AdminProductsPage`: `useSearchParams()` trả tuple `[searchParams, setSearchParams]`. URL là nơi giữ filter, không có một bản filter state thứ hai. `useDebounce(filters.keyword, 350)` đợi ngừng gõ 350 ms; trong lúc đợi query bị disable và UI báo đang chờ. `useEffect` đầu chuẩn hóa URL bằng `replace`, không thêm một bước Back không cần thiết; effect thứ hai đưa page vượt phạm vi về trang cuối sau GET thành công. Mảng cuối `useEffect` là dependency array: effect chạy lại khi dependency thay đổi. `Partial<Omit<AdminProductsFilters, "page">>` cho phép truyền một phần filter nhưng không truyền page vào `changeFilters`; hàm này luôn reset page=1. `setSearchParams((current) => ...)` đọc URL mới nhất khi cập nhật. `changePage` chỉ đổi page; `changeSort` đổi cột/chiều và về trang đầu. Input/select dùng `value` và `onChange` nên là controlled component. `event.target.value` là chuỗi; ID giữ nguyên chuỗi, size được chọn từ whitelist. `value={filters.brandId ?? ""}` dùng chuỗi rỗng cho lựa chọn Tất cả. Nếu ID hợp lệ chưa có trong kết quả tham chiếu, trang thêm option tạm có chính ID đó và vẫn lọc theo URL; không tự xóa bộ lọc khi GET tham chiếu lỗi/chưa xong. `condition && <Element />` render có điều kiện; `condition ? A : B` chọn một trong hai nhánh. Kiểm tra nhanh: đang page 3 rồi đổi tên/status/size phải về page 1; lỗi GET tham chiếu không làm mất filter. Bài tập: tại sao refetch lỗi vẫn có thể còn `query.data`?

8. Đọc các file nối vào ứng dụng: `src/app/router.tsx` thêm child `path: "products"` dưới `/admin`; `lazy: async () => import(...)` chỉ tải module khi cần route, `{ Component: AdminProductsPage }` trả component cho router. Guard ở `src/app/routes/AdminRoute.tsx` đã chặn guest/CUSTOMER. `src/features/admin/navigation.ts` thêm cấu hình menu có `permission: "product.write"`; sidebar hiện có lọc theo role. `src/shared/auth/redirect.ts` thêm whitelist `/admin/products` đúng quyền và giữ cả query/hash sau login. Đây là ba trách nhiệm khác nhau: đăng ký route, hiển thị menu, khôi phục đích đăng nhập. E9/E10 chưa có route nên E8 không render link tạo/sửa. `phase5.md` ghi tiến độ/contract/cách học. Ngoài E8, chỉ thêm comment cho `catch` rỗng sẵn có trong `categories/components/DeleteCategoryDialog.tsx` để lint đạt; `catch` giữ lỗi trong mutation cho dialog hiển thị, `finally` luôn mở khóa submitting. Bài tập: ẩn menu có đủ ngăn người dùng tự gõ URL hoặc tự gọi API không?

**Ví dụ theo dõi một thao tác:** URL `/admin/products?keyword=laptop&status=HIDDEN&categoryId=10&page=2&size=10&sortBy=basePrice&direction=asc` → parser tạo filters → `toAdminProductsParams` giữ ID `"10"`, đổi page thành 1 → `useAdminProducts` tạo cache key theo phiên và params → API GET admin → backend controller/service lọc, sort, phân trang → mapper tạo DTO, tính tồn/số variant → Axios nhận Spring Page → `normalizePage` → kiểm tra phiên/abort → Query cache → DataTable/Pagination. Đổi status sẽ giữ các filter còn lại nhưng đưa page về 1. E8 chỉ GET nên không có form schema hoặc mutation.

### E9 — Tạo sản phẩm, thông số và biến thể

**Kết quả:** `/admin/products/new` tạo một sản phẩm có thông tin chung, thông số, ít nhất một biến thể theo quy tắc UI và ảnh tùy chọn.

**Kiến thức và mã hướng dẫn:** React Hook Form, `useFieldArray`, object key/value, schema nested, chuyển form value thành DTO. Sinh `products/schemas.ts`, `products/components/{ProductForm,SpecificationEditor,VariantFields}.tsx`, page tạo, hàm build request và mutation. Chia hướng dẫn thành thông tin chung → thông số → variants → upload/submit, cho chạy được sau mỗi bước.

**Các bước tự code:** POST multipart `/api/admin/products`, `data` chứa JSON AdminProductRequest, nhiều `images` nếu có. Validate tên/category, tiền không âm, stock nguyên không âm, SKU không rỗng/trùng trong form, khóa key/value trùng gây mất dữ liệu. Giữ ID dạng string. Bản đầu tự thêm từng variant; sinh tổ hợp thuộc tính/SKU tự động để mở rộng sau khi luồng thủ công ổn định. Response hiện chỉ có text, nên sau thành công về danh sách và refetch; không bịa ID để navigate detail.

**Kiểm tra/hoàn thành:** nhiều variant, ảnh lỗi, SKU trùng, category đã bị xóa, submit lặp, tạo thành công rồi refetch lỗi. Timeout không POST lại tự động; kiểm tra danh sách trước. Ghi thiếu validation create phía backend, không tuyên bố Zod đã xử lý toàn bộ nghiệp vụ. Bài tập: viết một payload mẫu từ form và giải thích string ID/number stock.

**Hướng dẫn đọc code E9 — triển khai trực tiếp theo yêu cầu ngày 21/11/2026:**

Mở `/admin/products`, bấm **Tạo sản phẩm**, hoặc vào `/admin/products/new` bằng ADMIN/MANAGER/STAFF. Nhập thông tin chung → thêm thông số → nhập SKU/giá/tồn ban đầu cho từng biến thể → thêm thuộc tính → chọn ảnh nếu cần → tạo. Thành công quay về danh sách ở trang đầu, mặc định mới nhất trước. E9 chưa mở chức năng sửa E10.

Đường dẫn dưới đây tính từ root frontend. Đọc theo thứ tự này để đi từ giao diện đến request và quay lại giao diện:

```text
router.tsx → AdminCreateProductPage.tsx → ProductForm.tsx
  ├─ ProductField.tsx                        đăng ký input/select/textarea
  ├─ SpecificationEditor.tsx                 mảng key/value sản phẩm
  ├─ VariantFields.tsx                       mảng biến thể
  │    └─ SpecificationEditor.tsx            mảng key/value thuộc tính
  └─ ProductImagesField.tsx                  File[] và preview

handleSubmit → zodResolver(createProductSchema) → submit(values)
  → useCreateAdminProduct.mutateAsync({ values, session })
  → createAdminProduct → buildCreateProductFormData
  → buildCreateProductRequest → FormData(data JSON + images lặp key)
  → Axios client → POST /api/admin/products
  → AdminProductController → ProductServiceImpl → repository/storage
  → HTTP 200 text → invalidate cache → toast → navigate danh sách
  → useAdminProducts GET lại → bảng danh sách mới
```

1. **Điểm vào — `src/app/router.tsx`, `src/shared/auth/redirect.ts`, `products/pages/AdminProductsPage.tsx`.** Router thêm child `path: "products/new"` dưới `/admin`. `lazy: async () => { const { AdminCreateProductPage } = await import(...); return { Component: AdminCreateProductPage }; }` là hàm bất đồng bộ: `import()` chỉ tải module khi router cần, destructuring lấy component được export, object trả về đăng ký component với router. `AdminRoute` hiện có kiểm tra role A/M/S. Trang list thêm `<Link to="/admin/products/new">`: Link điều hướng phía React Router. Whitelist redirect cho phép giữ URL tạo sau đăng nhập, kể cả query/hash; CUSTOMER không được nhận đích này. Không cần thêm menu con vì menu Sản phẩm E8 đã có. Kiểm tra nhanh: vào URL trực tiếp, reload và thử truy cập khi chưa đăng nhập. Bài tập: vì sao Link, router và guard là ba trách nhiệm riêng?

2. **Page — `src/features/admin/products/pages/AdminCreateProductPage.tsx`.** Component page lấy session bằng `useProductSession`, kiểm tra `isCurrentProductSession` và ghép tiêu đề với `<ProductForm session={session} />`. `session={session}` truyền object qua props. ``key={`${session.userId}:${session.role}`}`` yêu cầu React tạo form mới khi user/role đổi, tránh giữ dữ liệu form của tài khoản trước; token không được đưa vào query key. Page không gọi POST trực tiếp. Kiểm tra nhanh: thấy tiêu đề Tạo sản phẩm và các nhóm nhập. Bài tập: điều gì khác nhau giữa `ProductForm` là tên hàm và `<ProductForm />` là JSX?

3. **Điều phối form — `products/components/ProductForm.tsx`.** `useForm<ProductFormValues>({ resolver: zodResolver(createProductSchema), defaultValues: newProductFormValues() })` tạo form: generic `<ProductFormValues>` giúp TypeScript kiểm tra tên field; `resolver` nối Zod với React Hook Form; `defaultValues` là dữ liệu khởi tạo, không reset khi GET lựa chọn refetch. `FormProvider {...form}` cung cấp các phương thức form cho component con, không cần truyền `register/control` qua mọi tầng. Spread `...form` truyền từng thuộc tính của object thành prop. `useWatch({ control, name: "categoryId" })` đăng ký theo dõi giá trị lựa chọn để giữ option tạm nếu danh mục bị xóa hoặc GET lỗi. Nó không gọi API.

   `handleSubmit(submit)` tạo event handler: validate trước, chỉ gọi `submit(values)` nếu hợp lệ. `noValidate` tắt popup validation của trình duyệt để dùng thông báo Zod thống nhất; thuộc tính `required` vẫn mô tả ý nghĩa field. `void handleSubmit(submit)(event)` chủ động bỏ giá trị Promise trả về ở event handler; lỗi mutation được xử lý trong `try/catch` của submit. `useRef(false)` giữ khóa gửi giữa các lần render; đổi `.current` không tự render như state. `try` chờ `await mutation.mutateAsync`, `catch` gắn lỗi server và giữ dữ liệu, `finally` mở khóa ref. `setError("root.server", ...)` là lỗi toàn form; một số lỗi backend theo field được đưa về `name/categoryId/brandId/basePrice/description`.

   `busy` ghép trạng thái React Hook Form và mutation; `<fieldset disabled={locked}>` khóa nhóm input. Timeout/mất mạng/408/5xx được xem là kết quả chưa rõ, khóa POST tiếp và chỉ đường tới danh sách. 403 yêu cầu cập nhật phiên. 404 như category bị xóa vẫn giữ form để sửa lựa chọn. `mounted` ref được `useEffect` đặt true khi mount và false trong cleanup: nếu đã rời trang, POST trả về sẽ không kéo người dùng về list hoặc gắn lỗi vào form cũ. Kiểm tra nhanh: nhập dữ liệu, gây lỗi GET hoặc POST rồi xác nhận dữ liệu còn nguyên. Bài tập: vì sao `retry: false` vẫn cần khóa submit và cảnh báo timeout?

4. **Field cơ bản — `products/components/ProductField.tsx`.** Đây là component trình bày dùng riêng cho form E9. `interface ProductFieldProps` mô tả props; `required?: boolean` nghĩa là prop có thể vắng mặt; `kind?: "text" | "textarea" | "select"` là union chỉ nhận ba chuỗi. `name: FieldPath<ProductFormValues>` giới hạn tên field, bao gồm đường dẫn nested như `variants.0.sku`. `useFormContext<ProductFormValues>()` lấy form từ Provider. `register(name)` trả về `name`, `onChange`, `onBlur`, `ref`; `{...register(name)}` gắn chúng lên input để thư viện quản lý giá trị. `getFieldState(name, formState)` lấy lỗi đúng đường dẫn, không cần tự truy cập nhiều tầng `errors`.

   `useId()` sinh ID ổn định để `label htmlFor` trỏ đến field. `aria-invalid` và `aria-describedby` giúp công nghệ hỗ trợ nhận biết lỗi. Toán tử `condition ? A : B` chọn JSX theo kind. `options?.map(...)` chỉ duyệt nếu options tồn tại; `key={option.value}` giúp React nhận diện option. Tiền/stock dùng input text và `inputMode` để gợi ý bàn phím; `inputMode` không tự validate hay đổi dữ liệu thành number. Kiểm tra nhanh: bấm label phải focus đúng input. Bài tập: `register("variants.0.price")` liên quan gì đến cấu trúc payload?

5. **Thông số/thuộc tính — `products/components/SpecificationEditor.tsx`.** `useFieldArray({ control, name })` quản lý một mảng object, cung cấp `fields`, `append`, `remove`. `fields.map((row, index) => ...)` tạo UI từng dòng; `row.id` là ID nội bộ của React Hook Form để làm React key, không phải ID backend. `append({ key: "", value: "" })` thêm dòng và `remove(index)` xóa dòng. Tên field `` `${name}.${index}.key` `` dùng template literal để tạo đường dẫn. Ví dụ `name="specification"` cho `specification.0.key`; `name="variants.1.attributes"` cho `variants.1.attributes.0.key`. Type `` "specification" | `variants.${number}.attributes` `` mô tả hai dạng đường dẫn được chấp nhận.

   Editor giữ dữ liệu dạng mảng `{ key, value }` để thêm/xóa/hiển thị lỗi từng dòng. Nó chưa đổi sang object; builder làm việc đó khi submit. Key trùng sẽ bị chặn trước khi `Object.fromEntries` có thể ghi đè. Hai key khác nhau được phép cùng value, ví dụ RAM và Bộ nhớ cùng là `8 GB`; chỉ key phải duy nhất trong từng nhóm. Kiểm tra nhanh: nhập `RAM` và ` RAM ` ở hai dòng, submit phải báo trùng dòng thứ hai. Bài tập: vì sao không giữ thông số ngay từ đầu dưới dạng object và liên tục gán `object[key] = value`?

6. **Biến thể — `products/components/VariantFields.tsx`.** Một `useFieldArray` khác quản lý `variants`. Mỗi variant có `sku`, `price`, `stock`, `attributes`. `newProductVariant()` trả object mới khi thêm dòng, tránh chia sẻ mảng thuộc tính giữa các variant. `ProductFormValues["variants"][number]` trong kiểu trả về là indexed access type: lấy kiểu một phần tử của mảng variants. Không cho xóa variant cuối vì UI yêu cầu ít nhất một; schema cũng kiểm tra quy tắc này. Editor thuộc tính có key theo đường dẫn index để khởi tạo lại khi xóa variant trước đó làm index đổi. SKU được kiểm tra sau trim và không phân biệt hoa/thường trong cùng form; đây không phải xác nhận SKU duy nhất trên toàn database. Kiểm tra nhanh: thêm hai biến thể màu khác nhau, xóa một dòng giữa và xem thuộc tính còn gắn đúng variant. Bài tập: SKU và React `row.id` khác nhau thế nào?

7. **Ảnh — `products/components/ProductImagesField.tsx`.** `Controller` nối `File[]` với React Hook Form vì file input cần cách đọc riêng. `Array.from(event.currentTarget.files ?? [])` đổi FileList thành mảng; `?? []` dùng mảng rỗng khi files null. `[...field.value, ...files]` giữ ảnh cũ và thêm ảnh mới, không mutate mảng cũ. Gán `event.currentTarget.value = ""` cho phép chọn lại cùng file. `filter((_, position) => position !== index)` tạo mảng bỏ đúng ảnh; `_` đánh dấu tham số file không dùng. Có thể bỏ file lỗi mà không mất file còn lại. Ảnh đầu tiên là primary do service backend đặt khi tạo.

   `ImagePreview` dùng `URL.createObjectURL(file)` trong `useEffect`; hàm cleanup gọi `URL.revokeObjectURL(url)` khi thay file/unmount để thu hồi tài nguyên. Ref trỏ tới DOM `<img>`. Chỉ file vượt qua schema ảnh mới được preview; validation này kiểm tra tên/MIME/dung lượng, không đọc chữ ký nội dung. Backend `FileValidator` tiếp tục kiểm tra magic bytes. Không đưa File/object URL vào cache hoặc Zustand persist. Tái sử dụng `shared/validation/imageUpload.ts`; không sửa `ImageDropzone` một ảnh đã có của E6/E7. Kiểm tra nhanh: chọn nhiều ảnh, bỏ ảnh đầu, chọn lại cùng file, thử ảnh rỗng/sai MIME/quá dung lượng. Bài tập: vì sao không dùng URL.createObjectURL trực tiếp trong JSX mỗi lần render?

8. **Schema — `products/schemas.ts`.** `z.object` khai báo cấu trúc, `z.array` khai báo mảng, `z.string().trim().min(1, message)` bỏ khoảng trắng đầu/cuối rồi bắt buộc có nội dung. `refine` thêm một điều kiện; `superRefine((items, context) => ...)` có thể thêm nhiều lỗi bằng `context.addIssue`. `path: [index, "sku"]` đưa lỗi về đúng ô trong mảng; với schema con React Hook Form ghép thêm prefix `variants`. `new Set<string>()` nhớ các SKU/key đã gặp; `.has` kiểm tra trùng và `.add` ghi nhận.

   Regex `/^\d+(\.\d+)?$/` chấp nhận số tiền không âm dạng thập phân, không nhận ô rỗng, dấu âm, NaN/Infinity hoặc dạng `1e3`. Stock dùng `/^\d+$/` và `Number.isSafeInteger` để chặn số lẻ/vượt giới hạn JS. Tiền cũng bị giới hạn bởi `Number.MAX_SAFE_INTEGER`, dùng kiểu Money=number theo repo; không phải phép toán tiền thập phân chính xác tùy ý. Không dùng `z.coerce.number()` vì `Number("")` là 0. `isPositiveLongId` kiểm tra ID bằng chuỗi, giữ nguyên cả Long lớn hơn giới hạn số an toàn JS. Brand nhận `""` khi không chọn. `z.infer<typeof createProductSchema>` suy ra type từ schema; `typeof` ở vị trí type lấy kiểu của biến schema. Kiểm tra nhanh: thử giá rỗng, `-1`, stock `1.5` và SKU trùng. Bài tập: TypeScript interface có tự kiểm tra dữ liệu khi chạy không, vì sao vẫn cần Zod?

9. **DTO — `products/types.ts`.** Bổ sung `CreateAdminProductRequest` và `AdminProductVariantRequest`, tách dữ liệu gửi backend khỏi form. `interface` mô tả object trong lúc biên dịch; nó không xuất hiện như validator ở runtime. `Record<string, string>` là object có key động và value chuỗi. `brandId: ID | null` bắt buộc có property nhưng cho phép null; khác với `brandId?: ID` có thể không có property. `variants: AdminProductVariantRequest[]` là mảng variant. `ID` alias string; `Money` alias number. Không tái dùng DTO này làm payload cập nhật variant cũ E10 vì có nguy cơ ghi đè kho. Kiểm tra nhanh: so kiểu form `basePrice: string` với DTO `basePrice: Money`. Bài tập: vì sao categoryId `"9007199254740993"` không được đi qua `Number()`?

10. **Builder — `products/buildCreateProductRequest.ts`.** `buildCreateProductRequest(values): CreateAdminProductRequest` validate lại ở biên API, trim bằng schema, đổi tiền/stock sang number, đổi brand trống sang null và đổi các dòng key/value thành object. Trong `parsed.specification.map(({ key, value }) => [key, value])`, destructuring lấy hai property rồi tạo cặp `[key, value]`; `Object.fromEntries` biến mảng cặp thành object. `variants.map` tạo mảng DTO mới; không sửa object form đang nhập. `images` không nằm trong JSON.

    `buildCreateProductFormData` tạo `new FormData()`, append `data` bằng `JSON.stringify(payload)` và append từng File cùng key `images`. Không append File vào chuỗi JSON, không đổi Long ID thành number, không tự tạo ID sản phẩm. Browser/Axios tạo multipart boundary, không tự đặt Content-Type application/json hoặc multipart thiếu boundary. Kiểm tra nhanh: Network phải có một part data và nhiều part images đúng thứ tự. Bài tập: phân biệt `JSON.stringify(payload)` và `new FormData()`.

11. **HTTP — `products/api.ts`.** `createAdminProduct(values, authToken): Promise<string>` gọi `api.post<string>`; `<string>` khai báo kiểu data trả về, không phải chuyển đổi dữ liệu tại runtime. `await` chờ Promise và `{ data }` lấy nội dung response Axios. Backend thành công trả text `Product created successfully.`, không có ID. Giữ chế độ đọc mặc định của Axios: text thành công còn nguyên; JSON lỗi vẫn được parse để `normalizeError` lấy message/validationErrors và nhận diện tài khoản khóa. Ép `responseType: "text"` ở đây sẽ làm lỗi JSON thành chuỗi. `meta.authToken` dùng token đã chụp; `noPublicRetry` cấm thử lại dưới phiên guest. Client có sẵn chịu trách nhiệm Bearer header, timeout, lỗi 401/tài khoản khóa. Kiểm tra nhanh: API lỗi category phải hiển thị message, không nguyên chuỗi JSON. Bài tập: tại sao không gọi public product API để tạo sản phẩm?

12. **Mutation/cache — `products/queries.ts`.** `useCreateAdminProduct` dùng `useMutation` cho POST. Khác `useQuery` dùng để đọc GET, mutation chỉ chạy khi gọi `mutateAsync`. Snapshot gồm userId/role/token được kiểm tra trước request, sau await và trước toast/cache/navigate. Query/mutation keys chỉ có userId/role và mô tả tài nguyên; không chứa token/File. `retry: false` không tự lặp mutation; `networkMode: "always"` cho request thử ngay cả khi offline để lỗi được trả về ngay, không nằm chờ tự POST khi reconnect. `gcTime: 0` tránh giữ mutation chứa File lâu sau khi không còn observer.

    `useIsMutating` cập nhật trạng thái pending ở UI; `queryClient.isMutating` kiểm tra lúc thực thi để chặn hai form cùng phiên dispatch đồng thời. Server vẫn cần idempotency nếu muốn ngăn mọi trường hợp gửi trùng; khóa FE không thay thế server. Sau thành công, `cancelQueries` dừng GET cũ rồi `invalidateQueries` đánh dấu dữ liệu liên quan cũ và refetch query đang active. Làm mới products/inventory/category/brand admin hiện tại và public products/categories/brands. Không chờ GET thành công để quyết định POST đã thành công: refetch lỗi phải thử lại GET ở list, không tạo lại sản phẩm. `.catch(() => undefined)` chỉ bắt lỗi tác vụ refresh nền; lỗi POST vẫn đi vào form. Kiểm tra nhanh: tạo xong, chặn GET danh sách và xác nhận không có POST thứ hai. Bài tập: `invalidateQueries` có tự ghi một sản phẩm giả vào cache không?

13. **Kiểm thử — `scripts/verify-admin-product-create.cjs`.** Chạy `node --test scripts/verify-admin-product-create.cjs`. Đây là bộ kiểm tra Node bổ sung theo cách repo đang dùng, không thêm dependency/framework. Loader TypeScript tạm trong bộ kiểm tra giúp chạy module nguồn và thay các biên môi trường bằng fixture. Các test dùng schema/builder thật, Axios với HTTP loopback giả lập, MutationObserver/QueryClient thật để kiểm tra phiên, đồng thời, retry/cache và refetch lỗi; SSR kiểm tra render form, redirect kiểm tra deep link. `assert.equal/deepEqual/rejects` lần lượt kiểm tra giá trị, cấu trúc và Promise bị reject. File ảnh fixture chỉ dùng kiểm tra FE/transport; không thay thế test magic bytes của backend. SSR không chứng minh thao tác DOM/focus hoặc hành vi trình duyệt. Kiểm tra nhanh: bộ test phải kết thúc với 16 pass. Bài tập: test HTTP giả lập có đủ kết luận upload vào storage thật thành công không?

**Payload mẫu để đối chiếu:** form giữ `basePrice="12000000"`, `stock="2"`, specification/attributes là mảng dòng. Sau builder, part `data` chứa chuỗi JSON của object sau; file ảnh nằm ở các part images riêng:

```json
{
  "name": "Điện thoại mẫu",
  "categoryId": "9007199254740993",
  "brandId": null,
  "basePrice": 12000000,
  "description": "Mô tả sản phẩm",
  "specification": { "Màn hình": "6.1 inch" },
  "variants": [
    {
      "sku": "DT-DEN-128",
      "price": 12500000,
      "stock": 2,
      "attributes": { "color": "Đen", "storage": "128 GB" }
    },
    {
      "sku": "DT-TRANG-256",
      "price": 14000000,
      "stock": 0,
      "attributes": { "color": "Trắng", "storage": "256 GB" }
    }
  ]
}
```

Backend đọc category/brand bằng ID, tạo Product ACTIVE, từng ProductVariant ACTIVE và Inventory với quantity ban đầu; upload ảnh, đặt ảnh đầu primary rồi save. POST hiện parse JSON thủ công và chưa gọi Bean Validation, do đó request bỏ qua frontend vẫn có thể thiếu/sai dữ liệu nghiệp vụ. Source `FileValidator` kiểm tra tối đa 5 MiB/file và chữ ký ảnh; cấu hình multipart hiện giới hạn toàn request 30 MB. SKU trong form chỉ được kiểm tra nội bộ, chưa xác nhận uniqueness toàn hệ thống. Không sửa backend trong E9.

**Commit cuối nhiệm vụ:** `feat(admin-products): create products with specifications and variants`

### E10 — Sửa sản phẩm mà không ghi đè tồn kho

**Kết quả:** `/admin/products/:id/edit` tải GET detail, sửa được tên/category/brand/giá cơ bản/mô tả/thông số và giữ tồn kho hiện tại.

**Kiến thức và mã hướng dẫn:** DTO → form defaults, reset có điều kiện, tách create/update payload, cập nhật một phần theo hành vi backend. Mở rộng types/builder/form, thêm `products/pages/EditProductPage.tsx` và PUT mutation.

**Các bước tự code:** PUT JSON `/api/admin/products/{id}`; khi chỉ sửa thông tin chung thì **không gửi `variants`**, vì service bỏ qua nhánh variant khi trường null/không có. Type request phải cho phép trường này vắng mặt; schema create vẫn yêu cầu variant theo UI E9. Không reset form đang dirty vì refetch nền. Hiện variant đã lưu ở chế độ xem, SKU ổn định; nếu hỗ trợ thêm mới thì payload chỉ chứa variant mới, kiểm tra SKU không trùng các variant đang có.

**Phần phụ thuộc backend:** chưa bật sửa giá/attributes của variant cũ bằng cách gửi lại stock snapshot. Muốn hoàn thiện phần đó, backend cần API/DTO nhận variant ID và cập nhật metadata không chạm tồn, hoặc cơ chế tương đương có kiểm soát cạnh tranh. Sau khi contract được sửa, bổ sung bước hướng dẫn và commit riêng `feat(admin-products): edit existing variant details safely`; không đánh dấu phần này xong theo commit sửa thông tin chung.

**Kiểm tra/hoàn thành phần độc lập:** sửa mô tả trong khi tab khác điều chỉnh kho, xác nhận request không có variants và tồn mới được giữ; reload form, brand null, dữ liệu không tìm thấy, PUT thành công/GET lỗi. Bài tập: giải thích vì sao chỉ khóa ô stock vẫn có thể làm mất cập nhật kho.

**Hướng dẫn đọc code E10 theo từng bước và từng file — đã triển khai 21/11/2026**

**Refactor kiểm tra phiên:** `products/queries.ts` hiện dùng `runForSession<T>(session, action)` cho cả GET/POST/PUT. Helper kiểm tra phiên trước/sau callback và truyền token snapshot vào callback. GET vẫn qua `readForSession` để bổ sung kiểm tra abort; mutation giữ kiểm tra gửi trùng trong callback trước HTTP. Các kiểm tra ở `onSuccess` vẫn giữ vì có thêm await trước cache/toast. `<T>` là kiểu kết quả, `action: (token: string) => Promise<T>` là hàm nhận token và trả Promise. Những mô tả kiểm tra trước/sau HTTP bên dưới được thực hiện thông qua helper chung này.

Đăng nhập ADMIN/MANAGER/STAFF → `/admin/products` → bấm tên sản phẩm → `/admin/products/:id/edit`. Sửa tên, danh mục, thương hiệu, giá cơ bản, mô tả hoặc thông số → **Lưu thông tin sản phẩm**. Trang vẫn ở màn hình sửa và GET lại dữ liệu đã lưu. Giá cơ bản thuộc sản phẩm; sửa nó không sửa giá bán từng biến thể. Biến thể đã lưu chỉ xem, chưa thêm variant mới trong E10. Ảnh và đổi trạng thái thuộc E11/E12.

Luồng đọc lần đầu:

```text
router.tsx → EditProductPage.tsx → useAdminProductDetail (queries.ts)
          → getAdminProductDetail (api.ts) → GET backend
          → AdminProductDetailResponse (types.ts)
          → toEditProductValues (editProduct.ts) → EditProductForm.tsx

Nhập form → handleSubmit → zodResolver(editProductSchema)
          → useUpdateAdminProduct → updateAdminProduct
          → buildUpdateProductRequest → PUT JSON (không có variants)
          → ProductServiceImpl.updateProduct → chỉ cập nhật thông tin chung
          → đánh dấu cache cũ → toast đã lưu → GET detail riêng
          → reset bằng dữ liệu mới; GET lỗi thì chỉ thử GET lại
```

1. **Contract và DTO — `src/features/admin/products/types.ts`.** Đọc `AdminProductDetailResponse`, `AdminProductVariantResponse`, `AdminProductImageResponse`, `UpdateAdminProductRequest` trước. Detail có category/brand nullable, mô tả/specification nullable, ảnh và variants. `extends Omit<AdminProductListResponse, "primaryImageUrl" | "variantCount">` lấy các field chung của list rồi bỏ hai field detail không trả. `Record<string, unknown>` diễn tả object có key chuỗi và value chưa biết kiểu; backend dùng `Map<String, Object>`, nên value có thể là chuỗi, số, boolean, null, array hoặc object. Cần kiểm tra kiểu trước khi dùng `unknown`. `variants?: never` có nghĩa payload sửa thông tin chung không được nhận mảng variants; `?` là property tùy chọn, `never` không có giá trị hợp lệ để gán. Đây là chặn lúc TypeScript biên dịch; builder còn phải chặn ở runtime. `ID` vẫn là string, không chuyển sang Number. Kiểm tra nhanh: so DTO list với detail bên backend. Bài tập: vì sao `Omit` không tự xóa property khỏi object JavaScript khi ứng dụng chạy?

2. **Schema/defaults/builder — `src/features/admin/products/editProduct.ts`.** File này không render JSX và không gửi HTTP; nó chuyển đổi dữ liệu. `createProductSchema.pick({...})` dùng lại validation tên/category/brand/giá/mô tả của E9 mà không yêu cầu variants/images. `.extend({...})` bổ sung mảng thông số của form sửa. `z.infer<typeof editProductSchema>` suy ra kiểu TypeScript từ schema, tránh viết hai định nghĩa lệch nhau. `superRefine` báo lỗi JSON/key trùng theo `path`, ví dụ `specification.0.value`, giúp React Hook Form hiển thị lỗi đúng ô. `.parse(values)` trả dữ liệu hợp lệ hoặc throw lỗi; `.safeParse(values)` trong test trả kết quả success/error.

   `toEditProductValues(product)` đổi DTO thành dữ liệu input: `String(basePrice)` vì input text trả chuỗi, `brandId ?? ""` để select có giá trị rỗng khi backend trả null, `Object.entries` đổi object thông số thành các dòng. `??` chỉ dùng vế phải khi vế trái là null/undefined, giữ được 0/false/chuỗi rỗng. Thông số chuỗi dùng `format: "text"`; value khác chuỗi dùng JSON để bảo toàn kiểu. Ví dụ backend `{ "RAM": "8 GB", "cores": 8, "wireless": true }` quay lại đúng các kiểu này khi lưu, thay vì biến mọi value thành chuỗi. `typeof value === "string"` là kiểm tra runtime và giúp TypeScript thu hẹp kiểu.

   `buildUpdateProductRequest` parse lại dữ liệu và tạo object mới bằng danh sách field cho phép. `Number(parsed.basePrice)` chỉ đổi tiền sau validation, không đổi ID. `Object.fromEntries(rows.map(...))` đổi các cặp `[key, value]` về object; `JSON.parse` chỉ chạy với dòng format JSON đã được validate. Không spread toàn bộ detail hoặc form vào PUT. Dù caller truyền thừa `variants`, builder vẫn loại nó khỏi request. Kiểm tra nhanh: xem request mẫu dưới đây và test round trip. Bài tập: `brandId || null` trong builder khác `brandId ?? null` thế nào khi form đang có chuỗi rỗng?

3. **HTTP — `src/features/admin/products/api.ts`.** Thêm `getAdminProductDetail(id, signal, authToken)` và `updateAdminProduct(id, values, authToken)`. Cả hai kiểm tra `isPositiveLongId` trước khi nối ID vào URL. GET dùng `api.get<AdminProductDetailResponse>`; PUT dùng `api.put<string>` vì backend trả câu thông báo text. `<T>` ở đây là generic mô tả kiểu response cho TypeScript, không tự validate response ở runtime. `const { data } = await ...` vừa chờ Promise vừa destructure phần data từ AxiosResponse. PUT gửi object JSON, không dùng FormData như POST tạo E9. `signal` cho phép hủy GET; `meta.authToken` giữ token của phiên đã chụp và `noPublicRetry` ngăn rơi về request public sau lỗi auth. Để Axios đọc mặc định giúp text thành công và JSON lỗi cùng hoạt động. Kiểm tra nhanh: Network phải là PUT `/api/admin/products/{id}`, Content-Type JSON. Bài tập: vì sao không ép `responseType: "text"` cho mọi response của mutation?

4. **Query/cache/phiên — `src/features/admin/products/queries.ts`.** `useAdminProductDetail(id)` dùng key `["admin", userId, role, "products", "detail", id]`, chỉ enabled khi ID và phiên hợp lệ. Không đưa token vào key. Hàm `readForSession` đã có từ E8 kiểm tra snapshot trước/sau GET và kiểm tra abort, nên response cũ sau đổi phiên không được coi là dữ liệu phiên mới. `useUpdateAdminProduct(id)` là custom hook bọc `useMutation`: `retry: false` không tự thử lại, `networkMode: "always"` không giữ PUT offline để tự phát khi reconnect, `gcTime: 0` không giữ mutation không còn observer trong cache lâu dài. Đây là cấu hình thư viện; React phụ trách render, backend vẫn kiểm tra quyền và dữ liệu cuối cùng.

   `useIsMutating` hiển thị pending của cùng sản phẩm trong phiên; `queryClient.isMutating(...) > 1` chặn dispatch cạnh tranh cùng key trong một QueryClient, không phải khóa hai tab hay khóa DB. `mutationFn` kiểm tra user/token/role và quyền `product.write` trước/sau HTTP. `onSuccess` cancel GET cũ rồi kiểm tra phiên lại trước invalidate/toast. `invalidateQueries({ refetchType: "none" })` đánh dấu products admin/public, inventory của phiên, cart và wishlist đã cũ, chưa tự chạy GET ngay trong callback PUT. Detail được form GET riêng; các query còn lại tải lại khi dùng theo lifecycle Query. Không làm optimistic update và không tự tính tồn. `isProductWriteUncertain` phân loại mất mạng/408/5xx; tên cũ `isProductCreateUncertain` vẫn là alias để giữ E9 hoạt động. Kiểm tra nhanh: test thay tài khoản giữa PUT và hai mutation cùng sản phẩm. Bài tập: vì sao kiểm tra session trước request thôi chưa đủ để quyết định toast sau request?

5. **Trang điều phối — `src/features/admin/products/pages/EditProductPage.tsx`.** `useParams()` đọc `:id` trên URL; ID không hợp lệ không bật GET. Hooks luôn được gọi trước nhánh return. Trang render các trạng thái loading, chờ mạng, lỗi GET, 403, 404, rồi phần thông tin chung và biến thể. Khi refetch lỗi mà vẫn có data, trang giữ form và hiện cảnh báo dữ liệu xem có thể cũ; không thay toàn bộ form bằng màn lỗi. `reload()` gọi `query.refetch()` và tự throw nếu `result.isError`, vì refetch mặc định trả QueryObserverResult kể cả khi GET lỗi; không được lấy `result.data` cũ rồi coi là vừa tải thành công.

   `key={userId + role + productId}` của form giúp React tạo form mới khi chuyển sản phẩm hoặc tài khoản/role; không dùng updatedAt làm key vì refetch có thể làm mất draft. `SavedProductVariants` nằm ngoài form để chỉ xem dữ liệu server mới. GET tự động giữ draft dirty; theo phản hồi giao diện, không còn nút tải lại dữ liệu nền thủ công. Khi cần nhấn F5, thay đổi chưa lưu sẽ mất. Kiểm tra nhanh: mở trực tiếp URL hợp lệ/sai, thử 404/403 và refetch lỗi. Bài tập: nếu dùng `key={product.updatedAt}`, chuyện gì xảy ra khi đang gõ và dữ liệu nền đổi?

6. **Form chính — `src/features/admin/products/components/EditProductForm.tsx`.** `useForm<EditProductFormValues>` quản lý giá trị/lỗi; `zodResolver(editProductSchema)` nối Zod vào React Hook Form; `defaultValues` lấy từ mapper. `FormProvider {...form}` cung cấp context cho field/editor con; cú pháp `{...form}` trải các property thành props, không phải payload gửi server. `useWatch` theo dõi category/brand để giữ option dự phòng nếu list lựa chọn chưa tải được hoặc relation đã mất. Query lựa chọn lỗi không reset ID đang chọn; INACTIVE có nhãn rõ.

   `formState.isDirty` cho biết bản nháp khác defaults. Effect chỉ `reset(toEditProductValues(product))` khi form sạch, không đang gửi và không chờ xác minh lần lưu; refetch không ghi đè form dirty. `useRef(false)` giữ cờ mutable qua render mà không tự render lại: `submitting.current` chặn hai lần click trước khi React kịp cập nhật state; `mounted.current` ngăn reset/gắn lỗi sau khi rời trang; `awaitingRefresh.current` giữ draft khi PUT đã thành công nhưng GET xác minh lỗi. `useState` dùng cho thông tin phải hiện ra UI: saved, reloading và refreshError.

   `handleSubmit(submit)` validate trước khi gọi submit. `void handleSubmit(submit)(event)` biểu thị callback sự kiện không trả Promise cho React; submit tự xử lý lỗi bằng try/catch/finally. `mutation.mutateAsync({ values, session: {...session} })` gửi dữ liệu cùng bản chụp phiên. `as const` ở danh sách field lỗi giữ các tên thành literal union để `setError(field, ...)` được kiểm tra kiểu. `finally` luôn mở ref khóa, dù thành công hay lỗi. `errors.root?.server` dùng optional chaining để không truy cập property của undefined.

   Sau PUT thành công: set saved → GET riêng → thành công mới reset bằng dữ liệu server. Nếu GET lỗi: giữ giá trị đang nhập, nói **đã lưu**, khóa gửi PUT tiếp và cho nút chỉ chạy GET lại. Mất mạng/timeout/5xx của PUT cũng khóa gửi lại cho đến khi người dùng tải dữ liệu server để kiểm tra; nút này nói rõ sẽ thay draft bằng dữ liệu máy chủ. Lỗi 400 map vào field, giữ draft; 403 khóa thao tác; 404 PUT có thể là product hoặc relation bị xóa nên cho tải nền/đổi lựa chọn nếu product vẫn còn. `fieldset disabled` khóa nhóm input, nút submit còn có điều kiện `!isDirty`. Kiểm tra nhanh: nhập mô tả, tải nền, xác nhận chữ đang gõ còn nguyên; sau PUT thành công/GET lỗi không được gửi PUT lần nữa. Bài tập: phân biệt lý do dùng ref khóa click và state hiển thị loading.

7. **Field tái sử dụng — `src/features/admin/products/components/ProductField.tsx`.** File E9 được mở rộng generic `T extends FieldValues = ProductFormValues`: T là kiểu form, phải là object field hợp lệ; mặc định vẫn dùng form E9. E10 viết `<ProductField<EditProductFormValues> ... />` để kiểm tra tên field theo schema sửa. `FieldPath<T>` cho phép cả đường dẫn nested như `specification.0.value` và bắt lỗi tên field khi biên dịch. `useFormContext<T>()` lấy form từ provider, `register(name)` nối input với React Hook Form; `getFieldState` lấy lỗi; `useId()` tạo ID cho label và mô tả lỗi có thể truy cập bằng bàn phím/screen reader. `kind` chọn input/textarea/select bằng toán tử ba ngôi. Không đổi cơ chế submit của E9. Kiểm tra nhanh: chạy lại bộ E9 và xem label trỏ đúng input. Bài tập: vì sao dùng `name: string` sẽ mất một lớp bảo vệ so với `FieldPath<T>`?

8. **Thông số động — `src/features/admin/products/components/EditSpecificationEditor.tsx`.** Editor riêng cho schema sửa vì dữ liệu đã lưu có thể chứa JSON khác chuỗi, trong khi editor E9 nhập giá trị chuỗi. `useFieldArray({control, name: "specification"})` quản lý thêm/xóa dòng. `fields.map((row, index) => ...)` render mỗi dòng; `key={row.id}` là ID nội bộ ổn định của React Hook Form, không phải key thông số backend. `index` dùng tạo đường dẫn field; template literal `` `specification.${index}.value` `` tạo chuỗi bằng biểu thức. `append({key:"",value:"",format:"text"})` thêm dòng; `remove(index)` xóa dòng. Các nút đặt `type="button"` để không submit ngoài ý muốn. Value văn bản được giữ nguyên; JSON được validate trước khi parse. Kiểm tra nhanh: thêm ba dòng, xóa dòng giữa, thử key trùng và JSON sai. Bài tập: vì sao không nên dùng index làm React key cho danh sách input có thể xóa giữa?

9. **Biến thể chỉ xem — `src/features/admin/products/components/SavedProductVariants.tsx`.** Render SKU, ID, giá, stock, trạng thái và attributes của từng biến thể; null attributes/variants có fallback. `formatVND` và `ProductStatusBadge` được dùng lại. `Object.entries(attributes ?? {})` render key/value, stringify value khác chuỗi để React không nhận object trực tiếp làm child. Không có register/input/mutation trong component này. Tổng tồn lấy từ backend, không tự cộng lại. Kiểm tra nhanh: xem cả variant INACTIVE và sản phẩm không có variant. Bài tập: vì sao chỉ đặt ô stock readonly rồi gửi cả variant vẫn làm mất cập nhật kho từ tab khác?

10. **Nối vào ứng dụng — `src/app/router.tsx`, `src/shared/auth/redirect.ts`, `src/features/admin/products/pages/AdminProductsPage.tsx`.** Router thêm child `products/:id/edit` lazy-load bằng `await import(...)`; guard AdminRoute hiện có chặn guest/CUSTOMER. Redirect whitelist nhận đường dẫn sửa có ID Long hợp lệ và quyền `product.write`, giữ query/hash sau login. Biểu thức regex `^...$` khớp toàn bộ pathname, `([^/]+)` bắt phần ID, sau đó `isPositiveLongId` kiểm tra ý nghĩa ID; regex một mình chưa chứng minh ID hợp lệ. Trang list đổi tên sản phẩm thành `Link` trỏ sang edit; link nội bộ của React Router điều hướng trong ứng dụng. Không cần menu riêng cho mỗi sản phẩm. Kiểm tra nhanh: login từ deep link, thử A/M/S và CUSTOMER. Bài tập: phân biệt nhiệm vụ của route, link, redirect whitelist và backend authorization.

11. **Kiểm chứng — `scripts/verify-admin-product-edit.cjs`.** Node test runner có sẵn, không thêm framework/dependency/npm script. Loader TypeScript trong script nạp các module thật với mock ở boundary; schema/builder chạy thật, API chạy qua Axios và HTTP loopback, cache chạy QueryClient/MutationObserver/QueryObserver thật. Test kho giả lập đọc stock=3, thay stock=29 sau GET, rồi PUT metadata; request không có variants nên stock giữ 29. Script còn kiểm tra ID lớn, brand null, JSON round trip, lỗi JSON, abort/đổi phiên, gửi lặp, offline không replay, SSR, handler form và deep link. Harness hook của handler mô phỏng lifecycle, không phải browser thật và không chứng minh transaction/JPA của backend. Kiểm tra nhanh: chạy lệnh bên dưới. Bài tập: HTTP giả lập chứng minh điều gì về frontend và còn thiếu bằng chứng gì về backend thật?

12. **Tài liệu và chỉnh lint nhỏ.** `phase5.md` ghi tiến độ, hướng dẫn và bàn giao; commit chỉ là thông điệp đề xuất. Trong `src/features/admin/brands/components/DeleteBrandDialog.tsx` chỉ thêm comment vào catch rỗng có sẵn: lỗi đã được mutation giữ để dialog hiển thị, không đóng khi xóa thất bại. Không thay logic E7. Các file E9 còn lại được tái sử dụng qua schema/API/session và giữ nguyên hành vi tạo.

Request mẫu khi sửa thông tin chung:

```json
{
  "name": "Điện thoại A",
  "categoryId": "9223372036854775807",
  "brandId": null,
  "basePrice": 12000000,
  "description": "Mô tả vừa sửa",
  "specification": { "RAM": "8 GB", "cores": 8, "wireless": true }
}
```

Không có `variants`, `stock`, `status` hay `images`. Đây là PUT dùng hành vi cập nhật có điều kiện của service hiện tại, không phải một API PATCH tổng quát. Backend vẫn nhận đủ các trường thông tin chung; không tùy ý bỏ `categoryId`/`basePrice`. Hai tab cùng sửa metadata vẫn có thể ghi đè thông tin chung vì contract chưa có version/If-Match; bỏ variants chỉ xử lý phạm vi không ghi đè kho của E10.

```powershell
npm run typecheck
npm run lint
npm run build
node --test scripts/verify-admin-product-edit.cjs scripts/verify-admin-product-create.cjs
npm run verify:catalog
git diff --check
```

Kiểm thử nghiệp vụ thật còn cần làm: chạy frontend/backend, đăng nhập lần lượt A/M/S, mở một sản phẩm và sửa mô tả; trong tab khác điều chỉnh tồn bằng công cụ/API kho dev đã được phép dùng; kiểm tra payload PUT không có variants, GET lại/reload xác nhận tồn mới và metadata mới. Thử brand null, category/brand INACTIVE hoặc bị xóa, ID sai/không tồn tại, 403, lỗi mạng, PUT thành công/GET lỗi, đổi tài khoản và rời trang trong request chậm, bàn phím/mobile. CUSTOMER phải bị chặn cả route và API. Chưa kết luận nghiệp vụ backend thật chỉ từ bộ mock.

**Commit cuối nhiệm vụ:** `feat(admin-products): edit product metadata without overwriting inventory`

### E11 — Thêm, xóa và chọn ảnh đại diện sản phẩm

**Kết quả:** khu ảnh trên trang sửa quản lý được ảnh server và phản ánh đúng ở catalog sau làm mới.

**Kiến thức và mã hướng dẫn:** phân biệt file đang chọn với entity ảnh đã lưu, mutation theo dòng, lỗi từng thao tác. Sinh `products/components/ProductImageManager.tsx` và API/query cho ảnh.

**Các bước tự code:** POST `/{id}/images` multipart `images`; DELETE `/{id}/images/{imageId}`; PATCH `/{id}/images/{imageId}/primary`, đều dưới `/api/admin/products`. Mỗi hành động hoàn tất refetch detail, không đoán imageId hoặc ảnh primary còn lại. Dùng FileValidator làm tham chiếu, cleanup preview. Chưa làm lưu thứ tự ảnh đã upload vì không có endpoint.

**Kiểm tra/hoàn thành:** thêm nhiều file, ảnh lỗi, xóa ảnh primary, xóa ảnh đã bị xóa ở tab khác, chọn primary rồi reload, ảnh thiếu fallback. Bài tập: chỉ ra dữ liệu nào thuộc local preview và dữ liệu nào phải lấy lại từ backend.

**Hướng dẫn code đã triển khai:** [E11 — flow, từng file, cú pháp và bài tập](docs/e11-product-images-guide.md). Đọc lần lượt DTO → schema/action/FormData → API → session/mutation/cache → component/handler → page → kiểm tra. Xem bàn giao E11 cuối tài liệu để phân biệt kiểm tra tự động và nghiệm thu tích hợp.

**Commit cuối nhiệm vụ:** `feat(admin-products): manage product images and primary selection`

### E12 — Đổi trạng thái sản phẩm và ngừng bán biến thể

**Triển khai — 22/11/2026:** đã thêm hai hành động trên trang edit, xác nhận và khóa chung theo sản phẩm/phiên. Đã kiểm tra tự động; chưa thử mutation có đăng nhập trên backend thật. Chi tiết ở bàn giao cuối tài liệu.

**Kết quả:** A/M đổi ACTIVE/INACTIVE/HIDDEN của sản phẩm và ngừng bán variant; S chỉ có phần xem/sửa được backend cho phép.

**Kiến thức và mã hướng dẫn:** quyền cấp hành động, thao tác cần xác nhận, soft delete và ảnh hưởng liên feature. Thêm `products/components/{ProductStatusAction,DeactivateVariantAction}.tsx`, permission và mutations tương ứng.

**Các bước tự code:** PATCH `/api/admin/products/{id}/status?status=...`; DELETE `/api/admin/products/{id}/variants/{variantId}`. Hiển thị trạng thái trả về sau refetch, giữ ID và giải thích ngừng bán variant không xóa snapshot đơn cũ. Không thêm nút xóa cứng toàn sản phẩm. Phần bán lại variant đã được bổ sung bằng API riêng tại E12b. Làm mới public list/detail/compare và dữ liệu tồn liên quan.

**Contract cập nhật E12b — 24/11/2026:** `changeProductStatus` chỉ đổi product.status và updatedAt, giữ trạng thái riêng của mọi variant. DELETE variant chỉ set INACTIVE và giữ ID. PATCH variant status riêng nhận ACTIVE/INACTIVE, trả text và kiểm tra A/M. Frontend kiểm tra quyền lúc render và ngay trước dispatch, không thay kiểm tra backend. Hành vi cascade được ghi trong bàn giao E12 ngày 22/11 là hành vi cũ, đã thay thế ở E12b.

**Kiểm tra/hoàn thành:** S không gọi được hành động hạn chế, sản phẩm ẩn khỏi luồng public theo backend, variant đang ở giỏ/đơn cũ có fallback hợp lệ, request đồng thời và 404. Bài tập: giải thích vì sao không thể xóa variant chỉ bằng cách bỏ dòng khỏi form E10.

**Commit cuối nhiệm vụ:** `feat(admin-products): control product visibility and deactivate variants`

### E12b — Bán lại biến thể và cải thiện thẻ biến thể

**Yêu cầu trực tiếp — 24/11/2026:** bổ sung bán lại biến thể và làm thẻ chuyên nghiệp, dễ đọc; phạm vi lần này gồm API backend cần thiết và frontend. Không tạo lại file guide E12.

**Kết quả:** ADMIN/MANAGER ngừng bán hoặc bán lại tại thẻ trên `/admin/products/:id/edit`; STAFF chỉ xem. Biến thể INACTIVE hoặc HIDDEN cũ có nút Bán lại; ACTIVE có nút Ngừng bán. Xác nhận riêng ở đúng thẻ, refetch detail sau ghi, giữ ID/SKU/giá/thuộc tính/tồn kho và snapshot đơn cũ. Bật lại sản phẩm không tự khôi phục mọi biến thể. Variant ACTIVE của product không ACTIVE vẫn chưa được mua; UI giải thích điều này.

**Contract:** PATCH `/api/admin/products/{id}/variants/{variantId}/status?status=ACTIVE`, không body, trả text. Backend nhận ACTIVE/INACTIVE, HIDDEN/null bị từ chối; kiểm tra variant thuộc product, role A/M, no-op cùng status không đổi updatedAt. DELETE cũ giữ tương thích và gọi chung logic INACTIVE. Chỉ trạng thái đổi mới cập nhật product.updatedAt; không chỉnh inventory timestamp/quantity hoặc tạo variant mới.

**File frontend:** `products/types.ts`, `api.ts`, `lifecycleQueries.ts`, `components/{ProductLifecycleManager,ReactivateVariantAction,DeactivateVariantAction,SavedProductVariants,ProductStatusAction}.tsx`, `shared/auth/permissions.ts`; mở rộng `scripts/verify-admin-product-lifecycle.cjs`. Thẻ hiển thị thumbnail/fallback, SKU, badge trạng thái, giá và tồn hai cột, thuộc tính dạng nhãn, ID phụ và nút hành động cuối thẻ; grid responsive và các thẻ cùng hàng có chiều cao đồng đều. Số biến thể bật bán khác điều kiện mua thực tế khi parent bị ẩn hoặc tồn bằng 0.

**File backend:** `AdminProductController`, `ProductService`, `ProductServiceImpl`, điều chỉnh assertion cũ ở `ProductServiceImplTest`, thêm `ProductVariantStatusServiceTest`. Giữ thay đổi có sẵn của người dùng ở `modules/order/dto/response/OrderItemResponse.java` và frontend `admin/orders/queries.ts`.

**Quy tắc kiểm tra:** quyền A/M/S/CUSTOMER, product/variant sai hoặc thuộc product khác, no-op, HIDDEN cũ, parent ẩn/ngừng bán, stock 0, hai thao tác đồng thời, timeout/403/404, GET lỗi sau ghi thành công, đổi phiên trước/sau request. Không optimistic hay tự retry; cùng khóa lifecycle và cache products/inventory/dashboard/catalog/cart/wishlist. Chưa có khóa/version giữa các tab/tài khoản; dữ liệu HIDDEN/INACTIVE do cascade cũ được giữ nguyên, có thể dùng Bán lại theo từng variant, không chạy migration tự bật hàng loạt.

**Trạng thái:** đã triển khai, kiểm tra tự động và preview thẻ sáng/tối/mobile với dữ liệu mẫu; chưa kiểm thử mutation có đăng nhập trên backend đang chạy. Cần khởi động lại backend để sử dụng API và hành vi status mới. Kết quả chi tiết ở bàn giao cuối tài liệu.

**Commit frontend đề xuất:** `feat(admin-products): reactivate variants and refine variant cards`

**Commit backend đề xuất:** `feat(products): manage variant status independently from product visibility`

### E13 — Danh sách tồn kho và bộ lọc

**Kết quả:** `/admin/inventory` xem được kho theo SKU/tên, status và khoảng tồn; link từ dashboard sau này mở đúng bộ lọc.

**Kiến thức và mã hướng dẫn:** phân trang client khác server, dữ liệu suy ra, chuẩn hóa filter. Sinh `inventory/{types,api,queries,filters}.ts`, `inventory/pages/InventoryPage.tsx`.

**Các bước tự code:** GET `/api/admin/inventory` với `keyword, status, minQuantity, maxQuantity`, nhận mảng. Giữ bộ lọc ở URL; validate số nguyên không âm và min ≤ max. Sort/page trong client trên toàn bộ response; status dùng enum IN_STOCK/LOW_STOCK/OUT_OF_STOCK. Phân biệt `inventoryId`, `variantId`, `productId`. Chưa thêm virtualization nếu chưa đo được vấn đề hiệu năng thực tế.

**Đối chiếu triển khai 24/11/2026:** repository backend chỉ tìm keyword trong tên sản phẩm. E13 gửi status/minQuantity/maxQuantity, bỏ keyword khỏi HTTP và lọc OR SKU/tên trên toàn bộ mảng trả về trước sort/page để không mất dòng khớp SKU. Không sửa backend.

**Kiểm tra/hoàn thành:** tồn 0, ngưỡng status từ server, min/max sai, keyword SKU, mảng rỗng/lớn, reload URL và không gửi API page/size giả. Bài tập: xác định ID nào phải truyền khi điều chỉnh kho.

**Commit cuối nhiệm vụ:** `feat(admin-inventory): list stock levels with filters`

### E14 — Điều chỉnh tồn và xem lịch sử

**Cập nhật 25/11/2026:** đã triển khai trực tiếp theo yêu cầu; xem bàn giao E14 cuối tài liệu. Chưa nghiệm thu nghiệp vụ trên backend có đăng nhập.

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

**Trạng thái — 25/11/2026:** đã triển khai theo yêu cầu trực tiếp; xem bàn giao và hướng dẫn đọc code cuối tài liệu. Chưa nghiệm thu browser/backend có đăng nhập.

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

**Bàn giao triển khai — 25/11/2026:**

- Đã thêm module `src/features/admin/coupons/`: DTO, schema form/response, chuyển giờ Việt Nam ↔ Instant UTC, badge dẫn xuất, lọc/phân trang mảng theo URL, API/query, form/dialog và `CouponsPage`. Đã nối lazy route, sidebar và login redirect `/admin/coupons`. Không thêm dependency, không sửa backend, không thay đổi tổng đơn đã đặt.
- Đọc lại AdminCouponController, CouponRequest/Response, CouponServiceImpl và CheckoutServiceImpl. GET trả mảng; POST/PUT trả DTO; PUT toggle trả text. Đã chạy serialize class CouponResponse compile với Java 21/Jackson 3.1.5 và xác nhận JSON `active` cùng ID chuỗi; chưa đối chiếu Network response từ server đang chạy.
- Form dùng `0 < discountValue`, phần trăm ≤ 100, minOrderValue ≥ 0, usageLimit nguyên 1..2147483647, end ≥ start. Backend DTO mới chặn discountValue ≥ 0 và chưa chặn phần trăm >100: còn yêu cầu server validation. Hiển thị/input luôn giờ VN, payload UTC có Z; thời điểm không sửa giữ nguyên độ chính xác chuỗi server.
- STAFF chỉ đọc; mutation kiểm tra quyền/phiên trước và sau request. Không retry/queue offline, chống double-click, giữ draft khi lỗi 400/409, khóa ghi trong lần mở trang khi timeout/5xx/kết quả không rõ. GET thành công sau timeout không tự mở khóa. Đã lưu nhưng GET lỗi được báo riêng; không phát lại mutation. Không có nút tải lại thủ công.
- Kiểm tra: typecheck, ESLint phạm vi E17, build đạt; `verify:admin-coupons` 13/13 và `verify:checkout` 24/24 test mock đạt. Build còn cảnh báo chunk lớn hiện có. Chưa thử browser/focus/keyboard, ghi có đăng nhập, authorization server, race nhiều quản trị viên và áp coupon qua checkout thật. Source hiện không có endpoint quote riêng; couponCode đi cùng POST checkout, server trả discountAmount/totalPrice.
- Giải thích từng file, flow và cú pháp TS/TSX được trình bày trực tiếp trong chat theo yêu cầu người dùng, không tạo file guide.md. Chưa tạo commit/push; dùng thông điệp đề xuất phía trên khi người dùng yêu cầu commit.

### E18 — Người dùng, khóa/mở tài khoản và đổi role

**Kết quả:** `/admin/users` và `/admin/users/:id` tìm/xem người dùng; thao tác quản trị đúng quyền và đúng tài khoản đích.

**Kiến thức và mã hướng dẫn:** quyền theo actor và target, query param mutation, session cũ sau thay quyền. Sinh module `users/`, list/detail, `UserStatusAction`, `UserRoleDialog`; bổ sung permission hành động nếu còn thiếu.

**Các bước tự code:** GET `/api/admin/users?keyword=&page=&size=` và `/{id}`; PUT `/{id}/status?status=...`, PUT `/{id}/role?role=...` trả text. M chỉ khóa/mở CUSTOMER, A mới đổi role. UI khóa/mở chỉ gửi ACTIVE/INACTIVE theo nghiệp vụ đã xác nhận; PENDING hiển thị trạng thái chờ xác thực, không giả là nút phê duyệt tài khoản. Chặn tự khóa/tự đổi role, xác nhận trước thay quyền, refetch user đích. Không viết lại session hiện tại bằng response của user khác.

**Kiểm tra/hoàn thành:** A/M/S/CUSTOMER, M thao tác lên role khác, URL trực tiếp, user không tồn tại, phiên của tài khoản bị khóa/đổi role đang mở ở trình duyệt khác. Ghi rõ backend chưa thấy chặn tự sửa và cần kiểm tra quyền có hiệu lực với JWT cũ ra sao. Bài tập: phân biệt quyền “xem users” và quyền “thay status của user này”.

**Commit cuối nhiệm vụ:** `feat(admin-users): manage account status and roles`

**Bàn giao triển khai — 26/11/2026:**

- Đã tạo `/admin/users` và `/admin/users/:id`: tìm họ tên/email, phân trang server, URL lưu keyword/page/size, chuẩn hóa URL lỗi và trang vượt giới hạn; detail reload được trực tiếp. Menu đứng sau Trang quản trị; list/detail đều có RequireRole A/M, query kiểm tra phiên/quyền riêng, redirect whitelist giữ query/hash. STAFF/CUSTOMER không được gọi GET qua các hook này.
- Đối chiếu lại AdminUserController, UserServiceImpl, UserAdminResponse, UserRepository và SecurityConfig: GET list nhận keyword/page/size (không sort); DTO gồm id/fullName/email/phone/role/status; ID JSON dạng string. PUT status/role dùng query param, không JSON body, trả text. Tái sử dụng normalizePage, DataTable, Pagination, session và Dialog.
- ADMIN đổi role và khóa/mở các tài khoản khác; MANAGER chỉ khóa/mở CUSTOMER. UI và mutation cùng kiểm tra actor/target. Chặn tự sửa, không gửi status PENDING, chỉ hiển thị Chờ xác thực. PENDING không có nút khóa/mở hoặc phê duyệt. Đổi role luôn qua hộp thoại chọn role mới và xác nhận email/ID; không ghi response người dùng đích vào session hiện tại.
- Khóa ghi theo ID giữa hai action, chặn nhấp đúp bằng ref, mutation không retry/không pause để replay khi reconnect. Thành công phân biệt với GET sau ghi lỗi; refetch list/detail đang active, cache còn lại stale. Timeout/403/409/5xx khóa ghi trong lần mở trang; GET sau timeout không tự mở khóa. 400 giữ form, 404 bỏ phần chi tiết/thao tác, phiên đổi hoặc token hết hạn chặn response muộn.
- Source backend chưa chặn tự khóa/tự đổi role. SecurityConfig lấy quyền từ claim role, validator kiểm tra thời gian/blacklist; đường xác thực đã đọc chưa tra lại status/role DB và UserServiceImpl không thu hồi JWT khi sửa. Đây là phát hiện từ source, **chưa kiểm thử token cũ thực tế**. Backend cần bổ sung bảo vệ tự sửa/thu hồi hoặc kiểm tra phiên hiện hành. Không sửa backend trong E18; frontend không bảo đảm khóa tài khoản sẽ thu hồi JWT đã phát hành.
- File mới: `users/{types,filters,policy,schemas,api,queries}.ts`, `users/components/{UserActionDialog,UserStatusAction,UserRoleDialog}.tsx`, `users/pages/{AdminUsersPage,AdminUserDetailPage}.tsx`, `scripts/verify-admin-users.cjs`. Tích hợp: router.tsx, navigation.ts, permissions.ts, redirect.ts, package.json và phase5.md. Giải thích từng file và cú pháp được trình bày trực tiếp trong chat bằng code fences TS/TSX; không tạo guide riêng.
- Kiểm tra: `verify:admin-users` **12/12** đạt bằng mock HTTP, query/mutation và submit handler thật; build gồm typecheck, lint toàn repo và git diff --check đạt. Build còn cảnh báo chunk storefront/HeroScene lớn có từ trước. Chưa thử browser/focus/keyboard/mobile và request có đăng nhập trên backend thật. Cần thử A/M/S/CUSTOMER/guest, M gọi trực tiếp lên non-CUSTOMER, ID không tồn tại, 403/404/timeout và tài khoản đích đang mở phiên ở trình duyệt khác. Không commit/push; commit đề xuất như trên.

### E19 — Dashboard và thống kê theo khoảng ngày

**Bàn giao 27/11/2026:** đã triển khai module `src/features/admin/dashboard/` và route lazy `/admin/dashboard` cho A/M; mặc định 30 ngày, preset 7/30 ngày/tháng này, khoảng tùy chọn trên URL, validation date-only thật và chênh lệch ≤ 365 ngày (tối đa 366 ngày lịch). Có 4 thẻ số server, 2 biểu đồ SVG riêng đơn vị VND/đơn, bảng chính xác theo ngày, phân bố trạng thái dạng text/thanh và top 5 tồn thấp với link SKU sang inventory. Null hiển thị —, 0 giữ 0; không tự cộng tổng/điền lại ngày. Không thêm thư viện hoặc nút GET thủ công. Query bảo vệ snapshot user/role/token trước/sau GET, hỗ trợ abort và key theo user/role/range, không chứa token. Landing A/M tới dashboard, STAFF tới orders, giữ deep link hợp lệ.

**Contract đọc lại 27/11/2026:** controller chỉ A/M; doanh thu = SUM(totalPrice) với createdAt trong khoảng và `(DELIVERED OR (PAID AND status NOT IN (CANCELLED, RETURNED)))`. Số đơn tính mọi trạng thái theo createdAt; khách mới là role CUSTOMER theo ngày tạo, không lọc status user; phân bố dùng orderStatus lưu trên đơn, không suy ra trạng thái return hiệu lực. Tồn thấp là quantity ≤ 10 hiện tại, gồm hết hàng/variant ngừng bán; top tối đa 5, không theo khoảng ngày. JVM dùng systemDefault để lọc, MySQL DATE_FORMAT để nhóm; properties chưa chốt timezone. Chưa xác nhận JVM/JDBC/MySQL runtime, không hứa số liệu luôn theo giờ VN.

**Kiểm chứng E19:** `verify:admin-dashboard` 10/10 test Node/mock/render tĩnh (ngày nhuận, một ngày, biên 365/vượt biên, preset qua tháng/năm, URL, HTTP date-only/auth/signal, quyền và đổi phiên/abort, redirect/deep link, chart rỗng/null/0, link SKU, page loading/403/refetch). Các test này không thay thế browser/backend thật. Chờ thử UI có đăng nhập, STAFF gọi API thật nhận 403, đối soát tập đơn biết trước và xác nhận timezone. Không đánh dấu nghiệm thu tích hợp. Commit E19 dùng thông điệp ở cuối nhiệm vụ; chưa push.

**Kiểm tra tĩnh/hồi quy:** `npm run lint`, `npm run typecheck`, `npm run build` đạt; build có chunk riêng DashboardPage, còn cảnh báo chunk lớn của ứng dụng (index/HeroScene). `verify:admin-users` 12/12, `verify:profile` 7/7 đạt. E19 cập nhật duy nhất kỳ vọng fallback của test users từ `/admin` sang `/admin/dashboard`; không sửa nghiệp vụ E18. Không thêm dependency.

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
| Chặn CANCELLED qua status của S; xác nhận cancel đồng thời không hoàn tồn lặp | Trước nghiệm thu E4/E5 về quyền/nghiệp vụ | Source 20/11/2026: `/cancel` đã giới hạn đúng trạng thái trong enum hiện tại; quyền `/status` và tính đồng thời còn phải xác nhận với server |
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

### Bàn giao E1 — 19/11/2026

- Người dùng đã nhận hướng dẫn tự học rồi yêu cầu thêm code trực tiếp để review. Đã thêm admin shell responsive tại `/admin`, menu cấu hình và lọc bằng `hasPermission` với role đọc một lần. Chỉ có mục Trang quản trị; chưa thêm menu hoặc whitelist tới các trang nghiệp vụ chưa tồn tại.
- Thêm `admin.access` dùng chung cho guard và redirect; giữ whitelist account/product, query/hash và fallback hiện có. Tái sử dụng guard, session, UserMenu và RouteErrorBoundary. Chưa thêm `user.changeStatus` hay `product.deleteVariant` vì chưa tới mốc sử dụng.
- Sidebar mobile đóng/mở bằng nút có aria-expanded/aria-controls; Escape trả focus về nút, chọn link chuyển focus tới nội dung. Desktop luôn hiện sidebar, Escape trên desktop không chuyển focus tới nút bị ẩn. Có skip link và AdminPageHeader dùng lại cho các trang sau.
- File: sửa `src/app/{router.tsx,layouts/AdminLayout.tsx}`, `src/shared/auth/{permissions,redirect}.ts`, `src/features/admin/pages/AdminHomePage.tsx`; tạo `src/app/routes/AdminRoute.tsx`, `src/features/admin/navigation.ts`, `src/features/admin/components/{AdminSidebar,AdminPageHeader}.tsx`.
- Tách component vào AdminRoute để phù hợp quy tắc Fast Refresh của ESLint; layout và trang chủ admin dùng React.lazy/Suspense. Build tạo riêng chunk AdminLayout khoảng 3,61 kB và AdminHomePage khoảng 0,78 kB; storefront vẫn còn cảnh báo chunk trên 500 kB.
- Contract source đã đối chiếu: SecurityConfig bật method security; controller quản trị áp dụng PreAuthorize, ví dụ AdminOrderController cho A/M/S xem đơn. E1 không thêm API/DTO/schema hoặc query quản trị. Chưa gọi API bằng tài khoản thật.
- Lint, typecheck, build và `verify:profile` (7/7) đạt. Kiểm tra Node tạm thời đạt cho quyền A/M/S, CUSTOMER bị forbidden, guest/token hết hạn tới login, giữ đường dẫn account với ID lớn dạng chuỗi và query/hash, chặn redirect ngoài origin, menu theo quyền và quyền hạn chế của STAFF. Guard/router/session được giả lập ở mức cần thiết; đây không phải kiểm thử trình duyệt hay xác nhận bảo vệ API.
- Cần thử `/admin` với guest/CUSTOMER/STAFF/MANAGER/ADMIN, đăng nhập quay lại, đăng xuất, account routes, mobile/Tab/Enter/Escape, loading và lỗi tải module. Xác nhận Network trên bản preview chỉ tải chunk admin khi vào khu vực quản trị.
- Trạng thái: **đã code, chờ review và kiểm thử browser/backend**. Người dùng yêu cầu lưu commit E1 với nội dung `feat(admin): add role-aware admin shell and navigation`; chưa push. Việc commit không thay thế các ca kiểm thử còn thiếu ở trên.
- Bước tiếp theo: review diff, thử các ca trên và ghi kết quả thực tế; sau đó tiếp tục E2.

### Bàn giao E2 — 19/11/2026

- Người dùng yêu cầu thêm code trực tiếp và hướng dẫn đọc theo flow. Đã thêm `/admin/orders` với GET danh sách admin, tìm kiếm debounce 350 ms, lọc order/payment status, size 10/20/50, sort server `createdAt/totalPrice`, phân trang server. URL giữ bộ lọc, size, page và sort; sửa URL sai trước request, đổi điều kiện về page 1, đưa trang vượt phạm vi về trang cuối theo response.
- DataTable khai báo cột bằng React thuần, có caption/scope/aria-sort, thao tác sort bằng button và cuộn ngang. Chưa thêm TanStack Table/dependency mới. Tái sử dụng Pagination, badge/nhãn trạng thái thuần trình bày, format tiền/ngày, debounce, client và normalizePage hiện có; không dùng query/DTO customer cho API admin.
- File tạo: `src/features/admin/orders/{types,filters,api,queries}.ts`, `src/features/admin/orders/pages/AdminOrdersPage.tsx`, `src/features/admin/components/{DataTable,FilterBar}.tsx`, `scripts/verify-admin-orders.cjs`. File sửa: `src/app/router.tsx`, `src/features/admin/navigation.ts`, `src/shared/api/queryKeys.ts`, `src/shared/auth/redirect.ts`, `package.json`, `phase5.md`.
- Thêm menu Đơn hàng theo quyền `order.view`, whitelist redirect đúng route đã có, fallback đăng nhập STAFF đến `/admin/orders`; giữ ưu tiên đích hợp lệ và query/hash. Route orders lazy-load dưới guard E1. Không thêm link detail khi E3 chưa có.
- Query key theo `admin/userId/role/orders/list/params`, không có token và không giữ dữ liệu trang trước. Query chỉ chạy khi phiên còn hạn/có quyền, URL canonical và hết debounce. Truyền AbortSignal/token đã chụp, kiểm tra phiên trước/sau GET và signal trước khi trả kết quả vào cache. Không sửa lifecycle 401/403/logout hiện có.
- Contract đã đọc lại từ `AdminOrderController`, `OrderListAdminResponse`, `OrderAdminServiceImpl` và `OrderRepository` tại repo backend. Keyword hiện tìm mã đơn/tên khách hoặc người nhận/điện thoại người nhận, không tìm email. List có email null; không gắn nhãn guest từ list. ID giữ string, `orderDate` chỉ là field hiển thị, sort ngày dùng `createdAt`.
- Lint, typecheck và build đạt; build có chunk riêng `AdminOrdersPage` khoảng 8,16 kB. Cảnh báo chunk storefront/HeroScene trên 500 kB còn tồn tại, chưa xử lý trong E2.
- Kết quả kiểm tra tại thời điểm E2: **7/7 đạt**, dùng HTTP/hook giả lập và QueryClient/QueryObserver thật. Bao phủ parse/serialize/params URL, giữ khoảng trắng input và trim request, ID lớn dạng chuỗi/nullable email, normalize Spring Page, key/enabled theo quyền/phiên, đổi user/token/role/logout trước dispatch hoặc sau GET, hủy request tìm kiếm cũ và kết quả sai thứ tự, redirect/deep link theo role. Round trip URL không phải kiểm thử Back/Forward thật trên browser. Script test admin orders và lệnh npm tương ứng đã được khôi phục và mở rộng trong E3.
- Đã giải thích flow đọc và từng file trong chat, gồm ví dụ UI page 2 → API page 1. Checklist browser gồm empty/nhiều trang, query sai, vượt trang, sort tiền, Back/Forward/reload, mạng chậm, 401/403/lỗi refetch, đổi tài khoản, mobile/bàn phím và tải chunk.
- Sau review tự học, đã rút gọn `GetAdminOrdersParams` thành type alias của `AdminOrdersFilters` và đặt nút Xóa bộ lọc cao `h-10` bằng các input/select.
- Chưa chạy browser hoặc API bằng tài khoản thật; chưa xác minh dữ liệu/phân trang/sort thực tế, chuyển trang vượt phạm vi và điều hướng history trên browser. Chưa triển khai E3–E5, chưa sửa backend. E1 vẫn còn kiểm thử theo bàn giao trước.
- Trạng thái: **đã code, kiểm tra tự động đạt; chờ review và kiểm thử browser/backend**. Người dùng yêu cầu lưu commit E2 với nội dung `feat(admin-orders): add searchable paginated order list`; chưa push. Việc commit không thay thế kiểm thử tích hợp còn thiếu.
- Bước tiếp theo: đọc hướng dẫn, chạy ứng dụng với backend, thử checklist và ghi kết quả thực tế; sau đó làm E3 để nối trang chi tiết đơn quản trị.

### Bàn giao E3 — 19/11/2026

- Người dùng yêu cầu triển khai trực tiếp và giải thích flow/từng file/cú pháp. Đã thêm `/admin/orders/:id` lazy-load dưới guard admin; mã đơn trong bảng E2 là Link tới detail. Trang tự GET theo route param nên không phụ thuộc dữ liệu list trong RAM. Whitelist đăng nhập giữ deep link detail hợp lệ, query/hash và quyền A/M/S; CUSTOMER không được quay vào route admin.
- Mở rộng DTO/API/query admin riêng. ID luôn là string, kiểm tra số nguyên dương trong miền Java Long trước GET, kể cả khi refetch thủ công. Key là `admin/userId/role/orders/detail/orderId`; không có token, không giữ dữ liệu đơn trước làm placeholder. Truyền AbortSignal/token đã chụp; kiểm tra user/token/role/hạn token trước GET và sau await trước return vào cache. Tách assertion phiên để list/detail dùng chung, giữ các ca E2 đạt.
- Tách ba component thuần trình bày: AdminOrderRecipient, AdminOrderItems, AdminOrderSummary. Guest dựa trên `userId === null`, tách thông tin tài khoản và người nhận. Dòng đơn giữ tên/SKU/ảnh/giá snapshot, hỗ trợ variant null, không dựng link catalog từ variantId. Các khoản tiền và thành tiền dòng lấy từ server, không tính lại tổng. Trạng thái order/payment độc lập; không tự đặt COD thành PAID theo DELIVERED.
- Hiển thị ngày đặt/cập nhật và ngày hủy/lý do khi có; không suy diễn ngày giao từ updatedAt. Có loading/chờ mạng, ID sai, 403/404, lỗi GET và thử lại. Refetch lỗi thông thường giữ dữ liệu kèm cảnh báo cũ; 403/404 ẩn chi tiết dù từng có cache. Chưa thêm mutation status/hủy E4/E5.
- File chức năng tạo: `src/features/admin/orders/pages/AdminOrderDetailPage.tsx`, `src/features/admin/orders/components/{AdminOrderRecipient,AdminOrderItems,AdminOrderSummary}.tsx`. File sửa: `src/features/admin/orders/{types,api,queries}.ts`, `src/features/admin/orders/pages/AdminOrdersPage.tsx`, `src/app/router.tsx`, `src/shared/auth/redirect.ts`, `scripts/{verify-admin-orders,verify-returns}.cjs`, `phase5.md`. Npm script được khôi phục về cấu hình E2. Không thêm dependency và không sửa backend.
- Contract đã đọc lại từ backend: `AdminOrderController`, `OrderDetailAdminResponse`, `OrderItemResponse`, `OrderAdminServiceImpl`. GET detail cho A/M/S, userId/variantId JSON string hoặc null; service đọc snapshot dòng đơn, hiện chưa gán returnStatus vào builder admin nên không suy diễn trạng thái return từ field này. Đây là đối chiếu source, chưa phải response thật.
- `npm run verify:admin-orders` được khôi phục: **13/13 đạt** (7 ca E2 và 6 ca E3). Mock HTTP/session, QueryClient/QueryObserver thật và ReactDOMServer render HTML. Bao phủ endpoint/token/signal, ID lớn/ID sai/quyền/phiên, đổi phiên trước dispatch/sau GET, chuyển đơn/abort/kết quả về sai thứ tự, redirect detail, guest/user/nullable variant/SKU/ảnh/email, tổng server, loading/offline/403/404/lỗi refetch/ngày hủy/dòng rỗng. Không phải kiểm thử browser hay xác nhận quyền server.
- Toàn bộ 7 bộ kiểm tra hiện có đạt **87/87**. Sửa loader của `verify-returns.cjs` để import tương đối cũng nhận mock theo alias, tránh nạp store thật khi kiểm tra redirect. Không sửa code nghiệp vụ returns. Kiểm tra trên snapshot E3 riêng để các thay đổi E4 đang làm trong workspace không bị đưa vào commit E3.
- Lint, typecheck, build và `git diff --check` đạt. Build tạo chunk AdminOrderDetailPage khoảng **8,30 kB**; cảnh báo chunk storefront/HeroScene trên 500 kB đã tồn tại, chưa xử lý trong E3.
- Flow và cú pháp đã giải thích trong chat. File hướng dẫn riêng vẫn được xóa; bộ test admin orders và npm script tương ứng đã khôi phục theo yêu cầu mới của người dùng.
- Chưa chạy browser/backend thật. Cần thử list → detail → reload/tab mới/Back, guest/user, ID lớn/sai/không tồn tại, 401/403/404 thật, nullable/variant bị xóa, tiền/giảm giá, mạng chậm/đổi phiên, tải lại lỗi, mobile/bàn phím và Network chunk. E1/E2 vẫn giữ các kiểm thử tích hợp còn chờ theo bàn giao trước.
- Trạng thái: **đã code, kiểm tra tự động đạt; chờ review và kiểm thử browser/backend**. Người dùng yêu cầu lưu commit E3 sau khi toàn bộ kiểm tra đạt, với nội dung `feat(admin-orders): show order details and recipient information`; chưa push. Commit không thay thế kiểm thử tích hợp còn thiếu.
- Bước tiếp theo: đọc code chức năng và thử checklist với backend; sau đó làm E4 — cập nhật trạng thái xử lý/giao hàng.

### Bàn giao E4 — 19/11/2026

- Người dùng yêu cầu triển khai trực tiếp, giải thích flow/từng file/cú pháp. Đã thêm hành động xác nhận trên `/admin/orders/:id` cho A/M/S: `PENDING → PROCESSING → SHIPPED → DELIVERED`, mỗi lần một bước. Không expose CANCELLED/RETURN_* trong hành động E4; trạng thái cuối không có nút chuyển tiếp.
- File chức năng tạo: `src/features/admin/orders/orderActions.ts`, `src/features/admin/orders/schemas.ts`, `src/features/admin/orders/components/UpdateOrderStatusDialog.tsx`. File chức năng sửa trong E4: `src/features/admin/orders/api.ts`, `src/features/admin/orders/queries.ts`, `src/features/admin/orders/pages/AdminOrderDetailPage.tsx`. Cập nhật thêm `package.json`, `phase5.md`. Giữ các thay đổi E3 có sẵn; không thêm dependency hoặc sửa backend.
- Đối chiếu lại `AdminOrderController`, `UpdateOrderStatusRequest`, `OrderAdminServiceImpl` và `OrderStatus`: PUT `/api/admin/orders/{id}/status` nhận JSON `{ newStatus }`, trả `OrderDetailAdminResponse`. Backend kiểm tra `canTransitionTo`; nhánh giao hàng chưa tự đổi paymentStatus COD thành PAID. Frontend giữ nguyên trạng thái thanh toán server trả về.
- Dialog chụp user/token/role, trạng thái đang thấy và đích chuyển ngay khi mở. Mutation kiểm tra schema, ID string, quyền, phiên và bảng chuyển; GET mới trước PUT để phát hiện trạng thái đã đổi. Nếu khác thì yêu cầu đóng dialog/chọn lại. GET trước PUT không thay thế kiểm tra đồng thời và phân quyền phía backend.
- Khóa submit bằng ref, pending UI và đếm mutation cùng đơn/phiên. `retry: false`, `networkMode: "always"`, `gcTime: 0`; không xếp hàng PUT tự chạy khi reconnect. Kiểm tra lại phiên sau các await và trước ghi cache/toast. Query/mutation key chứa user/role, không chứa token.
- Thành công hủy GET cũ, ghi detail chuẩn từ PUT rồi invalidate detail/list orders và prefix dashboard/reports cùng user/role (hai module này chưa triển khai). Không optimistic status/payment. GET sau lưu thất bại vẫn giữ kết quả lưu và cảnh báo dữ liệu trên trang, không biến thành yêu cầu gửi lại PUT. Lỗi PUT/timeout tải lại detail bằng GET; dialog yêu cầu kiểm tra/chọn lại, không tự gửi mutation lần hai. 403 hiển thị hướng dẫn cập nhật phiên và khóa hành động trong component hiện tại.
- Kết quả trước khi xóa test admin: E4 **13/13**, E2–E3 **13/13**, returns **12/12**. E4 dùng API/session giả lập, QueryClient/MutationObserver/QueryObserver thật và render HTML: ba bước cho A/M/S, chặn bước nhảy/hủy/trả hàng, ID lớn, key/invalidation theo phiên, trạng thái đã đổi, submit lặp, timeout sau server lưu, offline không replay, đổi phiên trước dispatch/sau GET/sau PUT, lỗi quyền/server, PUT thành công nhưng GET tiếp theo lỗi, trạng thái cuối không có action. Đây là kết quả đã chạy trước đó, không phải kiểm thử browser/backend thật.
- Theo yêu cầu người dùng sau triển khai E4, đã xóa `scripts/verify-admin-order-status.cjs`, `scripts/verify-admin-orders.cjs` và hai npm script tương ứng để tập trung đọc code chức năng. Các bộ kiểm tra của module khác vẫn giữ nguyên; các ghi nhận test admin ở bàn giao E2/E3 là lịch sử, không phải script hiện còn trong repository.
- Cập nhật giao diện ngày 20/11/2026: `UpdateOrderStatusDialog.tsx` hiển thị cặp “Hiện tại → Sau khi xác nhận” trên trang và trong dialog; nút hai dòng nhấn mạnh tên trạng thái đích, có icon theo bước xử lý/giao hàng. Nút xác nhận ghi rõ đích chuyển và có loading; bố cục tự xếp dọc trên màn hình nhỏ, hỗ trợ màu sáng/tối. Đưa tiêu đề ra ngoài hàng flex để nút căn giữa theo phần chuyển trạng thái. Luồng API/mutation giữ nguyên; chưa kiểm tra trực quan trên browser.
- Typecheck (qua `tsc -b` trong build), lint, build và `git diff --check` đạt khi chốt E4 ngày 20/11/2026. Chunk AdminOrderDetailPage khoảng **14,13 kB**; cảnh báo chunk storefront/HeroScene trên 500 kB còn tồn tại.
- Giới hạn backend vẫn còn theo source đã đọc: STAFF có thể gửi CANCELLED trực tiếp qua `/status`; controller/service chưa tách quyền nhánh này. E4 không sửa được gap bằng cách giới hạn UI. Chưa xác nhận dữ liệu DELIVERED thật phục vụ D9/D12.
- Cần thử browser/backend: ba bước và Network payload, xác nhận/đóng bằng bàn phím, nhiều tab thay trạng thái, double click/mạng chậm/offline, timeout, 401/403/404, đổi tài khoản khi request đang chờ, cập nhật list sau Back/reload và payment COD sau DELIVERED. E1–E3 vẫn giữ các mục tích hợp chưa thử.
- Trạng thái: **đã code, kiểm tra tự động đạt; chờ review và kiểm thử browser/backend**. Người dùng yêu cầu lưu commit E4 với nội dung `feat(admin-orders): update fulfillment status with confirmation`; chưa push. Commit không thay thế kiểm thử tích hợp còn thiếu.
- Bước tiếp theo: đọc flow trong chat, thử checklist với backend và ghi kết quả; sau đó tiếp tục E5 — hủy đơn có lý do theo quyền.

### Bàn giao E5 — 20/11/2026

- Người dùng yêu cầu triển khai trực tiếp và giải thích flow/từng file/cú pháp. Đã thêm dialog hủy trên `/admin/orders/:id` cho A/M khi đơn PENDING/PROCESSING; STAFF và đơn ngoài hai trạng thái này không có nút hủy. Quyền được kiểm tra lại trong mutation trước HTTP. Không dùng endpoint `/status` để hủy, không import mutation/schema hủy customer.
- Luồng: nhập lý do → React Hook Form + Zod trim/bắt buộc → chụp user/token/role/trạng thái khi mở dialog → GET mới → kiểm tra trạng thái và phiên → PUT `/api/admin/orders/{id}/cancel` với `{ reason }` → ghi detail từ response → invalidate dữ liệu liên quan → UI render lại. Schema không thêm giới hạn 200 ký tự của customer vì DTO admin hiện chỉ có `@NotBlank`.
- File tạo: `src/features/admin/orders/components/AdminCancelOrderDialog.tsx`. File sửa: `src/features/admin/orders/{types,schemas,orderActions,api,queries}.ts`, `src/features/admin/orders/pages/AdminOrderDetailPage.tsx`, `phase5.md`. Không thêm dependency, route hay sửa backend. Hướng dẫn đọc code trong chat, không tạo file hướng dẫn riêng.
- Tách `useAdminOrderActionContext` nội bộ để E4/E5 dùng chung kiểm tra phiên/quyền, GET mới và khóa mutation theo user/role/order. Mutation key có prefix `admin/userId/role/orders/actions/orderId`, không chứa token. `useIsMutating`, kiểm tra số mutation và ref submit ngăn gửi lặp/hai hành động cùng đơn trong QueryClient hiện tại; không phải khóa giữa hai tab hay phía server.
- Mutation `retry: false`, `networkMode: "always"`, `gcTime: 0`; không xếp hàng PUT tự chạy khi reconnect. Kiểm tra ID string trong miền Java Long và phiên trước dispatch/sau await/trước cache/toast. Response sai ID hoặc chưa xác nhận CANCELLED được coi là kết quả chưa chắc chắn và đọc lại detail.
- Thành công: hủy GET cũ, ghi detail chuẩn từ PUT, invalidate orders/dashboard/reports/inventory/products theo user/role và prefix catalog `products` (gồm list/detail/compare/mốc giá). Prefix của module admin chưa triển khai chỉ đánh dấu cache nếu tồn tại. Không tự cộng kho hoặc đổi paymentStatus ở frontend. PENDING_REFUND hiển thị “Chờ hoàn tiền”, toast không hứa đã hoàn tiền hay thời hạn hoàn; thời gian toast hủy thành công đặt 2 giây theo yêu cầu người dùng.
- Lỗi PUT/timeout: GET lại rồi invalidate để đọc trạng thái và kho/catalog có thể đã thay đổi. Dialog giữ lý do, hiển thị lỗi trường `reason` nếu server trả validationErrors, khóa xác nhận sau lỗi và yêu cầu đóng/kiểm tra lại. Mỗi lần thử tiếp vẫn bắt buộc GET thành công trước PUT; không tự hủy lần hai. PUT thành công nhưng GET sau lưu lỗi vẫn giữ kết quả lưu và cảnh báo dữ liệu trên trang. 403 khóa hành động trong component và hướng dẫn cập nhật phiên.
- Contract đã đọc lại từ source backend: `AdminOrderController`, `CancelOrderRequest`, `OrderAdminServiceImpl`, `OrderStatus`. `/cancel` chỉ A/M, nhận JSON, trả `OrderDetailAdminResponse`; backend hoàn tồn và ghi InventoryHistory, đơn PAID chuyển PENDING_REFUND. Source hiện đã chặn SHIPPED/DELIVERED/CANCELLED/RETURN_* ở `/cancel`, khác ghi chú kế hoạch cũ. Vẫn còn nhánh STAFF hủy qua `/status`; chưa xác minh request đồng thời không hoàn tồn lặp. Đây là đọc source, chưa phải xác nhận API thật.
- Kiểm tra tĩnh: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` đạt. Chunk AdminOrderDetailPage khoảng **18,90 kB**; cảnh báo chunk storefront/HeroScene trên 500 kB vẫn còn.
- Kiểm tra logic tạm thời bằng Node: **20/20 đạt**, dùng HTTP/session giả lập, QueryClient/MutationObserver/QueryObserver thật và SSR. Bao phủ A/M với PENDING/PROCESSING, schema, quyền STAFF ở hook/UI, ID lớn/sai, payment UNPAID/PENDING_REFUND, cache đúng phiên/catalog, trạng thái đổi ở tab khác, đổi phiên trước/sau GET/PUT, timeout sau server lưu, GET thất bại chặn PUT, offline không replay, hai hành động E4/E5 cùng đơn, lưu thành công nhưng refetch lỗi, lỗi field/403 và hồi quy ba bước E4. Script kiểm tra tạm đã xóa sau khi chạy; không khôi phục npm script/test admin đã được bỏ ở E4. `npm run verify:catalog`: **13/13 đạt**. SSR không thay thế kiểm thử tương tác dialog trên browser.
- Chưa chạy browser/backend thật: cần thử A/M/S và 403 trực tiếp, PAID/UNPAID, kiểm tra Network GET → PUT `{ reason }`, trim/lỗi field, double click, focus/Escape/mobile, nhiều tab thay trạng thái, timeout/mạng chậm/offline/đổi tài khoản, Back/list/reload, payment/kho/lịch sử kho và chống hoàn tồn lặp. E1–E4 vẫn giữ các mục tích hợp chưa thử.
- Trạng thái: **đã code, kiểm tra tự động đạt; chờ review và kiểm thử browser/backend**. Người dùng yêu cầu lưu commit E5 với nội dung `feat(admin-orders): cancel eligible orders with a reason`; chưa push. Commit không thay thế kiểm thử tích hợp còn thiếu.
- Bước tiếp theo: đọc code theo thứ tự ở E5, thử checklist với backend và ghi kết quả thực tế; sau đó tiếp tục E6 — quản lý danh mục và upload ảnh.

### Sửa lỗi trạng thái trả hàng giữa customer/admin — 20/11/2026

- Theo yêu cầu sửa code trực tiếp sau khi phát hiện customer có đơn “Yêu cầu trả hàng” nhưng admin không tìm thấy, đã sửa repository backend `../ecommerce-backend`. Đây là phạm vi backend được người dùng yêu cầu riêng sau E5.
- Nguyên nhân trong source: customer dùng `Order.getEffectiveOrderStatus()` và lọc theo yêu cầu trả hàng; admin dùng `orderStatus` lưu trên đơn. Dữ liệu cũ có thể còn DELIVERED dù đã có return PENDING. Response list/detail admin nay dùng cùng trạng thái hiệu lực; query `searchOrdersAdmin` dùng EXISTS với ưu tiên PENDING → APPROVED → REJECTED và fallback trạng thái lưu nếu không có request.
- Bộ lọc chạy trước phân trang và count; không lấy một trang rồi lọc trong Java/frontend. EXISTS tránh lặp dòng khi một đơn có nhiều request. Giữ bộ lọc keyword/payment, sort, ID và đơn guest; không migration hay cập nhật dữ liệu đơn thật.
- File backend sửa: `OrderAdminServiceImpl.java`, `OrderRepository.java`, `OrderAdminServiceImplTest.java`, `pom.xml`; tạo `src/test/java/com/ecommerce/backend/modules/order/repository/OrderRepositoryReturnStatusTest.java`. H2 chỉ có scope test để chạy query Hibernate trên database trong bộ nhớ. Giữ nguyên thay đổi có sẵn của người dùng tại `OrderItemResponse.java`.
- Lệnh kiểm tra với Java 21: `./mvnw.cmd -Dtest=OrderAdminServiceImplTest,OrderRepositoryReturnStatusTest,OrderServiceImplTest,ReturnRequestServiceImplTest test`: **71/71 đạt**, BUILD SUCCESS; gồm 11 ca repository, 16 admin service, 26 customer order service, 18 return service. Bao phủ dữ liệu cũ, mọi bộ lọc trạng thái, ưu tiên nhiều request, phân trang/count/không trùng đơn, keyword/payment/guest/ID và hồi quy hủy/chuyển trạng thái. `git diff --check` đạt. Báo cáo JaCoCo còn cảnh báo execution data cũ không khớp một số class ngoài phạm vi; không dùng số coverage để nghiệm thu.
- Theo yêu cầu sau khi sửa: đã xóa `OrderRepositoryReturnStatusTest.java`, gỡ đúng nhóm `ReturnStatusConsistencyTests` và bốn import vừa thêm trong test service, gỡ dependency H2 vừa thêm. Các test có sẵn giữ nguyên. Các file `.mjs` chuẩn bị bản sửa đã được dọn trước đó. Kết quả 71/71 ở trên là lịch sử trước khi xóa phần kiểm thử bổ sung; code chức năng tại repository/service vẫn giữ nguyên.
- Chưa xác nhận lại API/MySQL/browser đang chạy. Cần khởi động lại backend, tải lại hai phía và kiểm tra cùng mã đơn; admin xóa bộ lọc khác rồi chọn RETURN_REQUESTED. Backend đã commit `1bf59ad` — `fix(admin-orders): align return status filtering and responses`; chưa push. E15 chưa được coi là triển khai.

### Bàn giao E6 — Danh mục và ảnh danh mục — 20/11/2026

- Đã triển khai trực tiếp theo yêu cầu người dùng: `/admin/categories` lazy-load cho ADMIN/MANAGER; menu và đích quay lại sau đăng nhập dùng `category.manage`. STAFF/CUSTOMER bị route guard chặn; query và mutation kiểm tra lại quyền/phiên trước HTTP. Không sửa backend, không thêm dependency, không chạy `gen:api`.
- Danh sách đọc GET public `/api/categories` vào DTO/cache quản trị riêng. Backend source hiện dùng `findAll`/`findByNameContaining`, không lọc ACTIVE, nên quản trị dùng được cả INACTIVE theo contract source. UI tìm theo tên, lọc trạng thái rồi phân trang client trên toàn bộ mảng; không giả tham số page/size trên API. Bộ lọc/page/size giữ trong URL, chuẩn hóa URL sai và đưa trang vượt phạm vi về trang hợp lệ sau khi dữ liệu thay đổi.
- Tạo/sửa bằng React Hook Form + Zod: trim/bắt buộc tên, chọn rõ ACTIVE/INACTIVE, ảnh tùy chọn. POST/PUT `/api/admin/categories[/{id}]` gửi FormData `name`, `status`, `image?`; browser/Axios đặt multipart boundary. Không gửi `imageUrl` thay File và không gửi image khi không chọn file mới; backend giữ ảnh cũ. Không có thao tác xóa riêng ảnh đang lưu vì chưa có API.
- `ImageDropzone` là component chọn/kéo thả một ảnh, dùng validation ảnh hiện có: JPEG/PNG/WebP, đúng MIME/đuôi, không rỗng, tối đa 5 MiB. Chỉ preview File hợp lệ, thu hồi object URL khi thay file/unmount. “Bỏ ảnh mới” bỏ lựa chọn vừa nhập và quay lại preview ảnh server. Backend còn kiểm tra chữ ký file; FE không thay thế bước đó.
- Xóa có dialog xác nhận, hiển thị `totalProducts` của lần tải gần nhất nhưng server quyết định được xóa hay không. DELETE xử lý 204, không đọc body JSON. Trùng tên/lỗi field/server giữ form đang nhập; 403 khóa thao tác trong dialog và hướng dẫn cập nhật phiên. Không tự logout chỉ vì 403.
- Query keys chứa userId/role, không chứa token/File/object URL. Chụp phiên khi mở dialog, kiểm tra trước dispatch/sau await và trước invalidate/toast/đóng dialog. Mutation `retry: false`, `networkMode: "always"`, `gcTime: 0`; khóa submit bằng ref và khóa ghi danh mục theo user/role trong QueryClient hiện tại. Không phải khóa giữa các tab hay chống ghi đè đồng thời trên server.
- Sau mutation thành công: cancel GET cũ và invalidate list category admin/public, admin products, catalog products/detail/compare/mốc giá và brands liên quan. Không chờ GET mới để quyết định kết quả lưu; GET lỗi sau lưu hiển thị cảnh báo dữ liệu cũ và chỉ yêu cầu tải lại. Timeout/5xx/response sai ID được coi là chưa chắc chắn, refetch để đối chiếu và khóa gửi lại trong dialog; người dùng đóng, kiểm tra danh sách trước khi thao tác lại. Không tự POST/PUT/DELETE lại khi reconnect.
- File tạo: `src/features/admin/categories/{types,schemas,api,filters,queries}.ts`, `categories/components/{CategoryFormDialog,DeleteCategoryDialog}.tsx`, `categories/pages/AdminCategoriesPage.tsx`, `src/shared/components/ImageDropzone.tsx`. File sửa: `src/app/router.tsx`, `src/features/admin/navigation.ts`, `src/shared/auth/redirect.ts`, `src/features/admin/components/DataTable.tsx`, `phase5.md`. DataTable nhận sort tùy chọn để dùng được bảng không sort; giữ behavior sort của orders, không gán aria-sort cho cột tĩnh.
- Kiểm tra: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` đạt; `npm run verify:catalog` **13/13 đạt**. Bộ kiểm tra E6 tạm bằng Node **16/16 đạt**, dùng schema/FormData thật, HTTP/session giả lập, QueryClient/MutationObserver/QueryObserver thật và SSR: multipart, ID lớn/sai, lọc trước phân trang, ACTIVE/INACTIVE, quyền, deep link, cache đúng phiên/catalog, hai mutation đồng thời, đổi phiên trước/sau request/cancel GET, timeout/offline không replay, lỗi server/field, lưu thành công nhưng GET lỗi, response sai ID và hồi quy DataTable sort. Script tạm đã được xóa; không thêm npm script/test admin lâu dài.
- Build tách chunk AdminCategoriesPage khoảng **17,20 kB**; cảnh báo chunk storefront/HeroScene trên 500 kB vẫn còn. Chưa kiểm thử browser: tương tác dialog, focus/Escape/mobile, drop/select/bỏ/thay ảnh và cleanup object URL cần thử trực tiếp.
- Backend thật chưa xác nhận: `.env.development` và `application.properties` dùng **8081**; GET `http://localhost:8081/api/categories` bị từ chối kết nối tại thời điểm kiểm tra. Cần chạy backend rồi thử A/M tạo/sửa/xóa, trùng tên, dữ liệu INACTIVE, giữ/thay ảnh, file giả định dạng/quá dung lượng, xóa danh mục trống/còn sản phẩm, Network multipart/204, timeout/đổi phiên và dữ liệu catalog sau lưu. Kiểm tra trực tiếp quyền backend bằng STAFF vẫn cần thực hiện.
- Trạng thái: **đã code, kiểm tra tự động đạt; chờ review và kiểm thử browser/backend**. Người dùng yêu cầu lưu commit E6 với nội dung `feat(admin-categories): manage categories with image uploads`; chưa push. Commit không thay thế kiểm thử tích hợp còn thiếu.
- Bước tiếp theo: đọc flow E6 trong chat, chạy checklist tích hợp trên backend/browser; tiếp tục E7 khi người dùng yêu cầu.
### Bàn giao E7 — Thương hiệu và logo — 20/11/2026

- Đã triển khai `/admin/brands` lazy-load cho ADMIN/MANAGER; thêm menu `brand.manage` và giữ deep link hợp lệ sau đăng nhập. Dùng lại `DataTable`, `FilterBar`, `Pagination`, Base UI Dialog, React Hook Form/Zod và `ImageDropzone` của E6. Giữ các thay đổi E6 có sẵn; không sửa backend, thêm dependency hay chạy `gen:api`.
- Đối chiếu lại source `AdminBrandController`, `BrandController`, `BrandRequest/Response`, `BrandServiceImpl`, `BrandRepository`, `BrandMapper` và `FileValidator`: GET `/api/brands` không truyền categoryId trả mọi trạng thái; nhánh có categoryId chỉ trả thương hiệu ACTIVE gắn sản phẩm ACTIVE nên không dùng cho quản trị. DTO admin riêng có `logo`, `totalProducts`, timestamp và ID string.
- Danh sách lọc tên/trạng thái trước khi phân trang client trên toàn bộ mảng; giữ keyword/status/page/size trong URL, chuẩn hóa giá trị sai và đưa trang vượt phạm vi về trang hợp lệ sau mutation. Không gửi page/size giả tới API.
- Schema tạo bắt buộc File logo; schema sửa cho phép bỏ logo. Form dùng schema theo chế độ và kiểm tra lại schema tạo trước mutation. API parse lại payload trước tạo FormData. POST/PUT `/api/admin/brands[/{id}]` dùng đúng `name`, `status`, `logo?`; không đặt Content-Type thủ công, không gửi URL hay file rỗng thay logo. PUT bỏ part logo giữ logo đang lưu. Không có thao tác xóa riêng logo.
- `ImageDropzone` chỉ thêm prop `required` mặc định false, nhãn/aria-required phù hợp chế độ tạo; form/Zod quyết định validation để người dùng có thể kéo thả file mà không phụ thuộc FileList của input. E6 tiếp tục có ảnh tùy chọn. Dùng lại JPEG/PNG/WebP, MIME/đuôi, file không rỗng và tối đa 5 MiB; preview chỉ cho file hợp lệ, cleanup object URL của E6 giữ nguyên. Backend kiểm tra thêm chữ ký file.
- Form giữ input khi lỗi, map field errors `name/status/logo` và thông báo chung từ server. Xóa có xác nhận, hiển thị số sản phẩm từ lần tải gần nhất; backend quyết định xóa khi còn sản phẩm, DELETE 204 không đọc JSON. 403 chặn gửi tiếp trong dialog và hướng dẫn cập nhật phiên.
- Query/cache chứa userId/role, không chứa token/File/object URL. Chụp phiên mở dialog, kiểm tra quyền/phiên trước dispatch, sau await và trước invalidate/toast/đóng dialog. ID không chuyển Number. Mutation `retry: false`, `networkMode: "always"`, `gcTime: 0`; khóa gửi lặp bằng ref và khóa mutation thương hiệu theo user/role trong QueryClient hiện tại. Không phải khóa giữa nhiều tab hay kiểm soát đồng thời tại server.
- Sau lưu/xóa: cancel GET cũ rồi invalidate brands admin/public (mọi categoryId), admin products và catalog products/detail/compare/mốc giá. GET lỗi sau lưu không biến thành lỗi mutation; hiển thị dữ liệu có thể cũ và chỉ yêu cầu tải lại. Timeout/5xx/response sai ID được coi là kết quả chưa chắc chắn, refetch để đối chiếu và khóa gửi lại trong dialog; không tự replay mutation khi reconnect.
- File tạo: `src/features/admin/brands/{types,schemas,api,queries,filters}.ts`, `brands/components/{BrandFormDialog,DeleteBrandDialog}.tsx`, `brands/pages/AdminBrandsPage.tsx`. File sửa trong E7: `src/app/router.tsx`, `src/features/admin/navigation.ts`, `src/shared/auth/redirect.ts`, `src/shared/components/ImageDropzone.tsx`, `phase5.md`.
- Kiểm tra: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` đạt; `npm run verify:catalog` 13/13 đạt. Script Node tạm E7 18/18 đạt, chạy schema/FormData/API thật với HTTP/session giả lập, QueryClient/MutationObserver/QueryObserver thật và SSR bộ chọn ảnh: logo bắt buộc/tùy chọn, file lỗi, multipart và 204, INACTIVE/lọc trước phân trang/URL, quyền/cache đúng phiên/ID lớn, đổi phiên và abort GET, hai mutation đồng thời, lưu thành công nhưng GET lỗi, offline/timeout không replay, lỗi field/trùng tên giả lập, response sai ID, redirect và nhãn required. Script tạm đã xóa, không thêm bộ test hay npm script lâu dài.
- Build tách chunk AdminBrandsPage khoảng 15,60 kB; cảnh báo chunk storefront/HeroScene trên 500 kB vẫn còn. Chưa kiểm thử browser tương tác thực: dialog/focus/Escape/mobile, kéo thả/chọn/bỏ/thay logo và cleanup object URL cần xác nhận trực tiếp.
- Backend thật: `.env.development` trỏ localhost:8081; kiểm tra TCP cổng 8081 không kết nối được tại thời điểm thực hiện. Chưa xác nhận CRUD/upload/storage và quyền backend đang chạy. Checklist: A/M tạo thiếu/có logo, tên trùng, file giả định dạng/quá dung lượng, sửa không thay/thay logo rồi reload, INACTIVE, xóa thương hiệu trống/còn sản phẩm; kiểm tra Network đúng key logo và DELETE 204, STAFF gọi trực tiếp phải 403, catalog sau mutation, timeout và đổi tài khoản khi đang lưu.
- Trạng thái: đã code, kiểm tra tự động đạt; chờ review và kiểm thử browser/backend. Chưa commit/push. Nội dung commit đề xuất: `feat(admin-brands): manage brands and logo uploads`.
- Bước tiếp theo: đọc flow E7 trong chat, chạy checklist browser/backend; E8 chưa triển khai.

### Bàn giao E8 — Danh sách sản phẩm quản trị — 21/11/2026

- Đã triển khai `/admin/products` lazy-load cho ADMIN/MANAGER/STAFF, thêm menu bằng quyền `product.write` sẵn có và whitelist đích sau đăng nhập, giữ query/hash. Guard admin hiện có chặn guest/CUSTOMER; chưa bật link tạo/sửa khi E9/E10 chưa có route. Giữ các thay đổi E7 và `orders/queries.ts` có sẵn trước nhiệm vụ; không sửa backend, thêm dependency, chạy `gen:api`, commit hoặc push.
- Đọc lại source `AdminProductController`, `AdminProductListResponse`, `Product`, `ProductServiceImpl.getAdminProducts`, `ProductMapper`, category/brand controller và service. GET `/api/admin/products` nhận đúng `keyword, status, categoryId, brandId, page, size, sortBy, direction`; keyword khớp tên hoặc mô tả, không ép ACTIVE. DTO riêng dùng ID string; category/brand/ảnh có thể null. Mapper hiện cộng tồn và đếm tất cả variants, bao gồm INACTIVE; UI ghi rõ ý nghĩa, không tự tính lại.
- File mới: `src/features/admin/products/{types,filters,api,queries}.ts`, `products/pages/AdminProductsPage.tsx`. File nối E8: `src/app/router.tsx`, `src/features/admin/navigation.ts`, `src/shared/auth/redirect.ts`, `phase5.md`. Ngoài phạm vi nghiệp vụ E8 chỉ thêm comment trong catch rỗng có sẵn ở `categories/components/DeleteCategoryDialog.tsx` để sửa lỗi lint `no-empty`, không đổi hành vi.
- URL giữ keyword/status/categoryId/brandId/page/size/sort/direction, chuẩn hóa giá trị sai; API page=URL page−1. Debounce tên 350 ms, đổi filter/size/sort về trang đầu, GET thành công phát hiện trang vượt phạm vi thì replace về trang cuối. Size 10/20/50; whitelist sort `createdAt`, `name`, `basePrice` đều là field entity. Tổng tồn/số variant không có nút sort. ID dùng `isPositiveLongId`, không chuyển Number; page được giới hạn để offset với size tối đa vẫn nằm trong int backend.
- Bộ lọc tham chiếu dùng lại hàm API E6/E7 nhưng query riêng với quyền sản phẩm, để STAFF xem được dù không có quyền quản lý category/brand. GET brands lấy toàn bộ mảng, không truyền categoryId làm mất brand INACTIVE. Hiển thị lựa chọn INACTIVE; giữ ID hợp lệ chưa xuất hiện trong lựa chọn bằng option tạm, không tự xóa filter khi tải lỗi hoặc tham chiếu đã mất. Từng GET có loading/error/thử lại riêng, không chặn list khi GET tham chiếu lỗi.
- Query keys có userId/role, không token. Ba query nằm dưới `admin/userId/role/products` nên invalidation products E6/E7 làm mới cả list và lựa chọn. Kiểm tra đúng phiên/quyền/hạn token trước dispatch và sau await; truyền AbortSignal, kiểm tra abort trước/sau đọc, không ghi response cũ vào cache sau đổi phiên. `retry: false`; không dùng placeholderData của trang/phiên khác.
- Bảng tái sử dụng `DataTable`, `StatusBadge`, `Pagination`, format tiền/ngày; ảnh null/lỗi có fallback. Có loading, empty, lỗi lần đầu và lỗi refetch kèm cảnh báo dữ liệu cũ. Giữ filter khi lỗi; backend tiếp tục kiểm tra quyền cuối cùng.
- Đã bổ sung hướng dẫn tự học 8 bước ngay dưới mục E8: vai trò từng file, thứ tự đọc, flow từ URL đến backend/cache/UI, ví dụ URL, giải thích interface/type/union/generic/type predicate/destructuring/spread/optional chaining/nullish coalescing/hooks/JSX/controlled input và câu hỏi kiểm tra sau từng bước.
- Kiểm tra: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` đạt. `npm run verify:catalog` 13/13 đạt. Script Node tạm E8 17/17 đạt: parser/whitelist/status/ID lớn, page mapping, API và Spring Page thật qua HTTP giả lập, quyền A/M/S/CUSTOMER, reference INACTIVE, phiên thiếu/hết hạn/đổi trước và sau request, abort, QueryClient cache/invalidation thật, SSR/handler của page cho null relation, ảnh fallback, filter reset, URL/debounce/page correction, loading/empty/error/stale, không có link E9/E10, deep link. Script tạm đã xóa; không thêm bộ test/CI hoặc npm script lâu dài. Các kiểm tra giả lập không chứng minh quyền server hoặc hành vi browser thực.
- Build có chunk `AdminProductsPage` khoảng 10,80 kB; cảnh báo storefront/HeroScene trên 500 kB vẫn còn. Backend `127.0.0.1:8081` không kết nối được khi kiểm tra TCP, `.env.development` vẫn trỏ origin 8081. Chưa kiểm thử tích hợp backend/browser; không đánh dấu nghiệm thu E8 hoàn toàn.
- Checklist tiếp theo: chạy backend và frontend; thử A/M/S với cả ba status, phối hợp tên/category/brand, INACTIVE, null/ID tham chiếu đã mất, sort ba cột, reset trang, Back/Forward/reload/deep link, trang rỗng/vượt phạm vi, ảnh hỏng, mobile/bàn phím, 403/lỗi mạng/refetch lỗi và đổi tài khoản khi đang GET. Network phải gọi admin products, đúng params/page từ 0, không sort totalStock/variantCount; thử CUSTOMER gọi trực tiếp endpoint để xác nhận quyền backend.
- Trạng thái: **đã code, kiểm tra tự động đạt; chờ review và kiểm thử browser/backend**. Chưa commit/push. Nội dung commit đề xuất: `feat(admin-products): list products with server-side filters`. Sau nghiệm thu E8, tiếp tục E9 khi người dùng yêu cầu.

### Bàn giao E9 — Tạo sản phẩm, thông số và biến thể — 21/11/2026

- Đã triển khai `/admin/products/new` lazy-load cho ADMIN/MANAGER/STAFF, thêm link tạo ở danh sách E8 và whitelist redirect sau login. Tạo thông tin chung, thông số, ít nhất một biến thể thủ công, thuộc tính từng variant và nhiều ảnh tùy chọn. Giữ các thay đổi E7/E8 có sẵn; không sửa backend, thêm dependency, chạy `gen:api`, commit hoặc push.
- File mới: `src/features/admin/products/schemas.ts`, `buildCreateProductRequest.ts`, `components/{ProductForm,ProductField,SpecificationEditor,VariantFields,ProductImagesField}.tsx`, `pages/AdminCreateProductPage.tsx`, `scripts/verify-admin-product-create.cjs`. Mở rộng `products/{types,api,queries}.ts`, `pages/AdminProductsPage.tsx`, `src/app/router.tsx`, `src/shared/auth/redirect.ts` và tài liệu này.
- Đọc lại source `AdminProductController`, `AdminProductRequest`, `AdminProductVariantRequest`, `ProductServiceImpl.createProduct`, entity Product/ProductVariant, `FileValidator` và cấu hình multipart. Request đúng POST multipart: một part `data` là chuỗi JSON; nhiều part `images` nếu có, browser/Axios tạo boundary. Thành công trả text, về danh sách; không suy đoán ID để mở detail/edit. Axios đọc mặc định để text thành công và JSON lỗi cùng hoạt động; test HTTP đã phát hiện và ngăn việc ép `responseType: "text"` làm mất message/fieldErrors của lỗi JSON.
- React Hook Form/Zod kiểm tra tên/category, ID Long dạng string, tiền không âm/hữu hạn/trong giới hạn số JS, stock nguyên không âm/an toàn, SKU không trống/trùng sau trim và không phân biệt hoa/thường trong cùng form, key/value không trống và key không trùng trong từng nhóm. Thông số/thuộc tính giữ dạng mảng khi nhập, chuyển sang object khi gửi. Brand không chọn gửi null; không gửi status vì backend đặt ACTIVE. Dữ liệu nhập còn nguyên khi lỗi; refetch lựa chọn không reset form, ID tham chiếu đã mất có option tạm để không làm sai giá trị đang chọn.
- Ảnh dùng lại schema dùng chung E6/E7, không sửa ImageDropzone một ảnh: kiểm tra extension/MIME/dung lượng, chọn nhiều lần và bỏ từng ảnh, preview file hợp lệ, cleanup object URL khi file đổi/unmount. Chưa kiểm tra chữ ký nội dung ở FE; backend chịu trách nhiệm FileValidator và storage. Cấu hình backend hiện tối đa 5 MiB/file và 30 MB/toàn request.
- Mutation `retry: false`, `networkMode: "always"`, `gcTime: 0`; ref khóa submit, trạng thái pending dùng chung phiên và kiểm tra đồng thời tại mutation. Kiểm tra snapshot user/token/role trước/sau request và trước side effect; response cũ không toast/cache/navigate cho phiên mới. Không navigate hoặc gắn lỗi form khi đã rời page. Timeout/mất mạng/408/5xx khóa POST tiếp, yêu cầu kiểm tra danh sách trước; không tự replay khi reconnect. 403 giữ lỗi quyền; 404 cho sửa tham chiếu và thử lại sau khi kiểm tra.
- Thành công cancel/invalidate products/inventory/categories/brands admin đúng user/role và public products/categories/brands. Refresh GET chạy riêng; lỗi GET không biến POST thành thất bại, không gợi ý tạo lại. Không lưu File/token/object URL vào query key hoặc Zustand persist.
- Hướng dẫn 13 bước ngay trong mục E9 giải thích từng file, thứ tự đọc và flow từ JSX/form/schema tới DTO/multipart/backend/cache/UI; có cú pháp TypeScript/React, payload hai variant, thao tác kiểm tra và câu hỏi tự học từng bước.
- Kiểm tra tự động: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` đạt. `node --test scripts/verify-admin-product-create.cjs` **16/16 đạt**: schema nested, ID lớn, số/stock, SKU/key trùng, ảnh sai, DTO/FormData, Axios multipart thật qua HTTP giả lập và lỗi JSON, snapshot/quyền, hai mutation đồng thời, đổi phiên trong POST, cache thật với refetch lỗi, offline/timeout không replay, SSR form và deep link. `npm run verify:catalog` **13/13 đạt**. Bộ kiểm tra E9 được giữ lại để chạy hồi quy; không thêm framework/CI/npm script mới.
- Backend dev `127.0.0.1:8081` kết nối được: GET `/api/categories`, `/api/brands` trả **200**; GET `/api/admin/products` chưa đăng nhập trả **401**. Đây là kiểm tra chỉ đọc, chưa chứng minh quyền A/M/S, POST tạo mới, inventory hoặc storage. Chưa kiểm thử browser tương tác và POST có đăng nhập trên backend thật; không đánh dấu nghiệm thu đầy đủ. Build vẫn có cảnh báo chunk storefront/HeroScene trên 500 kB đã có từ trước.
- Checklist tiếp theo: đăng nhập lần lượt A/M/S, tạo sản phẩm hai variant với ảnh thật, xem request multipart và reload list/catalog; thử category bị xóa, SKU đã tồn tại, file giả nội dung/quá dung lượng/tổng request lớn, thêm/xóa variant giữa với thuộc tính, bỏ/thay/chọn lại ảnh, bàn phím/mobile/focus, gửi lặp, lỗi GET sau thành công, timeout và đổi tài khoản/rời page khi POST chậm. CUSTOMER phải bị chặn route/API. Backend vẫn cần cưỡng chế validation create và xác định chính sách SKU; FE không thay thế chúng. Không tự gửi POST lần nữa nếu kết quả trước chưa rõ.
- Trạng thái E9: **đã code, kiểm tra tự động đạt; chờ review và kiểm thử nghiệp vụ browser/backend có đăng nhập**. Chưa commit/push. Nội dung commit đề xuất: `feat(admin-products): create products with specifications and variants`. Phần E10 tiếp nối được ghi trong bàn giao bên dưới.

### Bàn giao E10 — Sửa thông tin chung không gửi tồn kho — 21/11/2026

- Đã thêm `/admin/products/:id/edit` lazy-load cho ADMIN/MANAGER/STAFF, link từ tên sản phẩm trong list và whitelist deep link sau login giữ query/hash. Tải detail admin, sửa tên/category/brand/giá cơ bản/mô tả/specification. Variant đã lưu hiện SKU/ID/giá/stock/attributes/trạng thái ở chế độ chỉ xem. Không thêm variant mới, quản lý ảnh hoặc đổi status ở E10.
- Đối chiếu lại `AdminProductController`, `AdminProductRequest`, `AdminProductDetailResponse`, `VariantResponse`, `ProductImageDetailResponse`, `ProductMapper` và `ProductServiceImpl.updateProduct` trong backend tham chiếu. PUT nhận JSON, trả text; `variants` không có hoặc null thì service bỏ qua nhánh sửa variant/inventory. Builder chỉ gửi sáu field thông tin chung; DTO `variants?: never` và builder allowlist cùng chặn gửi stock snapshot. Không sửa repository backend.
- File mới: `src/features/admin/products/editProduct.ts`, `components/{EditProductForm,EditSpecificationEditor,SavedProductVariants}.tsx`, `pages/EditProductPage.tsx`, `scripts/verify-admin-product-edit.cjs`. Mở rộng `products/{types,api,queries}.ts`, generic của `components/ProductField.tsx`, link trong `pages/AdminProductsPage.tsx`, `src/app/router.tsx`, `src/shared/auth/redirect.ts` và tài liệu này. Giữ code E9 và các thay đổi người dùng đã có. Chỉ thêm comment cho catch rỗng có sẵn trong `brands/components/DeleteBrandDialog.tsx` để lint đạt, không đổi xử lý lỗi.
- Schema sửa dùng validation metadata E9 mà không yêu cầu variants/images. Giữ ID Long dưới dạng string, brand rỗng gửi null, parse giá sau validate. Specification có chế độ text/JSON để không biến number/boolean/null/array/object có sẵn thành chuỗi; validate JSON/key trùng và lỗi đúng dòng. Brand/category INACTIVE và ID tham chiếu chưa tải được có option giữ nguyên lựa chọn.
- Form chỉ reset theo refetch khi sạch; không reset bản nháp dirty, đang submit hoặc chờ GET sau lưu. PUT thành công được thông báo riêng, GET detail chạy tiếp; GET lỗi giữ form và trạng thái đã lưu, chỉ cho thử GET lại. Timeout/mất mạng/408/5xx khóa gửi lại cho đến khi tải dữ liệu server để kiểm tra; nói rõ thao tác kiểm tra sẽ thay draft. 400 map field errors; 403 khóa quyền; 404 phân biệt bằng GET sản phẩm và cho sửa tham chiếu nếu còn sản phẩm.
- Query key gồm user/role/id; mutation `retry: false`, `networkMode: "always"`, `gcTime: 0`, ref khóa submit và kiểm tra pending cùng sản phẩm trong QueryClient. Snapshot user/token/role được kiểm tra trước/sau request và trước side effect; không reset form sau unmount/đổi phiên. Cancel GET cũ rồi đánh dấu stale products admin/public, inventory của phiên, cart và wishlist; không để lỗi refetch biến PUT thành thất bại, không replay khi reconnect. Không khóa giao dịch giữa hai tab; metadata chung vẫn có thể ghi đè nhau nếu hai người sửa đồng thời, do backend chưa có version/If-Match.
- Hướng dẫn 12 bước tại mục E10 giải thích từng file và thứ tự đọc, vai trò React/RHF/Zod/Query/Axios/backend, cú pháp TypeScript/JSX, schema/defaults/payload, lifecycle form/cache, request mẫu, kiểm tra nhanh và bài tập. Không thêm thư viện, không chạy `gen:api`, không commit/push.
- Kiểm tra: `npm run typecheck`, `npm run lint`, `npm run build`, `git diff --check` đạt. `node --test scripts/verify-admin-product-edit.cjs scripts/verify-admin-product-create.cjs` **28/28 đạt** (E10 12 + E9 16); `npm run verify:catalog` **13/13 đạt**. HTTP loopback giả lập đã xác nhận stock 3 → tab khác đổi 29 → PUT metadata không có variants → stock giữ 29; đây không phải bằng chứng tích hợp backend/JPA thật. Kiểm tra thêm GET/PUT JSON/text và lỗi field, ID lớn, typed specification, cache/abort/đổi phiên, submit đồng thời, offline không replay, SSR các trạng thái trang và handler giữ dirty/PUT thành công GET lỗi. Harness handler mô phỏng hook, chưa phải tương tác DOM/browser. Lần chạy trong sandbox bị chặn loopback; chạy lại với quyền cho HTTP test cục bộ đạt. Build còn cảnh báo chunk storefront/HeroScene trên 500 kB có sẵn.
- Còn cần: kiểm thử browser và GET/PUT có đăng nhập trên backend thật; thử A/M/S/CUSTOMER, metadata và kho đồng thời, brand null, relation bị xóa, dữ liệu null/INACTIVE, network/403/404, mobile/bàn phím, rời trang/đổi tài khoản khi request chậm. Sửa giá/attributes/SKU của variant cũ vẫn **chưa triển khai** vì cần API backend định danh variant ổn định và tách metadata khỏi tồn; không giải quyết bằng readonly stock/refetch snapshot.
- Trạng thái: **đã code phần thông tin chung, kiểm tra tự động đạt; chờ review và kiểm thử nghiệp vụ browser/backend**. Phần metadata variant cũ còn phụ thuộc backend, không đánh dấu E10 đầy đủ hoặc Phase 5 hoàn thành. Commit đề xuất: `feat(admin-products): edit product metadata without overwriting inventory`.

### Bàn giao E11 — Quản lý ảnh sản phẩm — 22/11/2026

- Đã thêm khu ảnh trên `/admin/products/:id/edit` cho ADMIN/MANAGER/STAFF: xem ảnh server, chọn nhiều file và preview, bỏ file local, upload, xác nhận xóa từng ảnh và chọn primary. Dùng đúng field `isPrimary`, fallback URL thiếu/lỗi, hỗ trợ images null. Không thêm reorder hoặc sửa ảnh variant. Giữ thay đổi có sẵn trong `src/features/admin/orders/queries.ts`; không sửa backend, thêm dependency, chạy gen:api, commit hoặc push.
- Đối chiếu source `AdminProductController`, `ProductServiceImpl`, `ProductImageDetailResponse`, `ProductMapper`, `FileValidator` và giới hạn multipart. POST `/{id}/images` multipart lặp key images; DELETE `/{id}/images/{imageId}`; PATCH `/{id}/images/{imageId}/primary`, dưới `/api/admin/products`; response text. ID luôn string, validate Long trước dispatch. Backend giới hạn 5 MiB/file, 30 MB/request; FE giới hạn tổng file dưới 29 MiB để chừa multipart, dùng lại schema extension/MIME/size; chữ ký nội dung do backend kiểm tra.
- File mới: `products/productImages.ts`, `products/imageQueries.ts`, `products/components/ProductImageManager.tsx`, `scripts/verify-admin-product-images.cjs`, `docs/e11-product-images-guide.md`. Mở rộng `products/api.ts`, `products/pages/EditProductPage.tsx`, thêm mock component ảnh trong test trang E10, cập nhật kế hoạch. Hướng dẫn có thứ tự đọc, flow, từng file/hàm, ví dụ API, giải thích TypeScript/React/JSX, bài tập và checklist.
- Mutation khóa chung các hành động ảnh cùng sản phẩm trong QueryClient; ref chặn click lặp trước render. `retry: false`, `networkMode: "always"`, `gcTime: 0`; snapshot phiên kiểm tra trước/sau request và trước side effect. Response muộn sau đổi tài khoản không ghi cache/UI. Cancel GET cũ, invalidate products admin đúng user/role và public products/cart/wishlist; không optimistic, không đoán imageId/primary mới. GET detail chạy riêng sau ghi thành công; lỗi GET giữ thông báo đã lưu và chỉ cho thử GET lại. Timeout/mất mạng/408/5xx/404 yêu cầu GET kiểm tra trước thao tác tiếp, file local còn nguyên nếu POST chưa rõ kết quả; người dùng cần bỏ file đã có trên server trước upload tiếp. 403 khóa ghi. Preview object URL thu hồi khi đổi file/unmount; không persist File/token/URL trong query key.
- Form metadata E10 nằm riêng và giữ dirty draft khi detail refetch. Xóa primary để server quyết định ảnh còn lại; upload khi đã có ảnh nhưng không có primary hiện chưa bảo đảm service tự chọn primary, UI không tự sửa cờ. Khóa frontend không bảo vệ ghi đồng thời giữa hai tab; chưa xác minh lifecycle file storage/rollback upload lỗi. Không khẳng định frontend giải quyết những giới hạn backend này.
- Kiểm tra: typecheck, lint, build và `git diff --check` đạt; E9/E10/E11 **37/37** đạt (16 + 12 + 9). E11 kiểm tra schema/FormData/API method/path/token/Long ID, khóa mutation/cache thật, đổi phiên/offline, SSR và handler thực qua hook harness: double click, xác nhận xóa, timeout/404, POST thành công GET lỗi, GET lại không replay POST, chọn nhiều lần và xóa local sau upload. Lần đầu test hồi quy HTTP bị sandbox chặn loopback; chạy lại với quyền HTTP cục bộ đạt. Test trang E10 cần mock component ảnh mới và đã cập nhật. Không coi harness/SSR/API giả lập là browser hoặc backend thật. Build vẫn có cảnh báo chunk storefront/HeroScene trên 500 kB đã có từ trước.
- Chưa thử POST/DELETE/PATCH có đăng nhập trên backend thật hoặc tương tác browser. Checklist: A/M/S/CUSTOMER, ảnh thật/giả nội dung/tổng request lớn, xóa primary/cuối cùng/ảnh đã mất ở tab khác, primary rồi reload/catalog/cart/wishlist, ảnh hỏng/mobile/bàn phím, giữ draft, 403/404/network, request chậm rồi logout/đổi phiên/rời trang. Trạng thái: **đã code và kiểm tra tự động, chờ review và kiểm thử tích hợp có đăng nhập**.
- Commit đề xuất: `feat(admin-products): manage product images and primary selection`.
- Hồi quy catalog: `npm run verify:catalog` **13/13** đạt.

### Bàn giao E12 — Trạng thái sản phẩm và ngừng bán biến thể — 22/11/2026

- Cập nhật giao diện 24/11/2026: bỏ khối trạng thái riêng, bấm trực tiếp badge có mũi tên trong thanh thông tin đầu trang để mở/đóng danh sách trạng thái bên dưới badge; chọn trạng thái mới là gửi PATCH ngay, không có nút Cập nhật hay xác nhận đổi trạng thái. Chọn trạng thái hiện tại không gửi lại request. Popover dùng Base UI có sẵn, hỗ trợ đóng khi bấm ngoài/Escape và quản lý focus. Badge/dropdown/nút cùng chiều cao, có hover/focus và hỗ trợ bàn phím; STAFF vẫn chỉ xem badge. Danh sách ghi rõ trạng thái áp dụng cho tất cả biến thể. Xác nhận ngừng bán và phản hồi nằm ngay tại biến thể đang chọn. Giữ khóa mutation/phiên/cache; hồi quy E10 12/12 và E12 8/8 đạt ở bước thu gọn bố cục. Không tạo lại file hướng dẫn E12.
- Đã thêm ProductStatusAction và DeactivateVariantAction tại `/admin/products/:id/edit`, điều phối bằng ProductLifecycleManager. ADMIN/MANAGER chọn ACTIVE/INACTIVE/HIDDEN để lưu ngay; ngừng bán từng variant vẫn có xác nhận riêng; STAFF chỉ xem phần trạng thái/biến thể. Quyền product.deactivateVariant tách riêng; mutation kiểm tra quyền trước dispatch. Vùng xác nhận nhận focus khi chọn thao tác, thông báo status/alert và nút disabled khi bận.
- Contract đối chiếu AdminProductController/ProductServiceImpl: PATCH `/{id}/status?status=...`, DELETE `/{id}/variants/{variantId}`, response text, hai endpoint có PreAuthorize A/M. Đổi status áp dụng cả product và mọi variant, chuyển ACTIVE có thể bật lại variant INACTIVE; UI cảnh báo rõ. DELETE chỉ set INACTIVE, giữ ID. Không thêm xóa cứng hay nút khôi phục variant. Không sửa backend.
- Thêm ProductLifecycleAction trong types.ts (discriminated union), API và lifecycleQueries.ts; mở rộng SavedProductVariants bằng renderAction tùy chọn và tích hợp vào EditProductPage. Tái sử dụng GET detail, session snapshot, Long ID string, error/client và badge. Giữ nguyên thay đổi có sẵn trong admin/orders/queries.ts; không thêm dependency/gen:api/commit/push.
- Khóa chung status và deactivate variant theo product/user/role trong QueryClient, ref chặn double click trước render. Không optimistic, retry false, networkMode always, gcTime 0; kiểm tra phiên trước/sau request và trước cache/UI. Cancel GET cũ rồi invalidate products admin đúng phiên, inventory/dashboard, public products (gồm detail/compare), cart/wishlist. GET detail riêng sau khi báo ghi thành công; GET lỗi giữ thông báo đã lưu và chỉ GET lại, không replay mutation. Timeout/408/5xx/400/404 yêu cầu GET đối chiếu; 403 khóa ghi để cập nhật phiên. Khóa frontend không bảo vệ giữa nhiều tab/tài khoản.
- Cart đã đăng nhập dùng cờ không khả dụng từ backend; OrderItems hiển thị snapshot, SKU/ảnh có fallback. Guest cart vẫn là snapshot cục bộ, không tự đồng bộ trạng thái bán qua invalidate cache; checkout/backend phải kiểm tra lại. Cần thử cart/order thật trước khi nghiệm thu E12.
- Kiểm tra: typecheck/lint/build, git diff --check đạt. E9–E12 45/45 (16 + 12 + 9 + 8), catalog 13/13, checkout 24/24 đạt. Hai HTTP loopback test E9/E10 ban đầu bị sandbox chặn kết nối; chạy lại với quyền HTTP local đạt. E12 dùng API/Query/handler harness và SSR, không phải browser E2E hoặc request đăng nhập backend thật. Build vẫn cảnh báo chunk storefront/HeroScene trên 500 kB có trước.
- Còn cần: browser/backend với A/M/S/CUSTOMER, STAFF gọi trực tiếp endpoint nhận 403, status cascade và reload/public, variant ở cart/đơn cũ, hai tab đổi đồng thời, 400/403/404/network, ghi thành công GET lỗi, request chậm rồi logout/đổi phiên/rời trang, giữ dirty draft E10, mobile/bàn phím/focus. Trạng thái: đã code và kiểm tra tự động, chờ review và tích hợp có đăng nhập; không đánh dấu toàn Phase 5 hoàn thành.
- Commit đề xuất: `feat(admin-products): control product visibility and deactivate variants`.

### Bàn giao E12b — Bán lại và thẻ biến thể — 24/11/2026

- Đã bổ sung Bán lại cho biến thể INACTIVE/HIDDEN cũ trên trang edit, chỉ ADMIN/MANAGER; ACTIVE có nút Ngừng bán. Mỗi hành động có xác nhận tại thẻ, ref chặn click lặp và khóa chung lifecycle, snapshot phiên trước/sau request. GET detail sau ghi; lỗi đọc không tự phát lại PATCH/DELETE; timeout/404 yêu cầu đọc lại. Giữ lựa chọn đổi trạng thái sản phẩm một lần bấm và không hiển thị thông báo đã lưu ở badge.
- Backend thêm PATCH `/api/admin/products/{id}/variants/{variantId}/status?status=ACTIVE`, method security A/M, response text; service nhận ACTIVE/INACTIVE, validate thuộc product, giữ nguyên ID/SKU/giá/attributes/kho. No-op không đổi timestamp; status thực sự đổi mới cập nhật product.updatedAt. DELETE cũ dùng chung logic INACTIVE. ProductServiceImpl.changeProductStatus không còn ghi đè status các variant; cart/checkout vẫn kiểm tra cả parent và variant. Bán lại variant không bật parent; UI nêu rõ khi parent ẩn/ngừng bán.
- Thẻ mới có ảnh riêng/ảnh sản phẩm dự phòng/icon khi ảnh thiếu hoặc hỏng, SKU dễ đọc, badge trạng thái, ô giá/tồn riêng, thuộc tính dạng nhãn, ID phụ và nút hành động. Header có số lượng variant bật bán và tổng tồn. Số đếm bật bán không có nghĩa toàn bộ variant mua được khi tồn 0/parent không ACTIVE. Không thêm sửa giá/SKU/stock metadata vào E10.
- Frontend mở rộng types/api/lifecycleQueries/permissions, thêm ReactivateVariantAction, cập nhật manager/thẻ/nút ngừng bán và dòng mô tả trong popover product status. Backend sửa controller/interface/service, cập nhật assertion cascade cũ trong ProductServiceImplTest và thêm ProductVariantStatusServiceTest. Không thêm thư viện, gen:api, guide E12, commit/push; giữ thay đổi ngoài nhiệm vụ trong hai repository.
- Kiểm tra: typecheck/lint/build và git diff --check đạt. E9–E12b 47/47 (16 + 12 + 9 + 10), catalog 13/13. Backend JDK21/Maven wrapper: product 35 + variant status 8 = 43/43, cart 30 + order 26 = 56/56; tổng 99/99. Maven còn cảnh báo Mockito dynamic agent và JaCoCo execution data cũ không khớp; unit tests đạt, không dùng coverage đó để kết luận độ bao phủ. Build frontend vẫn có cảnh báo chunk lớn đã có trước.
- Đã xem preview SSR của component thật với dữ liệu mẫu trên browser ở giao diện sáng/tối và iframe rộng 390px, có SKU dài/ảnh thiếu/tồn 0; đây là kiểm tra bố cục, không phải thao tác API có đăng nhập. Server/script preview tạm đã dừng và xóa. Unit test kiểm tra giữ nguyên giá/kho/ID, status độc lập, timestamp/no-op, variant thuộc sản phẩm khác, legacy HIDDEN, permission FE, cache/đổi phiên, click lặp và GET lỗi.
- Chưa kiểm thử API mới có đăng nhập trên backend đang chạy hoặc tranh chấp giữa nhiều tab; cần khởi động lại backend rồi thử A/M/S, ngừng bán → bán lại → reload → cart/catalog/đơn cũ. Variant INACTIVE/HIDDEN do cascade cũ vẫn giữ nguyên, dùng Bán lại từng biến thể khi cần; không chạy migration tự bật hàng loạt. Backend chưa bổ sung version/lock cho hai admin ghi đồng thời. Trạng thái: đã code, kiểm tra tự động và preview bố cục; chờ tích hợp có đăng nhập.
- Commit frontend đề xuất: `feat(admin-products): reactivate variants and refine variant cards`.
- Commit backend đề xuất: `feat(products): manage variant status independently from product visibility`.

### Điều chỉnh form thông số kỹ thuật — 24/11/2026

- Theo yêu cầu đơn giản hóa giao diện, bỏ lựa chọn Văn bản/JSON ở EditSpecificationEditor; chỉ giữ tên và giá trị văn bản. Thay thế hướng dẫn chọn format text/json trước đây của E10. Form tạo mới vẫn dùng chuỗi như cũ.
- editProduct.ts giữ snapshot nội bộ cho giá trị cũ không phải string: giữ nguyên kiểu nếu tên và nội dung không đổi; dòng mới, đổi tên hoặc đổi giá trị được gửi dạng string, không tự parse nội dung người dùng thành JSON. Snapshot không được gửi lên API. Xóa dòng vẫn xóa thông số, sắp xếp dòng không làm đổi kiểu dữ liệu cũ. Không sửa backend hoặc di chuyển dữ liệu database.
- Đã cập nhật kiểm tra E10: 12/12 đạt, gồm round trip số/boolean/null/mảng/object, giá trị văn bản không phải JSON, chỉnh sửa/đổi tên/xóa và thứ tự dòng; UI không còn select kiểu giá trị. Chưa kiểm thử tương tác form với backend có đăng nhập.
- Commit đề xuất: `refactor(admin-products): simplify specification inputs to text`.
- Giao diện thông số được đồng bộ qua SpecificationEditorLayout giữa trang tạo, trang sửa và thuộc tính biến thể: tiêu đề/icon/số lượng, trạng thái rỗng, dòng có số thứ tự, tên–giá trị căn hàng, nút xóa biểu tượng có nhãn và nút thêm viền nét đứt. Responsive xếp dọc trên mobile; ô giá trị trang sửa giữ textarea một dòng có thể mở rộng. ProductField thêm placeholder/rows tùy chọn, mặc định trường khác giữ nguyên. Hồi quy tạo/sửa 28/28 đạt.

### Bàn giao E13 — Danh sách tồn kho và bộ lọc — 24/11/2026

- Đã thêm `/admin/inventory` lazy-load, menu Tồn kho và whitelist redirect giữ query sau login cho A/M/S. Hiển thị sản phẩm/link sửa, SKU, inventoryId/variantId/productId riêng biệt, số tồn, status server và ngày cập nhật. E14 adjust/history chưa triển khai. Không sửa backend, thêm dependency, gen:api, commit/push; giữ nguyên thay đổi có sẵn trong `admin/orders/queries.ts`.
- Đối chiếu source AdminInventoryController, InventoryResponse, InventoryServiceImpl, InventoryRepository và InventoryMapper. GET trả mảng, nhận keyword/status/minQuantity/maxQuantity; phát hiện keyword chỉ tìm tên tại repository. Frontend chủ động không gửi keyword, lọc OR SKU/tên trên toàn bộ mảng server đã lọc status/kho trước sort và slice. Không gửi page/size/sort giả. Status IN_STOCK/LOW_STOCK/OUT_OF_STOCK lấy từ response, không tính lại ngưỡng tại UI và không đồng nhất với trạng thái bán.
- Bộ lọc/sort/page/size ở URL; whitelist và chuẩn hóa URL; min/max giữ chuỗi sai để báo lỗi, chặn GET tự động cho số âm/lẻ/exponent/unsafe và min > max; nhận 0. Sort/page client, không sửa mảng cache, null cuối, kẹp trang vượt phạm vi, đổi filter/sort/size về trang 1. Loading/empty/error/retry và cảnh báo refetch lỗi với data cũ; fallback quan hệ/SKU/quantity/ngày null. Không virtualization khi chưa đo dữ liệu thật.
- Query key theo user/role và filter server, không token; chỉ enabled khi phiên còn hạn và có inventory.manage. Snapshot kiểm tra trước/sau await, AbortSignal truyền xuống Axios, không placeholder giữa phiên. Dùng lại cache/session lifecycle hiện có. Tìm keyword/sort/page dùng mảng cache, không thêm GET vì các giá trị đó thay đổi.
- File mới inventory/{types,filters,api,queries}.ts và inventory/pages/InventoryPage.tsx. Các file tích hợp: router.tsx, navigation.ts, redirect.ts; cập nhật kế hoạch. Đã xóa test và guide riêng E13 theo yêu cầu người dùng.
- Kiểm tra typecheck/lint/build và git diff --check đạt; hồi quy E12b **10/10** và catalog **13/13** đạt. Test E13 từng chạy **9/9** đạt trước khi được xóa theo yêu cầu; không còn script test E13 trong repository. Chưa kiểm thử browser E2E hoặc backend đăng nhập thật. Build vẫn cảnh báo chunk storefront/HeroScene trên 500 kB có sẵn.
- Còn cần: browser/backend có đăng nhập A/M/S/CUSTOMER, SKU/tên thật, status ngưỡng 0/1/10/11, filter/status/kho và reload/back/forward, network/403/500, request chậm rồi logout, mobile/bàn phím/theme. Quantity JSON number hiện chưa bảo đảm chính xác cho lượng vượt MAX_SAFE_INTEGER; cần contract chuỗi nếu nghiệp vụ sử dụng lượng đó. Trạng thái: **đã code và kiểm tra tự động, chờ review và kiểm thử tích hợp có đăng nhập**.
- Commit đề xuất: `feat(admin-inventory): list stock levels with filters`.

### Bàn giao E14 — Điều chỉnh tồn và lịch sử — 25/11/2026

- Theo yêu cầu triển khai trực tiếp, thêm nút Điều chỉnh/Lịch sử từng dòng `/admin/inventory` cho A/M/S. Dialog hiển thị inventoryId/SKU, ADD/DEDUCT, quantity nguyên dương và reason tùy chọn; giữ draft khi lỗi. Schema Zod chỉ nhận chuỗi chữ số, chuyển sang number sau khi kiểm tra định dạng, chặn zero/âm/lẻ/số mũ/vượt MAX_SAFE_INTEGER. Preview không phải kết quả cuối, chặn trừ vượt tồn đọc được và phép cộng vượt giới hạn an toàn; backend kiểm tra lại tại POST.
- Contract đọc lại AdminInventoryController, AdjustStockRequest, InventoryHistoryResponse, InventoryServiceImpl và Inventory entity: POST `/api/admin/inventory/{inventoryId}/adjust` trả InventoryResponse, GET `/{inventoryId}/history` trả mảng mới nhất trước. ID giữ string và validate Long trước dispatch. quantityChanged là số dương với action xác định chiều; finalStock lấy nguyên từ server. performedBy hiện gán cứng `Admin`, UI không thay bằng người đăng nhập. Không sửa backend, thêm dependency, gen:api, commit hoặc push.
- File mới: `inventory/schemas.ts`, `inventory/components/AdjustStockDialog.tsx`, `inventory/components/InventoryHistoryDrawer.tsx`, `scripts/verify-admin-inventory.cjs`. Mở rộng types/api/queries và InventoryPage; giữ nguyên filter/sort/page E13. Thứ tự đọc học: types → schemas → api → queries → AdjustStockDialog → InventoryHistoryDrawer → InventoryPage → script kiểm tra. Luồng: input → safeParse → preview → mutateAsync → backend → cancel/invalidate → reconcile GET list không lọc + history → refetch list đang xem → UI. React quản lý state/ref/JSX, Zod kiểm tra input, TanStack Query quản lý request/cache; backend quyết định số tồn và ghi lịch sử trong transaction.
- Mutation có ref chặn double click trước render, khóa theo inventoryId/user/role trong QueryClient; retry false, networkMode always, gcTime 0. Không optimistic. Snapshot user/token/role kiểm tra trước/sau request và trước cache/UI; token không nằm trong query key. Khi đã lưu hoặc kết quả chưa rõ: cancel GET cũ và invalidate inventory (gồm history), admin products/dashboard, public products/cart/wishlist. reconcile GET danh sách không lọc để tìm được dòng đã rời bộ lọc, GET history, rồi refetch danh sách hiện tại để bộ lọc/phân trang E13 tự cập nhật.
- POST thành công được đánh dấu saved trước GET. GET lỗi vẫn báo đã lưu; nút Xem lịch sử mở drawer tự tải tồn hiện tại và lịch sử, không replay POST. Đã bỏ nút Đọc lại tồn và lịch sử riêng theo phản hồi giao diện. Timeout/network/408/5xx/404 khóa hẳn lần gửi hiện tại; xem tồn/lịch sử để đối chiếu. GET sau timeout không chứng minh request trước đã kết thúc; chỉ tạo thao tác mới sau khi xác minh kết quả. 400 cho sửa và gửi lại sau khi kiểm tra dữ liệu; 403 khóa ghi và hướng dẫn cập nhật phiên. Không tự retry hay xếp hàng chờ reconnect. Drawer chỉ mount/query khi mở, có loading/empty/error/retry và cảnh báo khi dữ liệu cũ gặp refetch lỗi; dialog/drawer dùng Base UI quản lý focus và đóng bằng bàn phím, không đóng dialog lúc đang xử lý.
- Kiểm tra: typecheck, lint, build và git diff --check đạt; E14 **8/8**, catalog **13/13**, lifecycle E12b **10/10**. E14 gồm schema/API ID string, response/body/signal, cache, khóa đồng thời, response muộn sau đổi tài khoản, offline không replay, query hủy, handler thật double click, POST thành công GET lỗi và timeout mở lịch sử không gửi thêm POST. Test dùng mock HTTP và hook/handler harness, chưa phải browser E2E/backend đăng nhập thật. Build vẫn cảnh báo chunk storefront/HeroScene lớn trên 500 kB có sẵn.
- Còn cần kiểm thử có đăng nhập A/M/S/CUSTOMER: thêm, trừ vừa đủ/vượt tồn, lịch sử/reload/catalog, dòng rời filter và kẹp trang, hai tab, 403/404/timeout, logout khi request chậm, mobile/theme/focus. Source inventory hiện chưa có @Version hoặc khóa ghi đồng thời, chưa có idempotency key; khóa frontend chỉ bảo vệ trong cùng QueryClient, không giải quyết tranh chấp giữa tab/người dùng. Backend quantity kiểu Long còn có rủi ro cộng tràn; frontend chỉ nhận lượng an toàn theo JavaScript, không đảm bảo dữ liệu Long bất kỳ được serialize chính xác. Không nghiệm thu các giới hạn này bằng test frontend. Trạng thái: **đã code và kiểm tra tự động, chờ review và tích hợp có đăng nhập**.
- Bài tập tự học: tồn đang đọc là 5, một người khác trừ 2 trước khi bạn ADD 3. Giải thích vì sao preview là 8 nhưng server có thể trả 6, và vì sao GET lại không được gửi lại POST nếu lần đầu đã lưu.
- Commit đề xuất: `feat(admin-inventory): adjust stock and inspect history`.

### Bàn giao E15 — Xem và xử lý yêu cầu trả hàng — 25/11/2026

- Theo yêu cầu triển khai trực tiếp, đã thêm `/admin/return-requests?status=PENDING&page=1`, lazy route, menu và whitelist redirect giữ query/hash sau login. A/M/S xem danh sách phân trang server; A/M duyệt hoặc từ chối yêu cầu PENDING trong dialog xác nhận. Bộ lọc chỉ nhận PENDING/APPROVED/REJECTED, size 10/20/50; đổi filter/size về trang 1, URL được chuẩn hóa và kẹp trang sau khi dòng rời bộ lọc. Không gửi sort/keyword giả.
- Đã đọc lại AdminReturnRequestController, ReturnRequestProcessRequest, ReturnRequestResponse và ReturnRequestServiceImpl. GET list nhận status/page/size, PUT `/{id}/process` nhận status và rejectReason khi từ chối, trả ReturnRequestResponse. ID giữ string, Long ID được kiểm tra trước PUT; DTO admin tách khỏi customer. Zod discriminatedUnion chặn PENDING và lý do trắng, trim lý do, loại rejectReason khỏi payload APPROVED.
- Drawer chỉ dùng dữ liệu dòng/result PUT, gồm orderId/link sang E3, orderItemId, quantity, reason/description/adminNote, createdAt/updatedAt và gallery mở ảnh gốc; ảnh có alt và lazy loading. Không gọi GET detail không tồn tại, không tạo route chi tiết phụ thuộc RAM. Drawer/dialog dùng Base UI quản lý focus; chặn đóng khi đang gửi/làm mới sau ghi. Loading/empty/error/retry, cảnh báo dữ liệu cũ khi refetch lỗi, responsive và token màu hiện có.
- Query key theo user/role/filter, không chứa token; snapshot phiên được kiểm tra trước/sau request và trước ghi cache/UI. Đổi token/user/role remount nội dung để xóa drawer/draft/thông báo cũ. PUT retry false, networkMode always, gcTime 0, ref chặn double click trước render và mutation key khóa theo request/user/role trong cùng QueryClient. STAFF bị chặn trước dispatch ở hook, server vẫn là nơi kiểm tra quyền cuối cùng.
- PUT được tách khỏi GET làm mới: kết quả thành công được ghi nhận trước GET, giữ response để không bị list PENDING cũ ghi đè. Khi thành công hoặc lỗi, hủy GET cũ và invalidate returns/orders/inventory/products/dashboard của phiên admin, customer orders/returns, public products/cart/wishlist. Tải lại các query đang active; query chưa mở được đánh dấu stale để tải ở lần vào sau. GET lỗi sau PUT thành công vẫn báo đã lưu; đóng dialog và dùng nút Tải lại danh sách trên trang, không gửi lại PUT. Khi PUT lỗi, giữ lý do trong dialog và khóa yêu cầu trong lần mở trang hiện tại, kể cả đóng/mở drawer; GET không tự mở khóa hoặc phát PUT lại. Sau timeout, thấy PENDING không đủ chứng minh request trước đã kết thúc; cần đối chiếu máy chủ trước thao tác mới. Khóa frontend không thay thế bảo vệ giữa tab/tài khoản.
- Backend đang khóa bản ghi request và order khi process, chặn request không còn PENDING; APPROVED cộng quantity vào Inventory, REJECTED lưu rejectReason vào adminNote, cập nhật order theo getEffectiveOrderStatus. Chưa thấy process cập nhật paymentStatus, hoàn tiền hoặc ghi InventoryHistory. Chưa xác nhận an toàn tranh chấp inventory giữa nhiều đơn/điều chỉnh kho, variant/inventory bị thiếu, trả một phần/nhiều dòng. Không tự tính order/payment/stock hoặc tạo history ở frontend. Không sửa backend, thêm dependency hoặc chạy gen:api.
- Thứ tự đọc học: `returns/types.ts` → `filters.ts` → `schemas.ts` → `api.ts` → `queries.ts` → `components/ProcessReturnDialog.tsx` → `components/ReturnRequestDrawer.tsx` → `pages/ReturnRequestsPage.tsx`. File tích hợp: router.tsx, navigation.ts, redirect.ts; script kiểm tra: scripts/verify-admin-returns.cjs. Luồng đọc: URL → parse filters → scoped query → GET page (URL 1 → API 0) → normalizePage → table → selected row → drawer. Luồng ghi: controlled form → safeParse → mutateAsync → PUT → response → invalidate → GET active → UI; backend quyết định số tồn và trạng thái đơn.
- Kiểm tra: build (bao gồm typecheck) và lint đạt; E15 **10/10**, hồi quy customer returns **12/12** và E14 **8/8**, tổng **30/30** đạt. Test mock contract/query và handler thật: schema, URL, Long ID, body/signal/page, quyền STAFF, cache/khóa đồng thời, session cũ, offline không replay, double click, PUT thành công GET lỗi, timeout và giữ lý do. Chưa kiểm thử browser E2E/backend có đăng nhập hoặc customer → admin trên hệ thống thật. Build vẫn có cảnh báo chunk storefront/HeroScene lớn trên 500 kB có sẵn.
- Cần thử A/M/S/CUSTOMER/guest, STAFF gọi trực tiếp PUT nhận 403; duyệt/từ chối và reload; filter/back/forward/phân trang; request được xử lý nơi khác; 400/403/404/500/timeout; logout khi request chậm; trả một phần/nhiều dòng cùng đơn, variant bị thiếu; tồn kho/order và lịch sử thực tế; mobile/theme/bàn phím/focus. Trạng thái: **đã code và kiểm tra tự động, chờ review và tích hợp có đăng nhập**, không nghiệm thu hoàn tiền/lịch sử kho bằng test frontend.
- Bài tập: vì sao `APPROVED` của yêu cầu không đủ để kết luận đơn đã hoàn tiền? Vì sao sau PUT thành công nhưng GET lỗi, nút thử lại chỉ được GET? Thử đổi schema bỏ `.trim()` và giải thích chuỗi toàn dấu cách sẽ bị kiểm tra khác thế nào.
- Commit đề xuất: `feat(admin-returns): review and process return requests`.

### Bàn giao E16 — Kiểm duyệt và trả lời đánh giá — 25/11/2026

- Theo phản hồi giao diện, đã bỏ nút **Tải lại danh sách** ở E16. Khi GET lỗi, thông báo hướng dẫn nhấn F5; GET tự làm mới sau mutation vẫn giữ nguyên. F5 xóa state cục bộ, gồm draft và khóa dòng; sau timeout vẫn cần xác minh kết quả trên máy chủ trước thao tác ghi mới.
- Đã thêm lazy route `/admin/reviews`, menu Đánh giá và whitelist redirect giữ query/hash sau login. A/M/S xem và trả lời, chỉ A/M ẩn/hiện. Lọc tên sản phẩm và 1–5 sao bằng GET server; URL giữ productName/rating/page/size, chuẩn hóa page an toàn, size 10/20/50; đổi filter/size về trang 1, kẹp trang sau khi review bị xóa. Có loading/empty/error/retry và cảnh báo dữ liệu cũ khi refetch lỗi. Tên/nội dung dài được xuống dòng; bảng cuộn ngang khi màn hình nhỏ, dialog dùng Base UI quản lý focus và bàn phím.
- Đối chiếu AdminReviewController, AdminReviewResponse, ReviewReplyRequest, ReviewServiceImpl, ReviewRepository. GET nhận rating/productName/Pageable, sort cố định `createdAt,desc`; PATCH toggle không có body; POST reply nhận `{ replyText }`; cả hai mutation trả `{ message }`, không phải review mới. Đã serialize DTO `.class` hiện có bằng Jackson 3.1.5 trong máy để xác nhận JSON `hidden` và ID string (không đoán từ tên field Java `isHidden`). Probe chạy độc lập, không sửa backend. Chưa đọc được OpenAPI runtime tại cổng 8081 (timeout); cổng 8080 trả 404 với `/v3/api-docs`. Đây chưa phải bằng chứng kiểm thử HTTP có đăng nhập.
- Reply schema trim và chặn chuỗi trắng; không tự đặt maxLength vì DTO chỉ có @NotBlank. Trả lời mới ghi đè adminReply cũ, UI có giải thích. DTO admin tách customer. ID string được validate Long trước dispatch; Spring Page được normalize, URL page 1 chuyển API page 0. Không thêm dependency hoặc chạy gen:api.
- Query key theo user/role/filter, token không nằm trong key. Snapshot phiên được kiểm tra trước/sau request và trước cập nhật UI/cache; GET có AbortSignal. Trang remount theo user/role/token để xóa draft/thông báo của phiên trước. Hai thao tác dùng chung mutation key theo review trong QueryClient; ref chặn double click trước render; retry false, networkMode always, gcTime 0, noPublicRetry. Không optimistic, không tự chạy mutation khi reconnect.
- Sau ghi hoặc lỗi, hủy GET cũ và invalidate admin reviews/products cùng customer reviews/public products; refetch các query active. Đánh dấu đã lưu trước GET. GET lỗi vẫn nói đã lưu và chỉ hướng dẫn GET lại. Timeout/lỗi ghi không rõ kết quả khóa cả hai thao tác của dòng trong lần mở trang, giữ khóa qua đổi filter/page và đóng/mở dialog; GET thành công không tự mở khóa. 400 của reply giữ draft để sửa; 404 báo review không còn tồn tại, loại dòng khỏi UI để đóng form rồi làm mới. Sau khi đã xác minh kết quả máy chủ mới rời/vào lại trang để tạo thao tác mới; reload không chứng minh request timeout đã kết thúc.
- Source toggle chưa tính lại averageRating; query tính trung bình hiện cũng không loại review ẩn. FE chỉ invalidate/refetch, không tự sửa điểm. Backend reply/toggle chưa có expected state/version hoặc idempotency key; khóa frontend không giải quyết ghi đồng thời giữa tab/người dùng. Không sửa backend trong E16.
- File mới: `reviews/{types,filters,schemas,api,queries}.ts`, `reviews/components/{ReviewActionDialog,ReviewReplyForm,ReviewVisibilityAction}.tsx`, `reviews/pages/AdminReviewsPage.tsx`, `scripts/verify-admin-reviews.cjs`. File tích hợp: router.tsx, navigation.ts, redirect.ts, package.json và phase5.md.
- Kiểm tra: build (gồm typecheck), lint và git diff --check đạt; E16 **14/14**, hồi quy customer reviews **7/7**, tổng **21/21** đạt. Bao gồm schema/filter/API/Long ID, phân quyền, session/cache, khóa ghi đồng thời, offline không replay, handler double click, đã lưu nhưng GET lỗi, 404 đóng form, 400 giữ draft, timeout toggle không mở khóa từ GET và redirect giữ query/hash. Test dùng mock HTTP/query và handler thật, chưa phải browser E2E/backend có đăng nhập. Build còn cảnh báo chunk storefront/HeroScene trên 500 kB đã có trước. Không commit hoặc push.
- Cần thử có đăng nhập A/M/S/CUSTOMER/guest; STAFF gọi trực tiếp PATCH nhận 403; lọc/reload/back/forward/phân trang; ghi đè reply; review bị customer xóa lúc mở form; 400/403/404/500/timeout; request chậm rồi logout; hiển thị customer/catalog; mobile/theme/focus. Trạng thái: **đã code và kiểm tra tự động, chờ review và tích hợp có đăng nhập**.
- Commit đề xuất: `feat(admin-reviews): moderate visibility and reply to reviews`.

#### Cập nhật giao diện quản trị sau E16 — 25/11/2026

- Đưa Trang quản trị lên đầu navigation, giữ thứ tự tương đối của các mục còn lại và quyền đang có.
- Bỏ nút tải lại ở danh mục, thương hiệu, đơn hàng/list/detail, sản phẩm/list/create/edit, ảnh/trạng thái/biến thể, tồn kho/lịch sử và trả hàng; E16 đã bỏ ở lần cập nhật trước. Các nút Thử lại chỉ gọi GET cũng được bỏ. Thông báo lỗi dùng F5, không tiếp tục nhắc nút đã xóa hoặc hứa giữ draft sau F5.
- Giữ hàm reload/refetch dùng trong luồng tự động sau mutation; giữ phân biệt đã lưu/GET lỗi và khóa ghi khi kết quả chưa rõ. Không thêm cơ chế tự phát lại thao tác ghi.
- Cập nhật các test create/edit/images/lifecycle theo UI mới: không có nút tải lại, thông báo F5, GET lỗi vẫn khóa ghi, GET tự động thành công vẫn cập nhật form/mở khóa. Tổng **79/79** test admin đã đạt: 77 case chạy trong sandbox; hai case Axios dùng server HTTP giả lập loopback được chạy lại ngoài sandbox và đều đạt. Không ghi dữ liệu lên backend thật. Build gồm typecheck đạt; build vẫn cảnh báo chunk storefront/HeroScene lớn đã có trước.
- Cập nhật `docs/e11-product-images-guide.md` và quy ước ở mục 3.1 để tránh hướng dẫn nút đã bỏ. Commit đề xuất: `refactor(admin): remove manual reload controls and reorder navigation`. Chưa commit/push; chưa kiểm thử browser có đăng nhập.

#### Hướng dẫn đọc code E16 theo từng bước, từng file

**Bước 1 — Đọc `reviews/types.ts`: biết dữ liệu trước khi đọc giao diện.**

`AdminReview` mô tả một dòng server trả về; `ReviewFilters` mô tả bộ lọc; `MessageResponse` mô tả kết quả ghi. `ReviewAction = "reply" | "toggle"` là union literal: biến chỉ được nhận một trong hai chuỗi đó. `string | null` nghĩa là dữ liệu có thể thiếu; `import type` chỉ nhập kiểu, bị loại khi build. `ID` là string để giữ chính xác Java Long lớn. Interface giúp TypeScript kiểm tra lúc phát triển, không tự kiểm tra JSON ở runtime.

**Bước 2 — Đọc `reviews/filters.ts`: URL là trạng thái bộ lọc đã áp dụng.**

`parseReviewFilters(search)` chuyển URLSearchParams thành object có kiểu; `serializeReviewFilters(filters)` làm chiều ngược lại. `as const` giữ kiểu literal của các giá trị cho phép. `.find(...) ?? null` tìm số sao hợp lệ, nếu không có thì dùng null. Regex kiểm tra chuỗi page trước khi chuyển Number; chỉ chuyển page/size, không chuyển ID. Có thể tự đổi URL `?rating=9&page=-1&size=999` để xem URL được chuẩn hóa về tất cả sao/trang 1/size 10.

**Bước 3 — Đọc `reviews/schemas.ts`: kiểm tra input ở runtime.**

```ts
export const reviewReplySchema = z.object({
  replyText: z.string().trim().min(1, "Vui lòng nhập nội dung trả lời."),
});

export type ReviewReplyRequest = z.infer<typeof reviewReplySchema>;
```

`z.object` khai báo hình dạng object; `.trim()` bỏ khoảng trắng hai đầu trước `.min(1)`. `typeof` lấy kiểu của schema, `z.infer` suy ra kiểu payload từ schema để tránh khai báo trùng. Trong form, `safeParse` trả `{ success, data/error }`, phù hợp hiển thị lỗi mà không throw. Ở API, `.parse` kiểm tra lại và throw nếu payload sai. Bài tập: bỏ trim rồi thử nhập toàn dấu cách, giải thích thay đổi.

**Bước 4 — Đọc `reviews/api.ts`: chỉ quan tâm contract HTTP.**

`getAdminReviews` gọi GET, truyền filter và signal, đổi page rồi normalizePage. `toggleAdminReview` gọi PATCH không body. `replyAdminReview` gọi POST với JSON đã validate. `api.get<BackendPage<AdminReview>>` là generic: nói với TypeScript kiểu của data, không tự validate JSON. `const { data } = await ...` vừa chờ Promise hoàn thành vừa destructure trường data từ Axios response. `filters.rating ?? undefined` bỏ filter nếu null, `productName || undefined` bỏ chuỗi rỗng. `meta.authToken` đi qua interceptor hiện có để gắn đúng token của snapshot; `noPublicRetry` ngăn fallback retry của client.

**Bước 5 — Đọc `reviews/queries.ts`: quản lý phiên, request và cache.**

Thứ tự đọc các hàm: `useReviewsSession` → `isCurrentReviewsSession` → `useAdminReviews` → `useAdminReviewAction`. Custom hook bắt đầu bằng `use`, tái sử dụng logic React. `useQuery` lấy danh sách; queryKey xác định cache riêng theo user/role/filter. `enabled` quyết định có được tự GET; queryFn vẫn kiểm tra lại phiên trước/sau await để chặn response muộn. `signal.throwIfAborted()` ngăn query đã hủy trả kết quả hợp lệ.

Mutation hook nhận id/action/snapshot, kiểm tra quyền theo action và khóa theo dòng. `useIsMutating` cập nhật UI khi cùng dòng đang ghi; `client.isMutating` kiểm tra ngay lúc dispatch. Trong mutationFn, chính mutation đang chạy được tính là 1 nên `> 1` phát hiện thao tác thứ hai. Spread `...prefix` ghép từng phần của query key. `onSettled` chạy khi ghi thành công hoặc thất bại, hủy GET cũ rồi đánh dấu cache stale. `refetchType: "none"` giúp việc đánh dấu stale tách khỏi GET; `refreshRelated()` mới tải lại active queries. `Promise.all` chờ các tác vụ độc lập. Bài tập: giải thích vì sao không đưa token vào queryKey và vì sao không dùng retry cho toggle.

**Bước 6 — Đọc `ReviewReplyForm.tsx` và `ReviewVisibilityAction.tsx`: hai tên nghiệp vụ rõ ràng.**

Hai component bọc `ReviewActionDialog`, truyền lần lượt `action="reply"` và `action="toggle"`. `{...props}` trải các prop review/snapshot/callback vào component con. Các wrapper nhỏ giúp bảng thể hiện rõ hai chức năng trong khi vòng đời lỗi/làm mới chỉ viết một lần. Không có hook customer trong module admin.

**Bước 7 — Đọc `ReviewActionDialog.tsx`: hiểu toàn bộ luồng ghi.**

`ReviewActionProps` khai báo dữ liệu và callback cha truyền xuống. `ReviewActionProps & { action: ReviewAction }` là intersection: phải có cả prop chung và action. `useState` giữ open/draft/message/saved/busy để render. `useRef` giữ sending/mounted mà không gây render. sending được gán ngay nên chặn được lần click thứ hai trước khi React render trạng thái busy. `useEffect` cleanup đặt mounted=false khi unmount. `useId` nối label/textarea và mô tả lỗi đúng accessibility.

Đọc hàm `submit` theo thứ tự: preventDefault → guard → safeParse → khóa gửi → mutateAsync → ghi nhận đã lưu hoặc phân loại lỗi → refreshRelated → mở khóa busy trong finally. `error instanceof ApiError` thu hẹp unknown thành lỗi API có status. `finally` vẫn chạy khi try/catch return, bảo đảm dọn busy và làm mới chỉ khi phiên còn đúng. didSave là biến cục bộ của lần submit; saved là state để khóa nút trên UI. Không đưa GET vào cùng nhánh bắt lỗi ghi rồi tự POST lại.

JSX dùng `{isReply ? (...) : (...)}` để chọn textarea hoặc nội dung xác nhận. `value` cùng `onChange` tạo controlled textarea: React giữ draft. `onSubmit={(event) => { void submit(event); }}` gọi hàm async từ event handler; void biểu thị chủ động bỏ Promise trả về, còn lỗi được xử lý trong submit. Base UI Dialog dùng Root/Trigger/Portal/Backdrop/Popup/Title/Description/Close. Portal đặt dialog ngoài vùng bảng; onOpenChange dùng event.cancel để chặn đóng khi đang ghi. `render={<Button ... />}` cho Base UI dùng Button hiện có làm phần tử tương tác.

**Bước 8 — Đọc `AdminReviewsPage.tsx`: nối các lớp trên thành trang.**

Component ngoài lấy snapshot; `key` theo user/role/token buộc React tạo lại toàn bộ nội dung khi đổi phiên. `AdminReviewsContent` parse URL, gọi query, định nghĩa columns rồi render DataTable/Pagination/dialog. `DataTableColumn<AdminReview, never>[]` nghĩa là mỗi cell nhận AdminReview; `never` biểu thị trang không cung cấp lựa chọn sort cột tùy ý, vì sort API được cố định.

blockedIds và missingIds là Set, dùng `.has(id)` để kiểm tra nhanh. Khi thêm ID phải tạo Set mới qua `setBlockedIds((current) => new Set([...current, review.id]))`; không sửa trực tiếp Set cũ vì React cần reference mới để nhận biết thay đổi. Callback onBlocked/onMissing/onNotice truyền từ cha xuống dialog; dialog báo kết quả ngược lên qua callback. missingIds chỉ loại dòng server đã báo 404, không giả lập mutation thành công.

`ReviewFiltersForm` giữ draft tên/sao riêng; chỉ khi submit mới đổi URL và GET. `key={canonicalSearch}` đồng bộ form với URL khi Back/Forward. `.map` render options; `.filter` loại review đã xác nhận không còn; `review.adminReply && (...)` chỉ render khối trả lời khi có nội dung. `??` fallback với null/undefined, còn `||` fallback cả chuỗi rỗng. Nội dung review được render thành text thông thường qua JSX.

**Bước 9 — Đọc các file tích hợp và script.**

- `src/app/router.tsx`: route reviews dùng `lazy`/dynamic import để tách bundle, đi qua AdminRoute hiện có.
- `src/features/admin/navigation.ts`: thêm menu có permission review.view; sidebar hiện có lọc theo role.
- `src/shared/auth/redirect.ts`: thêm whitelist để đăng nhập xong quay lại đúng trang cùng query/hash.
- `package.json`: thêm `npm run verify:admin-reviews`.
- `scripts/verify-admin-reviews.cjs`: dùng node:test/assert, mock Axios và TanStack Query; có harness gọi submit handler thật với React state/ref giả lập. Kiểm tra behavior/contract, không thay thế test browser, focus hoặc backend authorization.
- `phase5.md`: cập nhật tiến độ, contract, cách đọc và giới hạn kiểm thử.

**Luồng đọc và luồng ghi cần tự lần lại:**

```text
Mở /admin/reviews hoặc submit bộ lọc
  → URLSearchParams → parseReviewFilters
  → useAdminReviews → getAdminReviews → backend GET
  → normalizePage → query cache → DataTable/Pagination

Bấm trả lời hoặc ẩn/hiện
  → ReviewReplyForm / ReviewVisibilityAction
  → ReviewActionDialog.submit → schema nếu trả lời
  → useAdminReviewAction → API POST/PATCH → backend
  → MessageResponse → báo đã lưu
  → cancel GET cũ → invalidate → GET active → bảng cập nhật
```

**Tự kiểm tra:** chạy `npm run dev`, đăng nhập A/M rồi mở `/admin/reviews?rating=5&page=1&size=10`; xem Network có page=0 và sort=createdAt,desc. Nhập reply trắng phải không có POST. Lưu reply hợp lệ phải có một POST rồi GET. Với STAFF không có nút ẩn/hiện. Mô phỏng request timeout và xác nhận không có PATCH tự phát khi reconnect. Bài tập cuối: nếu toggle đầu tiên đã chạy nhưng response bị mất, toggle lần hai sẽ gây lỗi nghiệp vụ gì? Vì sao GET thấy trạng thái cũ chưa đủ để kết luận PATCH trước thất bại?

### Bàn giao E20–E21 — Xem trước doanh thu và tải CSV — 27/11/2026

- Đã thêm lazy route `/admin/reports`, menu theo `report.view` và redirect whitelist A/M. STAFF/CUSTOMER không được vào trang; backend vẫn kiểm tra quyền cuối cùng.
- Form giữ draft riêng với submittedRange; chỉ Xem trước hợp lệ mới kích hoạt GET. Preset chỉ thay draft. Dùng lại utility ngày E19, thêm Zod kiểm tra tương lai theo giờ VN. Giữ date-only; chênh lệch 365 ngày được phép trả 366 dòng inclusive.
- Preview hiển thị khoảng đã gửi, tổng response và từng ngày, giữ 0/null/empty/error/loading, cảnh báo dữ liệu cũ khi refetch lỗi. Không tự cộng từ đơn đã phân trang hoặc thay aggregate bằng tổng FE. API từ chối response có khoảng ngày không khớp request.
- Đã đọc controller/DTO/service/mapper/report query và công thức checkout: gross=subtotal, discount=discount_amount, shipping=shipping_fee, net=total_price; khi checkout total=max(0, subtotal+shipping-discount). Lấy đơn DELIVERED hoặc PAID ngoài CANCELLED/RETURNED; nhóm ngày tạo đơn. Mapper điền ngày trống và cộng tổng. Không suy ra lợi nhuận/hoàn tiền từ các số này.
- Query key theo user/role/reports/preview/submittedRange, không chứa token; chặn phiên sai/hết hạn trước và sau GET, hỗ trợ AbortSignal, không retry lỗi. Remount nội dung khi đổi phiên để bỏ draft/thông báo. Dữ liệu khoảng cũ không làm placeholder cho khoảng mới.
- CSV dùng Axios có auth snapshot, responseType blob, khoảng đã submit. Chỉ cho xuất sau preview và khi không fetch/lỗi. Ref chặn click lặp; không tự tải khi mount/reconnect. Abort khi đổi khoảng/unmount; kiểm tra lại phiên trước trigger download. Preview và export là hai lần tính độc lập trên backend, không hứa snapshot giống nhau nếu đơn đã thay đổi.
- Helper download đọc filename*/filename, ưu tiên UTF-8, fallback tên theo khoảng ngày, loại đường dẫn/ký tự điều khiển và ký tự file không hợp lệ, bảo đảm đuôi CSV. Tạo/click/remove anchor rồi revoke object URL sau khi bắt đầu tải, cả khi click throw. Không persist/cache Blob hoặc object URL. Export lỗi 404 khi không có dữ liệu hiển thị thông báo, không giả thành file rỗng.
- `normalizeError` dùng lại interceptor hiện có; bổ sung Blob text fallback giới hạn 500 ký tự, HTML/rỗng dùng thông báo theo status. JSON Blob vẫn parse như cũ. Không sửa toàn bộ client hoặc backend.
- Source `SecurityConfig` hiện expose Content-Disposition/Authorization. Chưa xác nhận CORS/filename runtime trên browser khác origin. FE hôm nay theo Asia/Ho_Chi_Minh; service vẫn dùng systemDefault/LocalDate.now và SQL DATE_FORMAT, chưa chốt JVM/MySQL runtime.
- Kiểm tra đạt: build gồm typecheck, lint, git diff --check; E20/E21 11/11 test mock/handler/render, hồi quy dashboard 10/10, tổng 21/21. Test bao gồm input ngày/365 boundary, params/auth/blob, filename UTF-8/path/encoding lỗi, Blob JSON/text/HTML/rỗng, object URL cleanup, query permission/session/abort, tổng response, redirect, draft-submit và export double click/session/unmount/error. Build vẫn cảnh báo chunk storefront/HeroScene lớn đã có trước. Chưa browser E2E hoặc đối soát backend có đăng nhập.
- Cần thử tích hợp A/M/S/CUSTOMER/guest, direct STAFF GET bị từ chối, mobile/bàn phím, các lỗi HTTP/timeout, logout khi đang tải, CSV/tên file/header và đối chiếu số liệu trong dữ liệu dev ổn định; kiểm tra biên nửa đêm VN/JVM/MySQL. Trạng thái: đã code và kiểm tra tự động, chờ review/tích hợp. Không đánh dấu toàn Phase 5 hoàn tất.
- Commit đề xuất cho phạm vi gộp: `feat(admin-reports): preview revenue reports and download authenticated CSV`. Không tạo commit/push.
