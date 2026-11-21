# E11 — Đọc và hiểu chức năng quản lý ảnh sản phẩm

Ngày thực hiện: 22/11/2026. Đây là hướng dẫn cho code đã triển khai theo yêu cầu trực tiếp. Không cần tự chép lại các đoạn code bên dưới.

## 1. Kết quả và cách mở

Chạy `npm run dev`, đăng nhập ADMIN/MANAGER/STAFF, mở `/admin/products`, bấm tên sản phẩm để tới `/admin/products/:id/edit`. Dưới phần biến thể có khu **Ảnh sản phẩm**:

- Xem ảnh đã lưu; ảnh có `isPrimary === true` được ghi **Ảnh đại diện**.
- Chọn nhiều file, xem trước, bỏ từng file rồi bấm **Tải ảnh lên**.
- Bấm **Chọn đại diện** dưới ảnh đã lưu.
- Bấm **Xóa ảnh**, đọc xác nhận, chọn **Xác nhận xóa** hoặc **Giữ ảnh**.
- Sau mỗi thao tác thành công, tải lại detail từ máy chủ. Reload trang phải giữ kết quả đã lưu.

Không thêm chức năng kéo thả lưu thứ tự vì backend chưa có API đó. Các thao tác này quản lý ảnh cấp sản phẩm, không sửa ảnh riêng của variant.

## 2. Thứ tự đọc và trách nhiệm từng file

| Thứ tự | File | Trách nhiệm |
|---|---|---|
| 1 | `src/features/admin/products/types.ts` | DTO đã có từ E10: định nghĩa product và ảnh server; không sửa ở E11 |
| 2 | `src/features/admin/products/productImages.ts` | File mới: validation danh sách file, kiểu hành động và builder FormData |
| 3 | `src/features/admin/products/api.ts` | Thêm hàm gửi đúng HTTP request cho ba hành động |
| 4 | `src/features/admin/products/queries.ts` | Tái sử dụng session snapshot, kiểm tra phiên, phân loại lỗi chưa rõ kết quả; không sửa |
| 5 | `src/features/admin/products/imageQueries.ts` | File mới: mutation, chặn gửi đồng thời, bảo vệ phiên, đánh dấu cache stale |
| 6 | `src/features/admin/products/components/ProductImageManager.tsx` | File mới: giao diện, local preview, xác nhận xóa, điều phối mutation → GET |
| 7 | `src/features/admin/products/pages/EditProductPage.tsx` | Gắn component vào trang sửa, truyền product/session/reload/quyền |
| 8 | `scripts/verify-admin-product-images.cjs` | File mới: kiểm tra validation, API, cache, phiên và handler giao diện |
| 9 | `scripts/verify-admin-product-edit.cjs` | Bổ sung mock component ảnh cho test riêng của trang E10 |

Hai file tài liệu E11 là hướng dẫn này và phần tiến độ/bàn giao trong `phase5.md`.

React quản lý hiển thị/state. Zod kiểm tra dữ liệu đầu vào. TanStack Query theo dõi request ghi/cache. Axios gửi HTTP. Backend xác thực quyền, kiểm tra nội dung ảnh, upload storage, lưu DB và quyết định ảnh primary.

## 3. Flow tổng thể

```text
EditProductPage
  ├─ useAdminProductDetail(id) → GET detail → product.images
  └─ ProductImageManager(product, session, unavailable, reload)
       ├─ file input → files: File[] → schema → local preview
       ├─ nút chọn primary → action { kind: "primary", imageId }
       └─ xác nhận xóa → action { kind: "delete", imageId }
            ↓ perform(action)
       useAdminProductImages → kiểm tra snapshot + khóa cùng sản phẩm
            ↓ mutateAdminProductImages
       Axios → POST / DELETE / PATCH → backend → DB/storage → text response
            ↓ kiểm tra phiên lần nữa
       cancel GET cũ → invalidate cache (chưa tự refetch)
            ↓ UI ghi nhận thao tác thành công
       reload() → GET detail → query cache → product.images → render lại
```

Ví dụ chọn ảnh `202` cho sản phẩm `101`: nút tạo `{ kind: "primary", imageId: "202" }`; API gửi `PATCH /api/admin/products/101/images/202/primary`. Response là text. Frontend không tự đổi primary của các ảnh trong mảng mà GET `/api/admin/products/101` để lấy kết quả chính thức.

Kiểm tra nhanh: mở Network, lọc `products/101`. Sau PATCH phải có GET detail; reload trang rồi xem nhãn đại diện. Bài tập: vì sao response text không đủ để dựng lại toàn bộ `images`?

## 4. DTO: hiểu ảnh local và ảnh server

Trong `types.ts`, ảnh server có dạng:

```ts
export interface AdminProductImageResponse {
  id: ID;
  imageUrl: string;
  displayOrder: number;
  isPrimary: boolean | null;
}
```

`interface` mô tả cấu trúc object cho TypeScript kiểm tra khi biên dịch. Nó không tạo object, không kiểm tra response lúc runtime. `ID` là alias của string: giữ được Java Long lớn hơn `Number.MAX_SAFE_INTEGER`. Không dùng `Number(image.id)`.

`boolean | null` là union: giá trị được phép là `true`, `false` hoặc `null`. UI dùng `image.isPrimary === true` để chỉ đánh dấu khi server xác nhận true. Giữ nguyên tên `isPrimary` theo DTO backend.

File mới chọn là `File`, chưa có ID trên DB. Object URL dạng `blob:...` chỉ dùng xem trước trong trình duyệt. Ảnh server có `id`, URL được lưu và trạng thái primary. Không lấy index của file chọn làm `imageId`.

Kiểm tra nhanh: chọn file nhưng chưa upload, reload trang; file chọn biến mất còn ảnh đã upload vẫn có. Bài tập: `displayOrder` có trong DTO có đồng nghĩa frontend được phép lưu reorder không?

## 5. `productImages.ts`: validation và kiểu hành động

```ts
export type ProductImageAction =
  | { kind: "upload"; files: File[] }
  | { kind: "delete"; imageId: string }
  | { kind: "primary"; imageId: string };
```

Đây là discriminated union: `kind` phân biệt ba dạng object. Khi `action.kind === "upload"`, TypeScript biết object có `files`. Sau khi xử lý và `return` khỏi nhánh upload, các nhánh còn lại có `imageId`. Không phải truyền nhiều tham số tùy chọn rồi đoán tổ hợp nào hợp lệ.

`File[]` là mảng File. `z.array(imageUploadSchema)` áp dụng schema dùng chung cho từng file: không rỗng, tối đa 5 MiB, extension và MIME phù hợp JPG/JPEG/PNG/WebP. `.min(1, ...)` yêu cầu có ảnh. `.refine(...)` kiểm tra thêm tổng dung lượng dưới 29 MiB, chừa khoảng trống multipart dưới giới hạn request 30 MB hiện tại của server. Đây là giới hạn frontend thận trọng; server vẫn quyết định request có được chấp nhận hay không.

Trong `files.reduce((total, file) => total + file.size, 0)`, `reduce` cộng dồn size từ giá trị ban đầu `0`. Mũi tên `=>` định nghĩa hàm ngắn; biểu thức sau mũi tên được trả về trực tiếp.

`buildProductImagesFormData` gọi `.parse(files)` trước khi gửi. Parse sai sẽ throw; parse đúng trả mảng đã kiểm tra. Vòng `for...of` append từng file với cùng key `images`:

```ts
const data = new FormData();
for (const file of productImagesSchema.parse(files)) data.append("images", file);
return data;
```

`new` tạo instance. `FormData` biểu diễn multipart; không phải JSON. Không append field `data` vì endpoint thêm ảnh khác endpoint tạo sản phẩm E9. Không tự đặt Content-Type: browser/Axios tạo boundary.

Kiểm tra nhanh: chọn file sai định dạng hoặc hơn 5 MiB; có lỗi và không upload được. Bài tập: `append` hai lần cùng key khác gì `set` hai lần cùng key?

## 6. `api.ts`: HTTP và cú pháp async

Hàm mới `mutateAdminProductImages(id, action, authToken): Promise<string>` gom ba request cùng nghiệp vụ. `Promise<string>` nói hàm bất đồng bộ trả kết quả chuỗi khi hoàn tất. `async` cho phép dùng `await`; lỗi request sẽ đi tới `catch` của bên gọi.

| Hành động | Method và URL dưới `/api/admin/products` | Body |
|---|---|---|
| Upload | `POST /{id}/images` | FormData với các key `images` |
| Xóa | `DELETE /{id}/images/{imageId}` | Không có |
| Chọn đại diện | `PATCH /{id}/images/{imageId}/primary` | Không có |

`isPositiveLongId` kiểm tra cả product ID và image ID trước dispatch. Template literal dùng backtick và `${id}` để ghép URL. `const { data } = await api.post<string>(...)` là destructuring: lấy property `data` từ Axios response. Generic `<string>` mô tả kiểu response, không ép backend biến response thành string.

`config.meta.authToken` truyền token snapshot qua client sẵn có. `noPublicRetry: true` dùng cơ chế client cho request quản trị. PATCH truyền `undefined` ở vị trí body để config nằm đúng tham số thứ ba. DELETE có chữ ký `delete(url, config)`, nên config là tham số thứ hai.

Kiểm tra nhanh: Network phải có đúng method, ID dạng chuỗi và multipart có các part `images`. Bài tập: vì sao không ép `responseType: "text"` dù success trả text? Gợi ý: response lỗi vẫn có thể là JSON chứa message/fieldErrors.

## 7. `queries.ts` và `imageQueries.ts`: phiên, mutation và cache

`useProductSession()` đã có từ E9/E10, đọc Zustand và trả `{ userId, role, token }`. `isCurrentProductSession(snapshot)` kiểm tra token chưa hết hạn, user/token/role khớp phiên hiện tại và có quyền `product.write`. E11 gọi lại trước dispatch, sau response và trước/sau các đoạn chờ xử lý cache. Response của tài khoản cũ không được cập nhật cache hoặc UI cho tài khoản mới.

`useAdminProductImages` là custom hook: hàm bắt đầu bằng `use`, được gọi ở đầu component theo Rules of Hooks. Nó cấu hình `useMutation` để theo dõi thao tác ghi. Đọc dữ liệu dùng `useQuery`; ghi dữ liệu dùng `useMutation`.

Key có cấu trúc `["admin", userId, role, "products", "images", id]`. Spread `...qk.admin` trải phần tử của mảng vào mảng mới. Token và File không nằm trong key. Tất cả hành động ảnh của một sản phẩm dùng chung key, nên không upload và xóa đồng thời trong cùng QueryClient.

- `useIsMutating({ mutationKey })`: số mutation cùng key đang chạy, dùng để khóa nút ở UI.
- `queryClient.isMutating(...) > 1`: mutation hiện tại cũng được đếm; nếu lớn hơn 1 đã có mutation khác, từ chối dispatch bằng lỗi 409.
- `retry: false`: không tự gửi lại request ghi.
- `networkMode: "always"`: chạy một lần ngay cả khi Query đánh dấu offline; không để request ghi xếp hàng chờ reconnect. Kết nối thực tế có thể thất bại, UI sẽ xử lý.
- `gcTime: 0`: bỏ mutation khỏi cache khi không còn observer và đã đủ điều kiện thu gom; không persist các file đã chọn.

`onSuccess` cancel các GET cũ rồi đánh dấu stale products admin đúng user/role, products public, cart và wishlist. `Promise.all` chờ các việc độc lập. `refetchType: "none"` chỉ đánh dấu dữ liệu cần làm mới; component sẽ thực hiện GET detail riêng để báo rõ lưu thành công nhưng GET lỗi.

`return { ...mutation, isPending: mutation.isPending || pendingCount > 0 }` copy các property của mutation, ghi đè `isPending` bằng trạng thái kết hợp. `||` là OR: chỉ một vế true là kết quả true.

Kiểm tra nhanh: bấm nhanh hai lần; chỉ có một request ghi. Bài tập: vì sao chỉ kiểm tra phiên trước request chưa đủ nếu người dùng logout trong lúc request chạy?

## 8. `ProductImageManager.tsx`: state và props

`Props` định nghĩa dữ liệu cha truyền xuống. `reload: () => Promise<AdminProductDetailResponse>` là property chứa một hàm không tham số, trả Promise của detail. Component không tự giữ bản sao `product.images` trong state; đọc trực tiếp props để kết quả GET được render lại.

Các state chính:

| Biến | Ý nghĩa |
|---|---|
| `files` | File local đang chọn, chưa xác nhận upload thành công |
| `deleteId` | ID ảnh đang mở xác nhận xóa; `null` khi không xác nhận ảnh nào |
| `message` / `error` | Thông báo thao tác thành công / lỗi |
| `needsRefresh` | Phải GET lại trước khi được ghi tiếp |
| `refreshing` | GET kiểm tra kết quả đang chạy |

`useState<File[]>([])` khởi tạo state mảng file rỗng với generic File[]. `useState<string | null>(null)` cho phép ID hoặc null. Setter như `setFiles` yêu cầu React render lại. `useRef(false)` tạo hộp `{ current: false }` giữ qua các lần render; thay `.current` không gây render.

`running.current` khóa tức thời trong handler, tránh khoảng trễ trước khi state mutation được render. `mounted.current` ghi component còn trên trang không. `useEffect` đặt mounted true khi mount và trả hàm cleanup đặt false khi unmount. Sau request, `active()` kiểm tra cả mounted và phiên trước khi set state.

`locked` kết hợp: đang bận, cần GET, server từ chối 403, detail không khả dụng hoặc phiên không hợp lệ. `fieldset disabled={locked}` khóa nhóm chọn/tải ảnh; từng nút ảnh cũng có disabled tương ứng. Backend vẫn là nơi kiểm tra quyền cuối cùng.

Kiểm tra nhanh: làm chậm request bằng Network throttling, bấm lưu rồi rời trang. Bài tập: khi nào dùng ref, khi nào dùng state trong hai ví dụ `running` và `refreshing`?

## 9. Chọn file và preview

Handler đọc `event.currentTarget.files`, đổi FileList thành array bằng `Array.from`. `?? []` dùng mảng rỗng khi files null/undefined. Đọc file vào biến `selected` trước khi gọi setter, vì updater có thể chạy sau khi event handler kết thúc.

```ts
const selected = Array.from(event.currentTarget.files ?? []);
setFiles((previous) => [...previous, ...selected]);
event.currentTarget.value = "";
```

Functional updater nhận state mới nhất `previous`; spread tạo mảng mới, giữ file đã chọn trước đó. Reset value của input cho phép chọn lại cùng file. Xóa file dùng `filter((_, position) => position !== index)` tạo mảng mới bỏ đúng vị trí. `_` là tham số không sử dụng.

`safeParse(file)` không throw: trả object có `success`; nếu sai, đọc `error.issues[0]?.message`. Optional chaining `?.` tránh truy cập property khi phần trước null/undefined. File sai vẫn hiện tên/lỗi và nút bỏ; chỉ file hợp lệ có preview.

`LocalPreview` dùng effect tạo `URL.createObjectURL(file)`, gán URL vào thẻ img qua ref; cleanup `URL.revokeObjectURL(url)` khi đổi file hoặc unmount. Không tạo object URL ngay trong render vì sẽ tạo mới mỗi render và khó thu hồi. URL này không gửi backend, không persist vào Zustand/query key.

`ServerImage` dùng state `failed`; `onError` bật fallback. `key={image.imageUrl}` làm component ảnh được tạo lại khi URL đổi để không giữ lỗi của URL cũ. `key={image.id}` ở li giúp React nhận diện entity ảnh ổn định trong danh sách.

Kiểm tra nhanh: chọn hai lần, bỏ file giữa, chọn lại cùng file; preview và tên phải khớp. Bài tập: bỏ file local có gọi DELETE không? Vì sao?

## 10. `perform` và `refresh`: đọc hai hàm này để hiểu nghiệp vụ

`perform(action)` thực hiện tuần tự:

1. Kiểm tra khóa và phiên; đặt ref khóa tức thời; xóa message/error cũ.
2. `await mutation.mutateAsync({ action, session: { ...session } })` gửi request với bản chụp phiên.
3. Nếu component/phiên còn hợp lệ: upload thành công thì xóa `files`; đóng xác nhận; ghi thông báo thành công.
4. Đặt `needsRefresh = true`, rồi gọi `refresh()` để GET detail.
5. Nếu mutation lỗi: giữ file local, hiển thị lỗi. Với timeout/mất mạng/408/5xx hoặc 404 thì yêu cầu GET kiểm tra trước khi ghi tiếp.
6. `finally` mở khóa ref sau khi toàn bộ xử lý kết thúc.

`try/catch/finally` chia nhánh thành công, lỗi và việc luôn cần chạy. `cause instanceof Error` thu hẹp kiểu lỗi để đọc `.message`; không giả định mọi thứ bị throw đều là Error.

`refresh()` đặt trạng thái GET đang chạy, gọi `reload()` từ cha. Thành công: mở khóa `needsRefresh`, đóng xác nhận, xóa lỗi và `mutation.reset()`. Reset mutation chỉ xóa trạng thái lỗi/thành công của hook; không xóa query cache hay gửi request ghi. GET lỗi: giữ `needsRefresh = true` và hướng dẫn thử GET lại.

Điểm cần hiểu: mutation thành công rồi GET thất bại vẫn là **đã lưu**. Hàm `refresh` tự bắt lỗi GET, nên lỗi GET không chạy vào catch mutation rồi báo sai là upload thất bại. Nút **Tải lại ảnh để kiểm tra** chỉ gọi GET.

Timeout có thể xảy ra sau khi server đã lưu. Vì vậy không tự retry POST. File local vẫn được giữ; sau GET người dùng phải bỏ file đã xuất hiện trên server trước khi tải tiếp để tránh trùng. 404 có thể là ảnh bị xóa ở tab khác hoặc product mất; GET detail giúp phân biệt. 403 khóa ghi và yêu cầu cập nhật phiên.

Kiểm tra nhanh: chặn GET sau POST thành công; phải thấy **Đã thêm ảnh** cùng lỗi tải lại, không có POST thứ hai khi bấm kiểm tra. Bài tập: xóa ảnh primary xong, frontend có được tự chọn ảnh đầu tiên làm primary không?

## 11. JSX và phần gắn trang

JSX trông giống HTML nhưng là cú pháp tạo React element. `{...}` chèn biểu thức JavaScript. `condition && <p>...</p>` render khi condition đúng; `condition ? A : B` chọn một trong hai nhánh. `.map(image => <li ...>)` tạo danh sách element; `product.images ?? []` hỗ trợ response images null.

`onClick={() => void perform(...)}` truyền một hàm vào sự kiện. Không viết `onClick={perform(...)}` vì sẽ gọi ngay trong render. `void` bỏ qua giá trị Promise trả về; lỗi nghiệp vụ đã được bắt trong `perform`. `type="button"` ngăn nút vô tình submit một form bao ngoài. `aria-label`, `aria-labelledby`, `role="alert"`, `role="status"` hỗ trợ tên truy cập và thông báo cho công nghệ hỗ trợ.

Trong `EditProductPage.tsx`, thêm import `ProductImageManager` và đặt component sau `SavedProductVariants`. `product` là data từ query detail; `session` là phiên đã kiểm tra; `unavailable` đúng khi detail báo 403/404; `reload` dùng `query.refetch()` và throw khi GET thất bại hoặc không có data.

Key `images:${session.userId}:${session.role}:${productId}` giúp reset state local khi đổi sản phẩm hoặc user/role. Khu ảnh nằm ngoài `EditProductForm`, nên nút tải/xóa ảnh không submit form metadata. GET mới không reset bản nháp metadata đang dirty vì form E10 đã có cơ chế giữ draft.

Kiểm tra nhanh: sửa tên nhưng chưa lưu, sau đó chọn ảnh primary; tên đang nhập phải được giữ. Bài tập: vì sao không đưa `files` vào state của form sửa metadata và gửi chung PUT sản phẩm?

## 12. Backend đã đối chiếu và giới hạn

Đã đọc controller, service, mapper, DTO ảnh và `FileValidator` trong repository backend tham chiếu; không sửa backend.

- Controller cho ADMIN/MANAGER/STAFF quản lý ảnh; các endpoint trả text.
- Upload validate từng file và đưa lên storage. FE kiểm tra MIME/extension/size; kiểm tra chữ ký nội dung do backend chịu trách nhiệm.
- Xóa tìm đúng ảnh thuộc product; không có ảnh thì 404. Nếu còn ảnh nhưng thiếu primary, service chọn phần tử đầu còn lại.
- Primary tìm ảnh thuộc product rồi đặt các cờ ở server. Mapper trả đúng `isPrimary`.
- Upload khi product có ảnh nhưng tất cả thiếu primary hiện không bảo đảm tự chọn primary, vì điều kiện service phụ thuộc `displayOrder == 1`. UI phản ánh response thật, cho chọn primary thủ công, không tự gắn cờ.
- Không có transaction lock/version để ngăn ghi đồng thời giữa hai tab/người dùng. Khóa QueryClient chỉ bảo vệ cùng ứng dụng đang chạy. Luôn GET lại, không khẳng định frontend giải quyết toàn bộ race của backend.
- Chưa xác minh vòng đời xóa file storage hoặc rollback upload khi một file sau lỗi. Không coi bản ghi DB và file storage luôn đồng bộ chỉ từ kiểm tra frontend.

## 13. Kiểm tra và commit

```sh
npm run typecheck
npm run lint
npm run build
node --test scripts/verify-admin-product-images.cjs scripts/verify-admin-product-edit.cjs scripts/verify-admin-product-create.cjs
npm run verify:catalog
git diff --check
```

Script E11 dùng loader transpile TypeScript và mocks cho API/hooks. QueryClient/MutationObserver thật kiểm tra cache và mutation; SSR kiểm tra markup; harness mô phỏng hook chạy handler thật. Các kiểm tra này không chứng minh DOM/browser hoặc server/storage thật. Test E10 thêm mock component ảnh vì nó chỉ kiểm tra trách nhiệm riêng của trang; component ảnh có test riêng ở E11.

Checklist tích hợp: thử A/M/S và CUSTOMER; upload nhiều ảnh thật; file giả nội dung; tổng request lớn; xóa primary/cuối cùng; xóa ảnh đã mất ở tab khác; chọn primary rồi reload/catalog/cart/wishlist; ảnh URL hỏng; mobile/bàn phím; giữ draft metadata; 403/404/mất mạng; request chậm rồi logout/đổi tài khoản/rời trang. Không gửi lại POST khi chưa rõ kết quả lần trước.

Commit đề xuất: `feat(admin-products): manage product images and primary selection`. Chưa tạo commit hoặc push.
