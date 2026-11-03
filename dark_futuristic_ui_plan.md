# Kế hoạch nâng cấp Dark Futuristic cho Electronics Store

**Ngày khảo sát:** 02/11/2026 · **Trạng thái:** Đã khảo sát và lập kế hoạch. Các giai đoạn triển khai bên dưới đang chờ thực hiện.

Ưu tiên nền tối và component dùng chung trước, áp dụng lên trang chủ và catalog, sau đó mới thêm hero 3D. Người mua có thể xoay một cảnh công nghệ ở trang chủ. Card sản phẩm tạo chiều sâu bằng CSS. Giỏ hàng, checkout, tài khoản và admin dùng cùng ngôn ngữ thị giác, ưu tiên khả năng đọc và thao tác chính xác.

Khảo sát dựa trên mã nguồn và cấu hình. ESLint và kiểm tra TypeScript cho ứng dụng lẫn cấu hình Vite đều đạt tại thời điểm khảo sát. Số liệu bundle lấy từ bản build có sẵn. Hiển thị trên thiết bị và các luồng cần backend được kiểm chứng từ giai đoạn 0.

## 1. Kiến trúc UI hiện tại

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

Đánh dấu từng giai đoạn sau khi đạt điều kiện nghiệm thu tương ứng.

- [ ] **Giai đoạn 0 — Ghi nhận giao diện hiện tại.** Chụp màn hình đại diện ở 390, 768 và 1440 px. Ghi lại hành vi bàn phím, trạng thái tải/lỗi và kích thước bundle. Bản `dist` tại thời điểm khảo sát có một file JS chính **698,1 kB**, khoảng **213,6 kB gzip**. Đối chiếu các route hiện hữu và [cấu hình CI](.github/workflows/auth-checks.yml).
- [ ] **Giai đoạn 1 — Theme và UI chung.** Chỉnh [index.html](index.html), [index.css](src/index.css), cấu hình hiển thị `Toaster` trong [providers.tsx](src/app/providers.tsx) và [button.tsx](src/components/ui/button.tsx). Thêm `input.tsx`, `select.tsx`, `surface.tsx`, `status-notice.tsx` vào [thư mục UI](src/components/ui). Duyệt nút, trường nhập, focus, disabled, lỗi và toast trên nền tối.
- [ ] **Giai đoạn 2 — Storefront và catalog.** Chỉnh [StorefrontLayout](src/app/layouts/StorefrontLayout.tsx), [HomePage](src/features/home/pages/HomePage.tsx), [catalog components](src/features/catalog/components) và [catalog pages](src/features/catalog/pages). Ưu tiên `ProductCard`, `DiscoveryTile`, `ProductFilters`, `SearchBar`, `ProductGallery`, `CompareTray` và `CompareTable`. Duyệt trang chủ với hero tĩnh, danh sách, chi tiết và so sánh. Kiểm tra ảnh lỗi, tên dài, giá và nút so sánh độc lập với link mở sản phẩm.
  - [ ] **Logo thương hiệu trên nền tối.** Kiểm tra logo đen có nền trong suốt, logo nhiều màu và ảnh lỗi ở mục “Thương hiệu nổi bật”. Dùng nền sáng trung tính riêng cho vùng ảnh logo cần tăng tương phản. Kiểm tra cả trạng thái hover, màu gốc của logo, tên thương hiệu và ảnh danh mục.
- [ ] **Giai đoạn 3 — Giao dịch, tài khoản và admin.** Chỉnh giao diện [Cart](src/features/cart/components), [CheckoutContent](src/features/checkout/components/CheckoutContent.tsx), [Address](src/features/address/components), [Auth](src/features/auth) và [AdminLayout](src/app/layouts/AdminLayout.tsx). Trọng tâm là `CartItemRow`, `CartSummary`, `CartMergeReview`, `AddressForm`, `AddressGeographyFields` và các form xác thực. Duyệt khoảng cách, trạng thái lỗi/chờ và mật độ hiển thị của admin. Nghiệm thu checkout đến bước xác nhận địa chỉ hiện có.
- [ ] **Giai đoạn 4 — Motion và hero 3D.** Trong [feature Home](src/features/home), thêm `components/HeroShowcase.tsx` cho HTML và hình tĩnh, `components/HeroScene.tsx` cho WebGL. Cập nhật `HomePage`, [manifest](package.json) và [lockfile](package-lock.json). Chỉ tải chunk 3D sau thao tác “Xem 3D”. Dùng một canvas, render theo nhu cầu, giữ hình tĩnh khi WebGL lỗi hoặc người dùng chọn giảm chuyển động. Kiểm tra Network khi vào thẳng catalog, giỏ và checkout. [Render theo nhu cầu](https://r3f.docs.pmnd.rs/advanced/scaling-performance)

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
