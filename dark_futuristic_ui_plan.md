# Kế hoạch nâng cấp Dark Futuristic cho Electronics Store

**Ngày khảo sát** 02/11/2026 · **Cập nhật tiến độ** 03/11/2026.

Đã commit theme nền tối, storefront/catalog và giao diện giao dịch/tài khoản/admin trên nhánh `dev`. Các component UI bổ sung của giai đoạn 1 và phần motion/hero 3D còn chờ triển khai. Các ca kiểm tra trên trình duyệt với backend còn chờ xác nhận.

Ưu tiên nền tối và component dùng chung trước, áp dụng lên trang chủ và catalog, sau đó mới thêm hero 3D. Người mua có thể xoay một cảnh công nghệ ở trang chủ. Card sản phẩm tạo chiều sâu bằng CSS. Giỏ hàng, checkout, tài khoản và admin dùng cùng ngôn ngữ thị giác, ưu tiên khả năng đọc và thao tác chính xác.

Khảo sát dựa trên mã nguồn và cấu hình. ESLint và kiểm tra TypeScript cho ứng dụng lẫn cấu hình Vite đều đạt tại thời điểm khảo sát. Số liệu bundle lấy từ bản build có sẵn. Hiển thị trên thiết bị và các luồng cần backend được kiểm chứng từ giai đoạn 0.

## 1. Kiến trúc UI tại thời điểm khảo sát 02/11/2026

| Khu vực | Hiện trạng và ý nghĩa đối với thiết kế |
|---|---|
| Khung ứng dụng | React chạy trong Strict Mode. `AppProviders` quản lý Query Client, vòng đời phiên và Sonner. React Router chia hai layout chính là `StorefrontLayout` và `AdminLayout`. Trang 403, 404 và màn hình lỗi có thể hiển thị ngoài layout cửa hàng. Theme cần bao phủ cả các màn hình này và toast. [Router](src/app/router.tsx) · [Providers](src/app/providers.tsx) |
| Tổ chức mã nguồn | Có bảy feature gồm `home`, `catalog`, `auth`, `cart`, `address`, `checkout` và `admin`. Các page ghép component và nối dữ liệu. `shared` chứa API client, query key, session, guard và kiểu dùng chung. `lib` chứa tiện ích như `formatVND`. `hooks` có `useDebounce`. Có thể triển khai theo từng feature trên cấu trúc hiện tại. [Features](src/features) · [Shared](src/shared) |
| CSS và Tailwind | Tailwind **4.3.3** chạy qua plugin Vite. Stylesheet chính có `@theme inline`, biến màu OKLCH, radius, Geist Variable và bộ token `.dark`. Storefront mặc định sáng, admin tự gắn `.dark`. `App.css` chứa CSS mẫu Vite và nằm ngoài chuỗi import hiện tại. Điểm vào của theme là [index.css](src/index.css). [Cấu hình Vite](vite.config.ts) |
| Thư viện UI | Dự án cấu hình shadcn `base-nova`, dùng Base UI, CVA và `cn` cho `Button`. Đã có Lucide, Sonner, `tw-animate-css`, React Hook Form và Zod. Thư mục UI chung chỉ có `Button`. Trong JSX có 26 vị trí dùng `<button>` native, 14 `<input>` và 5 `<select>`. Đây là các điểm nên chuẩn hóa focus, kích thước và trạng thái lỗi. [Cấu hình shadcn](components.json) · [Button](src/components/ui/button.tsx) |
| Mức hoàn thiện | Storefront đã có khám phá sản phẩm, tìm kiếm, lọc, so sánh, biến thể, giỏ khách/tài khoản và địa chỉ. Checkout đã kiểm tra nguồn vào và chuẩn bị địa chỉ nhận hàng. Gửi đơn và thanh toán là các bước nghiệp vụ tiếp theo. Admin hiện có layout, phân quyền và trang tổng quan chỉ hiển thị tiêu đề. [CheckoutContent](src/features/checkout/components/CheckoutContent.tsx) · [AdminHomePage](src/features/admin/pages/AdminHomePage.tsx) |

## 2. Design System và phần tái sử dụng

| Lớp | Đề xuất | Lý do |
|---|---|---|
| Token giao diện | Mở rộng token hiện tại với nền graphite, bề mặt nổi sáng hơn một cấp, cyan cho hành động chính và tím dùng tiết chế trong hero. Tách màu thành công, cảnh báo, lỗi và vòng focus. Giữ Geist cho tiếng Việt, dùng chữ số đồng độ rộng cho giá và số lượng. Áp theme từ `html`, đặt `color-scheme: dark`, đồng bộ Sonner và đặt ngôn ngữ tài liệu thành `vi`. | Một bộ token phủ được hai layout, form native, toast và trang lỗi. Giá, tồn kho và lỗi nhập liệu vẫn dễ phân biệt khi tắt hiệu ứng phát sáng. |
| UI dùng chung | Giữ API `variant` và `size` của `Button`. Bổ sung `Input`, `Select` native, `Surface` cho khối nội dung và `StatusNotice` cho trạng thái tải/lỗi/thử lại. Control chuyển tiếp `ref`, `id`, `name`, sự kiện và `aria-*` xuống phần tử HTML. Component UI chỉ nhận props. | Giảm class lặp, giữ đăng ký trường của React Hook Form, hành vi bàn phím và focus. |
| Component theo feature | Làm mới `ProductCard` để cả trang chủ lẫn danh sách cùng hưởng lợi qua `ProductGrid`. Dùng lại `DiscoveryTile` cho danh mục và thương hiệu, `ProductGallery` cho ảnh biến thể, `UserMenu` cho hai layout và `AddressForm` cho sổ địa chỉ và checkout. | Các component này đã xử lý ảnh dự phòng, lựa chọn biến thể, điều hướng theo tài khoản và bảo toàn bản nháp. |
| Motion và chiều sâu | Hover/focus dùng chuyển tiếp khoảng 120–180 ms. Card chỉ nâng nhẹ lớp ảnh trên thiết bị có chuột chính xác. Hero là hình chip và các lớp mạch, có thể xoay bằng kéo hoặc phím mũi tên sau khi kích hoạt. Tiêu đề và nút “Xem tất cả sản phẩm” luôn là HTML. | Người mua có thể đọc và đi tiếp ngay khi cảnh chưa tải. Form, bảng so sánh và nút mua giữ vị trí ổn định khi thao tác. |

## 3. Thư viện và tính tương thích

[Manifest](package.json) khai báo React và React DOM `^19.2.8`, nhưng [lockfile](package-lock.json) và `node_modules` tại thời điểm khảo sát đều ở **19.3.0**. TypeScript là **6.0.3**, Vite là **8.3.4**. Khi triển khai, đối chiếu lại các phiên bản thực tế với peer dependency bên dưới.

| Nhu cầu | Lựa chọn |
|---|---|
| Hover, focus, phản hồi nút | Dùng Tailwind, CSS transform/opacity và `tw-animate-css` hiện có. Giai đoạn nền tảng không cần dependency mới. |
| Motion có phối hợp | Dùng **`motion@14.9.0`** cho trang chủ qua `motion/react` và `LazyMotion` trong phạm vi cần dùng. Bản này khai báo peer React và React DOM thuộc dòng 18 hoặc 19, bao gồm 19.3.0. [Manifest Motion 14.9.0](https://github.com/motiondivision/motion/blob/v14.9.0/packages/motion/package.json) · [LazyMotion](https://motion.dev/docs/react-lazy-motion) |
| Hero WebGL | Dùng **`@react-three/fiber@9.8.1` + `three@0.187.0`**, với `@types/three` cùng dòng `0.187`. Fiber 9.8.1 khai báo React/React DOM `>=19 <19.4` và Three `>=0.156`. Cảnh hình học độc lập phù hợp vì catalog hiện chỉ có ảnh, chưa có model theo SKU. [Manifest Fiber 9.8.1](https://github.com/pmndrs/react-three-fiber/blob/v9.8.1/packages/fiber/package.json) · [Three.js r187](https://github.com/mrdoob/three.js/releases/tag/r187) |

## 4. Lộ trình triển khai

Các ô đã đánh dấu thể hiện công việc đã thực hiện hoặc kiểm tra đã đạt. Chỉ xác nhận nghiệm thu giao diện sau khi hoàn thành các ca thử tương ứng trên trình duyệt.

### Giai đoạn 0 — Ghi nhận giao diện hiện tại

- [x] Đọc mã nguồn, đối chiếu cấu hình và chạy lint/build nền, bao gồm TypeScript.
- [x] Ghi nhận bundle có sẵn lúc khảo sát, JS chính **698,1 kB**, khoảng **213,6 kB gzip**.
- [ ] Chụp màn hình trước nâng cấp ở 390, 768 và 1440 px. Chưa có bộ ảnh được ghi nhận trong đợt khảo sát.
- [ ] Ghi nhận kết quả thử bàn phím, trạng thái tải/lỗi và các luồng với backend.

### Giai đoạn 1 — Theme và UI chung

Commit **`020e935`** — `feat(ui): establish dark futuristic theme (phase 1)`.

- [x] Áp `lang="vi"`, theme tối từ `html` và tiêu đề Electronics Store trong [index.html](index.html).
- [x] Thiết lập bảng màu graphite/cyan, `color-scheme: dark` và token cho card, input, focus, chart, sidebar trong [index.css](src/index.css).
- [x] Đồng bộ Sonner với `theme="dark"` trong [providers.tsx](src/app/providers.tsx).
- [x] Lưu kế hoạch nâng cấp vào project.
- [x] Bổ sung utility `form-control` cho input/select của auth và address trong commit giai đoạn 3.
- [ ] Bổ sung `Input`, `Select`, `Surface`, `StatusNotice` theo đề xuất ban đầu. [Thư mục UI](src/components/ui) hiện có `Button`. Phần chuẩn hóa control đã triển khai qua CSS utility và các phần tử native.
- [ ] Hoàn tất kiểm tra trực quan nút, focus, disabled, lỗi, toast và tương phản chữ.

### Giai đoạn 2 — Storefront và catalog

Commit **`a4cc552`** — `feat(ui): refresh storefront and catalog (phase 2)`.

- [x] Đồng bộ header/footer và cách menu xuống hàng trong [StorefrontLayout](src/app/layouts/StorefrontLayout.tsx).
- [x] Làm mới hero tĩnh của [HomePage](src/features/home/pages/HomePage.tsx), gồm gradient cyan/tím, biểu tượng chip và nút xem sản phẩm.
- [x] Làm mới `ProductCard`, bố cục tên/giá và hiệu ứng hover ảnh cho thiết bị có chuột, có xét giảm chuyển động.
- [x] Đồng bộ `CategoryMenu`, `BrandStrip` và `DiscoveryTile` với lưới responsive, khung, tiêu đề, hover/focus và tên tối đa hai dòng.
- [x] Bổ sung nền sáng riêng cho ảnh logo thương hiệu để tăng tương phản cho logo đen.
- [x] Đồng bộ bộ lọc, ô tìm kiếm và dropdown gợi ý.
- [x] Làm mới gallery, viền thumbnail đang chọn và khối thông tin sản phẩm.
- [x] Đồng bộ khay so sánh và khung bảng có cuộn ngang.
- [x] ESLint các component đã chỉnh, build và kiểm tra diff đạt tại thời điểm hoàn thành code.
- [ ] Nghiệm thu hiển thị ở 390, 768 và 1440 px. Thử logo đen/nhiều màu/trắng trong suốt, ảnh lỗi, tên dài, tìm kiếm tiếng Việt, bàn phím, lọc/phân trang, đổi biến thể và so sánh 2–4 sản phẩm.

### Giai đoạn 3 — Giao dịch, tài khoản và admin

Commit **`89ba9c0`** — `feat(ui): unify cart, checkout, account and admin styles (phase 3)`. Gồm 23 file.

- [x] Đồng bộ `CartItemRow`, ảnh sản phẩm, xuống dòng nội dung/nhóm thao tác, `CartSummary`, tổng tiền và nút checkout.
- [x] Làm mới trạng thái giỏ trống và phần `CartMergeReview`.
- [x] Đồng bộ `AddressCard`, badge mặc định, khung xác nhận xóa, form thêm/sửa và tiêu đề responsive của sổ địa chỉ.
- [x] Dùng chung `form-control` cho input/select địa chỉ, địa giới và các form auth, gồm focus, lỗi và disabled.
- [x] Đồng bộ khung thông tin checkout, địa chỉ được chọn và thông báo địa chỉ sẵn sàng.
- [x] Đồng bộ khung các trang xác thực/hồ sơ và kích thước nút gửi chính của form auth/địa chỉ.
- [x] Cho `UserMenu` xuống hàng trên màn hình nhỏ và thêm focus cho liên kết địa chỉ.
- [x] Đồng bộ header/sidebar admin và khung trang tổng quan.
- [x] Lint, build gồm TypeScript và `git diff --check` đạt. Bundle JS chính **702,65 kB**, khoảng **216,62 kB gzip**. Vẫn có cảnh báo chunk lớn hơn 500 kB.
- [ ] Kiểm tra trên trình duyệt với backend, gồm sửa số lượng giỏ, merge giỏ, CRUD địa chỉ, chuyển saved/manual và giữ bản nháp checkout, xác thực/phân quyền và responsive.

### Giai đoạn 4 — Motion và hero 3D

- [ ] Thêm `components/HeroShowcase.tsx` cho HTML/hình tĩnh và `components/HeroScene.tsx` cho WebGL trong [feature Home](src/features/home).
- [ ] Cập nhật `HomePage`, [manifest](package.json) và [lockfile](package-lock.json) với các dependency đã đề xuất, đối chiếu lại peer dependency trước khi cài.
- [ ] Chỉ tải chunk 3D sau thao tác “Xem 3D”, dùng một canvas render theo nhu cầu.
- [ ] Hỗ trợ kéo/phím mũi tên, hình tĩnh khi WebGL lỗi hoặc người dùng chọn giảm chuyển động.
- [ ] Kiểm tra Network khi vào thẳng catalog, giỏ và checkout, cùng các kiểm tra hiệu năng và khả năng truy cập. [Render theo nhu cầu](https://r3f.docs.pmnd.rs/advanced/scaling-performance)

**Mốc duyệt thiết kế chính là cuối giai đoạn 2.** Đánh giá phong cách trên trang chủ, danh sách và chi tiết sản phẩm với dữ liệu thực tế trước khi đưa WebGL vào dự án.

## 5. Rủi ro và điều kiện nghiệm thu

| Rủi ro | Cách kiểm chứng |
|---|---|
| Mất trạng thái khi thêm animation | Checkout giữ `AddressForm` mounted bằng `hidden`. Gallery dùng `key` theo sản phẩm và biến thể để reset đúng lúc. Giữ vòng đời hai component. Thử nhập dở địa chỉ, chuyển qua lại giữa địa chỉ đã lưu và nhập tay, đổi biến thể, đổi ảnh và nhập tay khi API địa giới lỗi. |
| Gửi thao tác giỏ hai lần hoặc mở checkout sai nguồn | `CartItemRow` phối hợp `pointerdown`, `blur` và `click`. Checkout đọc cả `?source=` và `location.state`, đồng thời kiểm tra phiên. Thử sửa số lượng rồi bấm tăng, giảm hoặc xóa, đối chiếu số mutation. Thử giỏ khách, đăng nhập để merge, thiếu tồn, “Mua ngay”, mở thẳng URL checkout và đổi phiên giữa chừng. |
| Hiệu ứng che tương tác hoặc làm hỏng điều hướng | Search debounce 300 ms, xử lý bộ gõ tiếng Việt và hỗ trợ bàn phím. `CompareTray` cố định ở đáy màn hình. Thử gõ tiếng Việt, phím ↑/↓, Enter, Escape, Back/Forward và URL có bộ lọc. Chọn 2–4 sản phẩm để so sánh trên mobile. Kiểm tra dropdown, focus và nút mua khi tray đang mở. |
| Tương phản giảm hoặc 3D làm chậm luồng mua | Kiểm tra chữ thường đạt tối thiểu 4.5:1, giá, tồn kho, lỗi, trạng thái disabled, focus bằng bàn phím, chế độ giảm chuyển động và WebGL bị tắt. CI dùng `--legacy-peer-deps`, nên cần đối chiếu peer dependency riêng. Chạy `npm run lint`, `npm run typecheck`, `npm run build` và kiểm tra các route giao dịch không tải chunk 3D. |
| Hồi quy xác thực và phân quyền | Header có menu tài khoản và số lượng giỏ. Vòng đời phiên phát sinh toast. Thử đăng nhập, đăng xuất, quay lại URL ban đầu, vào admin bằng tài khoản đủ/thiếu quyền, cùng màn hình 403 và 404. Đối chiếu URL, kết quả guard và request với mốc giai đoạn 0. |

**Ranh giới triển khai.** Thay đổi thuộc lớp trình bày và dependency đồ họa. Dùng nguyên hợp đồng API, DTO, route, query key, cache policy, Zustand store, khóa lưu trữ và handler nghiệp vụ hiện tại.
