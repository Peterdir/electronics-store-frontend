/* Chạy: node --test scripts/verify-admin-product-create.cjs. Không cần backend thật. */
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
const { createProductSchema, newProductFormValues } = load("@/features/admin/products/schemas");
const { buildCreateProductRequest, buildCreateProductFormData } = load("@/features/admin/products/buildCreateProductRequest");
function validForm() {
  return {
    ...newProductFormValues(), name: "  Điện thoại thử  ", categoryId: "9223372036854775807", basePrice: "12000.50",
    specification: [{ key: " Màn hình ", value: " 6 inch " }],
    variants: [
      { sku: " SKU-DEN ", price: "12500", stock: "2", attributes: [{ key: "Màu", value: "Đen" }] },
      { sku: "SKU-TRANG", price: "0", stock: "0", attributes: [{ key: "Màu", value: "Trắng" }] },
    ],
  };
}

test("Giá trị khởi tạo không hợp lệ trước khi điền; không dùng chung mảng giữa hai form", () => {
  const first = newProductFormValues();
  first.variants[0].attributes.push({ key: "Màu", value: "Đen" });
  assert.deepEqual(newProductFormValues().variants[0].attributes, []);
  assert.equal(createProductSchema.safeParse(first).success, false);
});

test("DTO trim chuỗi, giữ ID Long lớn, chuyển tiền/stock và tách thuộc tính từng variant", () => {
  const dto = buildCreateProductRequest(validForm());
  assert.equal(dto.name, "Điện thoại thử");
  assert.equal(dto.categoryId, "9223372036854775807");
  assert.equal(dto.brandId, null);
  assert.equal(dto.basePrice, 12000.5);
  assert.deepEqual(dto.specification, { "Màn hình": "6 inch" });
  assert.deepEqual(dto.variants, [
    { sku: "SKU-DEN", price: 12500, stock: 2, attributes: { "Màu": "Đen" } },
    { sku: "SKU-TRANG", price: 0, stock: 0, attributes: { "Màu": "Trắng" } },
  ]);
  assert.equal(Object.hasOwn(dto, "images"), false);
  assert.equal(Object.hasOwn(dto, "status"), false);
});

test("Chặn ID thiếu/sai/vượt Long; brand tùy chọn vẫn phải là ID hợp lệ khi chọn", () => {
  for (const id of ["", "0", "-1", "1.5", "01", "9223372036854775808"]) {
    assert.equal(createProductSchema.safeParse({ ...validForm(), categoryId: id }).success, false, id);
  }
  assert.equal(createProductSchema.safeParse({ ...validForm(), brandId: "abc" }).success, false);
  assert.equal(buildCreateProductRequest({ ...validForm(), brandId: "9007199254740993" }).brandId, "9007199254740993");
});

test("Chặn ô tiền rỗng/âm/không hữu hạn/quá lớn và tồn kho thập phân/không an toàn", () => {
  for (const value of ["", " ", "-1", "NaN", "Infinity", "1e3", "9007199254740992"]) {
    assert.equal(createProductSchema.safeParse({ ...validForm(), basePrice: value }).success, false, value);
    const form = validForm();
    form.variants[0].price = value;
    assert.equal(createProductSchema.safeParse(form).success, false, value);
  }
  for (const value of ["", "-1", "1.5", "NaN", "Infinity", "9007199254740992"]) {
    const form = validForm();
    form.variants[0].stock = value;
    assert.equal(createProductSchema.safeParse(form).success, false, value);
  }
});

test("Chặn SKU trống/trùng sau trim và ít nhất một variant", () => {
  assert.equal(createProductSchema.safeParse({ ...validForm(), variants: [] }).success, false);
  for (const sku of [" ", " sku-den "]) {
    const form = validForm();
    form.variants[1].sku = sku;
    const result = createProductSchema.safeParse(form);
    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((issue) => issue.path.join(".") === "variants.1.sku"));
  }
});

test("Chặn key trùng và dòng thiếu key/value trong thông số lẫn thuộc tính", () => {
  for (const rows of [
    [{ key: "RAM", value: "8" }, { key: " RAM ", value: "16" }],
    [{ key: " ", value: "8" }], [{ key: "RAM", value: " " }],
  ]) {
    assert.equal(createProductSchema.safeParse({ ...validForm(), specification: rows }).success, false);
    const form = validForm();
    form.variants[0].attributes = rows;
    assert.equal(createProductSchema.safeParse(form).success, false);
  }
  const form = validForm();
  form.specification = [{ key: "__proto__", value: "safe own key" }];
  const dto = buildCreateProductRequest(form);
  assert.equal(Object.getPrototypeOf(dto.specification), Object.prototype);
  assert.equal(Object.hasOwn(dto.specification, "__proto__"), true);
});

test("Ảnh tùy chọn; chặn file rỗng/sai MIME/quá 5 MiB và báo đúng index", () => {
  assert.equal(createProductSchema.safeParse(validForm()).success, true);
  const valid = new File(["image"], "image.webp", { type: "image/webp" });
  for (const file of [
    new File([], "empty.png", { type: "image/png" }),
    new File(["text"], "fake.jpg", { type: "text/plain" }),
    new File(["image"], "bad.gif", { type: "image/gif" }),
    new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.png", { type: "image/png" }),
  ]) {
    const result = createProductSchema.safeParse({ ...validForm(), images: [valid, file] });
    assert.equal(result.success, false);
    assert.ok(result.error.issues.some((issue) => issue.path.join(".") === "images.1"));
  }
});

test("FormData có một data JSON và lặp key images đúng thứ tự; không ép Content-Type", async () => {
  const form = validForm();
  form.images = [new File(["first"], "first.png", { type: "image/png" }), new File(["second"], "second.webp", { type: "image/webp" })];
  const data = buildCreateProductFormData(form);
  assert.equal(data.getAll("data").length, 1);
  assert.deepEqual(JSON.parse(data.get("data")), buildCreateProductRequest(form));
  assert.deepEqual(data.getAll("images").map((file) => file.name), ["first.png", "second.webp"]);
  assert.equal(await data.getAll("images")[1].text(), "second");
  assert.deepEqual([...buildCreateProductFormData(validForm()).keys()], ["data"]);
});

test("Axios gửi multipart thật và đọc response text; lỗi category đã xóa không mất ý nghĩa", async () => {
  const previousWindow = global.window;
  global.window = { location: { origin: "http://localhost" } };
  let captured;
  let missing = false;
  const server = http.createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const data = await new Request("http://localhost/", {
      method: "POST", headers: request.headers, body: Buffer.concat(chunks),
    }).formData();
    captured = { url: request.url, method: request.method, headers: request.headers, data };
    response.writeHead(missing ? 404 : 200, { "Content-Type": missing ? "application/json" : "text/plain" });
    response.end(missing ? JSON.stringify({ message: "Category not found" }) : "Product created successfully.");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const token = "fixture." + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url") + ".fixture";
    const httpLoad = createLoader({
      "@/shared/config/env": { env: { API_BASE_URL: `http://127.0.0.1:${server.address().port}` } },
      "@/shared/auth/session.store": { useSession: { getState: () => ({ token }) } },
    });
    httpLoad("@/shared/api/client").api.defaults.proxy = false;
    const { createAdminProduct } = httpLoad("@/features/admin/products/api");
    const form = validForm();
    form.images = [new File(["pixels"], "sample.png", { type: "image/png" })];
    assert.equal(await createAdminProduct(form, token), "Product created successfully.");
    assert.equal(captured.url, "/api/admin/products");
    assert.equal(captured.method, "POST");
    assert.match(captured.headers["content-type"], /^multipart\/form-data; boundary=/);
    assert.equal(captured.headers.authorization, `Bearer ${token}`);
    assert.equal(JSON.parse(captured.data.get("data")).categoryId, form.categoryId);
    assert.equal(await captured.data.get("images").text(), "pixels");
    missing = true;
    await assert.rejects(createAdminProduct(form, token), (error) => error.status === 404 && error.message === "Category not found");
  } finally {
    await new Promise((resolve) => server.close(resolve));
    global.window = previousWindow;
  }
});

function mutationFixture(create = async () => "created") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const token = "fixture." + Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url") + ".fixture";
  const snapshot = { userId: "100", role: "STAFF", token };
  let current = { user: { id: snapshot.userId, role: snapshot.role }, token };
  const useSession = (select) => select(current);
  useSession.getState = () => current;
  let options;
  const toasts = [];
  const fixtureLoad = createLoader({
    "@/shared/auth/session.store": { useSession },
    "@/features/admin/products/api": { createAdminProduct: create },
    "@/features/admin/categories/api": {},
    "@/features/admin/brands/api": {},
    "@tanstack/react-query": {
      ...require("@tanstack/react-query"), useQueryClient: () => queryClient,
      useIsMutating: () => 0, useMutation: (value) => { options = value; return {}; },
    },
    sonner: { toast: { success: (message) => toasts.push(message) } },
  });
  const queries = fixtureLoad("@/features/admin/products/queries");
  queries.useCreateAdminProduct();
  const observer = () => new MutationObserver(queryClient, options);
  return {
    queryClient, snapshot, queries, toasts, observer,
    ApiError: fixtureLoad("@/shared/api/errors").ApiError,
    setCurrent: (value) => { current = value; },
    run: () => observer().mutate({ values: validForm(), session: snapshot }),
  };
}

test("ADMIN/MANAGER/STAFF hợp lệ; chặn CUSTOMER, token hết hạn và đổi phiên trước dispatch", async () => {
  let calls = 0;
  const fixture = mutationFixture(async () => { calls++; return "created"; });
  for (const role of ["ADMIN", "MANAGER", "STAFF"]) {
    const session = { ...fixture.snapshot, role };
    fixture.setCurrent({ user: { id: session.userId, role }, token: session.token });
    assert.equal(fixture.queries.isCurrentProductSession(session), true);
  }
  fixture.setCurrent({ user: { id: "100", role: "CUSTOMER" }, token: fixture.snapshot.token });
  assert.equal(fixture.queries.isCurrentProductSession({ ...fixture.snapshot, role: "CUSTOMER" }), false);
  await assert.rejects(fixture.run(), (error) => error.status === 401);
  fixture.setCurrent({ user: { id: "200", role: "STAFF" }, token: fixture.snapshot.token });
  await assert.rejects(fixture.run(), (error) => error.status === 401);
  assert.equal(fixture.queries.isCurrentProductSession({ ...fixture.snapshot, token: "expired" }), false);
  assert.equal(calls, 0);
  fixture.queryClient.clear();
});

test("Đổi tài khoản trong khi POST: không toast, không invalidate cache hoặc báo thành công cho phiên mới", async () => {
  let release;
  const fixture = mutationFixture(() => new Promise((resolve) => { release = resolve; }));
  const key = ["admin", "100", "STAFF", "products", "list"];
  fixture.queryClient.setQueryData(key, ["old"]);
  const promise = fixture.run();
  await new Promise(setImmediate);
  fixture.setCurrent({ user: { id: "200", role: "STAFF" }, token: "other" });
  release("created");
  await assert.rejects(promise, (error) => error.status === 401);
  assert.deepEqual(fixture.toasts, []);
  assert.equal(fixture.queryClient.getQueryState(key).isInvalidated, false);
  fixture.queryClient.clear();
});

test("Hai mutation cùng phiên chỉ dispatch một POST", async () => {
  let release;
  let calls = 0;
  const fixture = mutationFixture(() => { calls++; return new Promise((resolve) => { release = resolve; }); });
  const first = fixture.run();
  await new Promise(setImmediate);
  await assert.rejects(fixture.run(), (error) => error.status === 409);
  release("created");
  await first;
  assert.equal(calls, 1);
  fixture.queryClient.clear();
});

test("POST thành công nhưng refetch GET thất bại vẫn thành công; invalidate đúng cache liên quan", async () => {
  const fixture = mutationFixture();
  const keys = [
    ["admin", "100", "STAFF", "products", "list"], ["admin", "100", "STAFF", "inventory"],
    ["admin", "100", "STAFF", "categories"], ["admin", "100", "STAFF", "brands"],
    ["products", "detail", "500"], ["categories"], ["brands"],
  ];
  for (const key of keys) fixture.queryClient.setQueryData(key, ["old"]);
  const otherKey = ["admin", "200", "STAFF", "products", "list"];
  fixture.queryClient.setQueryData(otherKey, ["other"]);
  const active = new QueryObserver(fixture.queryClient, { queryKey: keys[0], queryFn: async () => { throw new Error("GET failed"); }, staleTime: Infinity });
  const unsubscribe = active.subscribe(() => {});
  assert.equal(await fixture.run(), "created");
  await new Promise(setImmediate);
  for (const key of keys) assert.equal(fixture.queryClient.getQueryState(key).isInvalidated, true);
  assert.equal(fixture.queryClient.getQueryState(keys[0]).status, "error");
  assert.equal(fixture.queryClient.getQueryState(otherKey).isInvalidated, false);
  assert.equal(fixture.toasts.length, 1);
  unsubscribe();
  fixture.queryClient.clear();
});

test("Offline/timeout không retry hay xếp hàng POST khi reconnect; phân loại kết quả chưa rõ", async () => {
  let calls = 0;
  const fixture = mutationFixture(async () => { calls++; throw new fixture.ApiError(0, "timeout"); });
  onlineManager.setOnline(false);
  try {
    await assert.rejects(fixture.run(), (error) => error.status === 0);
    onlineManager.setOnline(true);
    await new Promise(setImmediate);
    assert.equal(calls, 1);
    for (const status of [0, 408, 500, 503]) assert.equal(fixture.queries.isProductCreateUncertain(new fixture.ApiError(status, "uncertain")), true);
    for (const status of [400, 401, 403, 404, 409]) assert.equal(fixture.queries.isProductCreateUncertain(new fixture.ApiError(status, "rejected")), false);
  } finally {
    onlineManager.setOnline(true);
    fixture.queryClient.clear();
  }
});

test("Render form thật: nhóm thông tin, biến thể và ảnh; lỗi danh mục/thương hiệu có nút GET riêng", () => {
  const router = require("react-router");
  const uiLoad = createLoader({
    "@/features/admin/products/queries": {
      isCurrentProductSession: () => true, isProductCreateUncertain: () => false,
      useAdminProductCategories: () => ({ isError: true, error: new Error("category unavailable") }),
      useAdminProductBrands: () => ({ isError: true, error: new Error("brand unavailable") }),
      useCreateAdminProduct: () => ({ isPending: false, error: null }),
    },
  });
  const { ProductForm } = uiLoad("@/features/admin/products/components/ProductForm");
  const markup = renderToStaticMarkup(React.createElement(router.MemoryRouter, null,
    React.createElement(ProductForm, { session: { userId: "100", role: "STAFF", token: "fixture" } })));
  for (const text of ["Thông tin chung", "Thông số kỹ thuật", "Biến thể 1", "Thuộc tính", "Ảnh sản phẩm", "Tải lại danh mục", "Tải lại thương hiệu", "Quay lại danh sách"]) assert.ok(markup.includes(text), text);
  assert.match(markup, /type="file"[^>]*multiple=""/);
  assert.match(markup, /name="variants\.0\.sku"/);
  assert.match(markup, /name="categoryId"[^>]*disabled=""/);
});

test("Deep link tạo sản phẩm giữ query/hash cho A/M/S và từ chối CUSTOMER", () => {
  const previousWindow = global.window;
  global.window = { location: { origin: "http://localhost" } };
  try {
    const redirectLoad = createLoader({ "@/shared/auth/session.store": { useSession: () => undefined } });
    const { getLoginDestination } = redirectLoad("@/shared/auth/redirect");
    for (const role of ["ADMIN", "MANAGER", "STAFF"]) assert.equal(getLoginDestination(role, "/admin/products/new?from=list#form"), "/admin/products/new?from=list#form");
    assert.equal(getLoginDestination("CUSTOMER", "/admin/products/new"), "/");
  } finally {
    global.window = previousWindow;
  }
});
