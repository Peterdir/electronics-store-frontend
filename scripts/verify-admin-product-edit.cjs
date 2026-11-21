/* Chạy: node --test scripts/verify-admin-product-edit.cjs. HTTP giả lập, không sửa dữ liệu thật. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { QueryClient, MutationObserver, QueryObserver, onlineManager } = require("@tanstack/react-query");

const root = path.resolve(__dirname, "..");
function createLoader(mocks = {}) {
  const cache = new Map();
  function load(specifier, parent = path.join(root, "src", "index.ts")) {
    const resolved = specifier.startsWith("@/") ? path.join(root, "src", specifier.slice(2))
      : specifier.startsWith(".") ? path.resolve(path.dirname(parent), specifier) : null;
    const alias = resolved ? "@/" + path.relative(path.join(root, "src"), resolved).split(path.sep).join("/") : specifier;
    if (Object.hasOwn(mocks, alias)) return mocks[alias];
    if (!resolved) return require(specifier);
    const filename = [resolved + ".ts", resolved + ".tsx", resolved].find(fs.existsSync);
    if (!filename) throw new Error("Cannot load " + specifier);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    new Function("require", "module", "exports", output)((name) => load(name, filename), module, module.exports);
    return module.exports;
  }
  return load;
}
const load = createLoader();
const { editProductSchema, toEditProductValues, buildUpdateProductRequest } = load("@/features/admin/products/editProduct");
function productFixture() {
  return {
    id: "9007199254740993", name: "Điện thoại", categoryId: "9223372036854775807", categoryName: "Điện thoại",
    brandId: null, brandName: null, basePrice: 12000.5, description: null, status: "HIDDEN", images: [],
    specification: { RAM: "8 GB", cores: 8, wireless: true, optional: null, sizes: [1, 2], detail: { unit: "GB" } },
    variants: [{ id: "9007199254740994", sku: "SKU-DEN", price: 13000, stock: 3, attributes: { Màu: "Đen" }, status: "INACTIVE", images: [] }],
    totalStock: 3, createdAt: "2026-11-21T00:00:00Z", updatedAt: "2026-11-21T00:00:00Z",
  };
}
const token = "fixture." + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url") + ".fixture";

test("Detail -> defaults -> PUT giữ ID Long, brand null và kiểu dữ liệu specification; không có variants/status/images/stock", () => {
  const product = productFixture();
  const values = toEditProductValues(product);
  assert.equal(values.categoryId, product.categoryId);
  assert.equal(values.brandId, "");
  assert.equal(values.description, "");
  const dto = buildUpdateProductRequest({ ...values, variants: product.variants, stock: 0, status: "ACTIVE", images: ["x"] });
  assert.deepEqual(Object.keys(dto).sort(), ["name", "categoryId", "brandId", "basePrice", "description", "specification"].sort());
  assert.deepEqual(dto.specification, product.specification);
  assert.equal(dto.brandId, null);
  assert.equal(dto.basePrice, 12000.5);
  assert.equal(editProductSchema.safeParse(values).success, true);
});

test("Schema sửa không đòi biến thể; chặn ID/tiền/key trùng/JSON hỏng, cho phép xóa hết specification", () => {
  const values = toEditProductValues(productFixture());
  for (const patch of [{ name: " " }, { categoryId: "0" }, { categoryId: "9223372036854775808" }, { brandId: "bad" }, { basePrice: "-1" }, { basePrice: "Infinity" }]) {
    assert.equal(editProductSchema.safeParse({ ...values, ...patch }).success, false);
  }
  assert.equal(editProductSchema.safeParse({ ...values, specification: [{ key: "RAM", value: "8", format: "text" }, { key: " RAM ", value: "16", format: "text" }] }).success, false);
  const invalid = editProductSchema.safeParse({ ...values, specification: [{ key: "RAM", value: "{broken", format: "json" }] });
  assert.equal(invalid.success, false);
  assert.equal(invalid.error.issues[0].path.join("."), "specification.0.value");
  assert.deepEqual(buildUpdateProductRequest({ ...values, specification: [] }).specification, {});
  const proto = buildUpdateProductRequest({ ...values, specification: [{ key: "__proto__", value: "safe", format: "text" }] });
  assert.equal(Object.hasOwn(proto.specification, "__proto__"), true);
});

test("HTTP Axios GET/PUT thật: kho thay đổi sau GET vẫn giữ nguyên, PUT JSON/text success và JSON fieldErrors", async () => {
  const previousWindow = global.window;
  global.window = { location: { origin: "http://localhost" } };
  let stock = 3;
  let captured;
  let rejected = false;
  const server = http.createServer(async (request, response) => {
    if (request.method === "GET") {
      response.writeHead(200, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ ...productFixture(), totalStock: stock }));
      return;
    }
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = JSON.parse(Buffer.concat(chunks).toString());
    captured = { body, headers: request.headers, url: request.url, method: request.method };
    // Mô phỏng đúng nhánh backend chỉ ghi kho khi có variants.
    if (body.variants) stock = body.variants[0].stock;
    response.writeHead(rejected ? 400 : 200, { "Content-Type": rejected ? "application/json" : "text/plain" });
    response.end(rejected ? JSON.stringify({ message: "Invalid category", validationErrors: { categoryId: "Category missing" } }) : "Product updated successfully.");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const httpLoad = createLoader({
      "@/shared/config/env": { env: { API_BASE_URL: `http://127.0.0.1:${server.address().port}` } },
      "@/shared/auth/session.store": { useSession: { getState: () => ({ token }) } },
    });
    httpLoad("@/shared/api/client").api.defaults.proxy = false;
    const api = httpLoad("@/features/admin/products/api");
    const product = await api.getAdminProductDetail(productFixture().id, new AbortController().signal, token);
    stock = 29;
    assert.equal(await api.updateAdminProduct(product.id, { ...toEditProductValues(product), description: "Mô tả mới" }, token), "Product updated successfully.");
    assert.equal(stock, 29);
    assert.equal(captured.url, `/api/admin/products/${product.id}`);
    assert.equal(captured.method, "PUT");
    assert.match(captured.headers["content-type"], /application\/json/);
    assert.equal(captured.headers.authorization, `Bearer ${token}`);
    assert.equal(Object.hasOwn(captured.body, "variants"), false);
    rejected = true;
    await assert.rejects(api.updateAdminProduct(product.id, toEditProductValues(product), token), (error) => error.status === 400 && error.fieldErrors.categoryId === "Category missing");
    await assert.rejects(api.getAdminProductDetail("0", new AbortController().signal, token), (error) => error.status === 400);
    await assert.rejects(api.updateAdminProduct("../1", toEditProductValues(product), token), (error) => error.status === 400);
  } finally {
    await new Promise((resolve) => server.close(resolve));
    global.window = previousWindow;
  }
});

function queryFixture(update = async () => "updated", read = async () => productFixture()) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const snapshot = { userId: "100", role: "STAFF", token };
  let current = { user: { id: snapshot.userId, role: snapshot.role }, token };
  const useSession = (select) => select(current);
  useSession.getState = () => current;
  let options;
  const toasts = [];
  const fixtureLoad = createLoader({
    "@/shared/auth/session.store": { useSession },
    "@/features/admin/products/api": { updateAdminProduct: update, getAdminProductDetail: read },
    "@/features/admin/categories/api": {}, "@/features/admin/brands/api": {},
    "@tanstack/react-query": {
      ...require("@tanstack/react-query"), useQueryClient: () => queryClient, useIsMutating: () => 0,
      useMutation: (value) => { options = value; return {}; }, useQuery: (value) => value,
    },
    sonner: { toast: { success: (message) => toasts.push(message) } },
  });
  const queries = fixtureLoad("@/features/admin/products/queries");
  queries.useUpdateAdminProduct(productFixture().id);
  return {
    queryClient, snapshot, queries, toasts,
    ApiError: fixtureLoad("@/shared/api/errors").ApiError,
    setCurrent: (value) => { current = value; },
    run: () => new MutationObserver(queryClient, options).mutate({ values: toEditProductValues(productFixture()), session: snapshot }),
  };
}

test("GET detail khóa user/role, chặn ID sai/CUSTOMER/phiên đổi và abort", async () => {
  let release;
  const fixture = queryFixture(undefined, () => new Promise((resolve) => { release = resolve; }));
  const query = fixture.queries.useAdminProductDetail(productFixture().id);
  assert.deepEqual(query.queryKey, ["admin", "100", "STAFF", "products", "detail", productFixture().id]);
  assert.equal(query.enabled, true);
  assert.equal(fixture.queries.useAdminProductDetail(undefined).enabled, false);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(query.queryFn({ signal: controller.signal }), (error) => error.name === "AbortError");
  const promise = query.queryFn({ signal: new AbortController().signal });
  fixture.setCurrent({ user: { id: "200", role: "CUSTOMER" }, token: "other" });
  release(productFixture());
  await assert.rejects(promise, (error) => error.status === 401);
  assert.equal(fixture.queries.useAdminProductDetail("1").enabled, false);
  fixture.queryClient.clear();
});

test("PUT chặn phiên thay đổi trước dispatch và response muộn sau đổi tài khoản", async () => {
  let calls = 0;
  let release;
  const fixture = queryFixture(() => { calls++; return new Promise((resolve) => { release = resolve; }); });
  const key = ["admin", "100", "STAFF", "products"];
  fixture.queryClient.setQueryData(key, "old");
  const promise = fixture.run();
  await new Promise(setImmediate);
  fixture.setCurrent({ user: { id: "200", role: "STAFF" }, token: "other" });
  release("updated");
  await assert.rejects(promise, (error) => error.status === 401);
  await assert.rejects(fixture.run(), (error) => error.status === 401);
  assert.equal(calls, 1);
  assert.deepEqual(fixture.toasts, []);
  assert.equal(fixture.queryClient.getQueryState(key).isInvalidated, false);
  fixture.queryClient.clear();
});

test("Hai PUT đồng thời cùng sản phẩm chỉ dispatch một lần", async () => {
  let release;
  let calls = 0;
  const fixture = queryFixture(() => { calls++; return new Promise((resolve) => { release = resolve; }); });
  const first = fixture.run();
  await new Promise(setImmediate);
  await assert.rejects(fixture.run(), (error) => error.status === 409);
  release("updated");
  await first;
  assert.equal(calls, 1);
  fixture.queryClient.clear();
});

test("PUT thành công đánh dấu cache đúng phiên; GET lỗi chạy riêng vẫn giữ trạng thái lưu thành công", async () => {
  const fixture = queryFixture();
  const keys = [["admin", "100", "STAFF", "products", "detail", productFixture().id], ["admin", "100", "STAFF", "products", "list"], ["admin", "100", "STAFF", "inventory"], ["products"], ["cart"], ["wishlist"]];
  for (const key of keys) fixture.queryClient.setQueryData(key, "old");
  const other = ["admin", "200", "STAFF", "products"];
  fixture.queryClient.setQueryData(other, "other");
  const active = new QueryObserver(fixture.queryClient, { queryKey: keys[0], queryFn: async () => { throw new Error("GET failed"); }, staleTime: Infinity });
  const unsubscribe = active.subscribe(() => {});
  assert.equal(await fixture.run(), "updated");
  for (const key of keys) assert.equal(fixture.queryClient.getQueryState(key).isInvalidated, true);
  assert.equal(fixture.queryClient.getQueryState(other).isInvalidated, false);
  assert.equal((await active.refetch()).isError, true);
  assert.equal(fixture.toasts.length, 1);
  unsubscribe();
  fixture.queryClient.clear();
});

test("Offline/timeout không xếp hàng hoặc tự replay PUT khi reconnect", async () => {
  let calls = 0;
  const fixture = queryFixture(async () => { calls++; throw new fixture.ApiError(0, "timeout"); });
  onlineManager.setOnline(false);
  try {
    await assert.rejects(fixture.run(), (error) => error.status === 0);
    onlineManager.setOnline(true);
    await new Promise(setImmediate);
    assert.equal(calls, 1);
  } finally {
    onlineManager.setOnline(true);
    fixture.queryClient.clear();
  }
});

test("SSR: form sửa không có input biến thể/stock/ảnh; giữ relation bị thiếu và hiển thị biến thể chỉ xem", () => {
  const uiLoad = createLoader({
    "@/features/admin/products/queries": {
      isCurrentProductSession: () => true, isProductWriteUncertain: () => false,
      useAdminProductCategories: () => ({ data: [] }), useAdminProductBrands: () => ({ data: [] }),
      useUpdateAdminProduct: () => ({ isPending: false, error: null }),
    },
  });
  const { EditProductForm } = uiLoad("@/features/admin/products/components/EditProductForm");
  const { SavedProductVariants } = uiLoad("@/features/admin/products/components/SavedProductVariants");
  const product = { ...productFixture(), brandId: "25", brandName: "Nhãn cũ" };
  const markup = renderToStaticMarkup(React.createElement(require("react-router").MemoryRouter, null,
    React.createElement(EditProductForm, { product, session: {}, unavailable: false, reload: async () => product })));
  assert.match(markup, /chưa có trong lựa chọn/);
  assert.match(markup, /Nhãn cũ/);
  assert.match(markup, /JSON/);
  assert.doesNotMatch(markup, /name="variants|name=".*stock|type="file"/);
  const variants = renderToStaticMarkup(React.createElement(SavedProductVariants, { product }));
  assert.match(variants, /SKU-DEN/);
  assert.match(variants, /chỉ xem/);
  assert.doesNotMatch(variants, /<input|<button/);
});

// Harness chạy handler thật của form, mô phỏng hook state; không thay thế kiểm thử browser.
function formFixture() {
  let index = 0;
  const slots = [];
  let submitHandler;
  let pendingEffects = [];
  const resets = [];
  const values = { ...toEditProductValues(productFixture()), description: "Bản nháp" };
  let dirty = true;
  let calls = 0;
  let reads = 0;
  let readFailure = true;
  let product = productFixture();
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const hooks = {
    ...React,
    useRef: (value) => { const slot = index++; slots[slot] ??= { current: value }; return slots[slot]; },
    useState: (value) => { const slot = index++; if (!(slot in slots)) slots[slot] = value; return [slots[slot], (next) => { slots[slot] = next; }]; },
    useEffect: (fn, deps) => { const slot = index++; if (!same(slots[slot], deps)) { slots[slot] = deps; pendingEffects.push(fn); } },
  };
  const form = {
    control: {}, formState: { errors: {} }, clearErrors: () => {}, setError: () => {},
    reset: (next) => { resets.push(next); dirty = false; },
    handleSubmit: (fn) => { submitHandler = fn; return () => {}; },
  };
  const fixtureLoad = createLoader({
    react: hooks,
    "react-hook-form": { FormProvider: "provider", useForm: () => { form.formState.isDirty = dirty; return form; }, useWatch: ({ name }) => values[name] },
    "@/features/admin/products/queries": {
      isCurrentProductSession: () => true, isProductWriteUncertain: () => false,
      useAdminProductCategories: () => ({ data: [] }), useAdminProductBrands: () => ({ data: [] }),
      useUpdateAdminProduct: () => ({ isPending: false, error: null, reset: () => {}, mutateAsync: async () => { calls++; } }),
    },
  });
  const { EditProductForm } = fixtureLoad("@/features/admin/products/components/EditProductForm");
  const render = () => {
    index = 0;
    const tree = EditProductForm({ product, session: {}, unavailable: false, reload: async () => {
      reads++;
      if (readFailure) throw new Error("GET failed");
      return { ...product, description: "Giá trị server" };
    } });
    for (const effect of pendingEffects) effect();
    pendingEffects = [];
    tree.props.children.props.onSubmit({});
    return tree;
  };
  render();
  return { render, resets, submit: () => submitHandler(values), calls: () => calls, reads: () => reads,
    setProduct: (next) => { product = next; }, setDirty: (next) => { dirty = next; },
    allowRead: () => { readFailure = false; },
  };
}

test("Handler form thật: refetch không reset dirty, clean được reset; PUT thành công/GET lỗi không gửi lại PUT", async () => {
  const fixture = formFixture();
  assert.equal(fixture.resets.length, 0);
  fixture.setProduct({ ...productFixture(), description: "Tab khác", totalStock: 29 });
  fixture.render();
  assert.equal(fixture.resets.length, 0);
  fixture.setDirty(false);
  fixture.render();
  assert.equal(fixture.resets[0].description, "Tab khác");
  fixture.setDirty(true);
  fixture.render();
  await fixture.submit();
  assert.equal(fixture.calls(), 1);
  assert.equal(fixture.reads(), 1);
  const tree = fixture.render();
  assert.equal(tree.props.children.props.children[0].props.disabled, true);
  await fixture.submit();
  assert.equal(fixture.calls(), 1);
  fixture.allowRead();
  const children = tree.props.children.props.children;
  const retry = children.find((child) => child && child.props?.children === "Tải lại để kiểm tra kết quả");
  retry.props.onClick();
  await new Promise(setImmediate);
  assert.equal(fixture.calls(), 1);
  assert.equal(fixture.reads(), 2);
  assert.equal(fixture.resets.at(-1).description, "Giá trị server");
});

test("Deep link edit giữ ID/query/hash cho A/M/S, từ chối CUSTOMER và ID sai", () => {
  const previousWindow = global.window;
  global.window = { location: { origin: "http://localhost" } };
  try {
    const { getLoginDestination } = load("@/shared/auth/redirect");
    const target = "/admin/products/9007199254740993/edit?from=list#specification";
    for (const role of ["ADMIN", "MANAGER", "STAFF"]) assert.equal(getLoginDestination(role, target), target);
    assert.equal(getLoginDestination("CUSTOMER", target), "/");
    assert.equal(getLoginDestination("ADMIN", "/admin/products/0/edit"), "/admin");
  } finally {
    global.window = previousWindow;
  }
});

test("Page thật: loading, GET lỗi/403/404, ID sai; lỗi refetch vẫn giữ form có cache", () => {
  const { MemoryRouter, Routes, Route } = require("react-router");
  let query = {};
  const pageLoad = createLoader({
    "@/features/admin/products/queries": {
      useProductSession: () => ({ userId: "100", role: "STAFF" }), isCurrentProductSession: () => true,
      useAdminProductDetail: () => query,
    },
    "@/features/admin/products/components/EditProductForm": { EditProductForm: () => React.createElement("p", null, "Bản nháp còn nguyên") },
  });
  const { EditProductPage } = pageLoad("@/features/admin/products/pages/EditProductPage");
  const { ApiError } = pageLoad("@/shared/api/errors");
  const render = (id = "1") => renderToStaticMarkup(React.createElement(MemoryRouter, { initialEntries: [`/admin/products/${id}/edit`] },
    React.createElement(Routes, null, React.createElement(Route, { path: "/admin/products/:id/edit", element: React.createElement(EditProductPage) }))));
  assert.match(render(), /Đang tải sản phẩm/);
  assert.match(render("0"), /Mã sản phẩm không hợp lệ/);
  query = { isError: true, error: new ApiError(404, "Missing") };
  assert.match(render(), /Không tìm thấy sản phẩm/);
  query = { isError: true, error: new ApiError(403, "Forbidden") };
  assert.match(render(), /không có quyền xem/);
  query = { isError: true, error: new Error("GET failed"), data: productFixture() };
  assert.match(render(), /Bản nháp còn nguyên/);
  assert.match(render(), /GET failed/);
});
