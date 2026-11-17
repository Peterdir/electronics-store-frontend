/* Chạy bằng: node --test scripts/verify-catalog.cjs. Không cần backend. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { QueryClient, QueryObserver } = require("@tanstack/react-query");

const root = path.resolve(__dirname, "..");

function createLoader(mocks = {}) {
  const cache = new Map();
  function load(specifier, parent = path.join(root, "src", "index.ts")) {
    const resolved = specifier.startsWith("@/")
      ? path.join(root, "src", specifier.slice(2))
      : specifier.startsWith(".") ? path.resolve(path.dirname(parent), specifier) : null;
    if (Object.hasOwn(mocks, specifier)) return mocks[specifier];
    if (!resolved) return require(specifier);
    const alias = "@/" + path.relative(path.join(root, "src"), resolved).split(path.sep).join("/");
    if (Object.hasOwn(mocks, alias)) return mocks[alias];
    const filename = [resolved + ".ts", resolved + ".tsx", resolved].find(fs.existsSync);
    if (!filename) throw new Error("Cannot load " + specifier);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const output = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        target: ts.ScriptTarget.ES2023,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText;
    new Function("require", "module", "exports", output)(
      (name) => load(name, filename), module, module.exports,
    );
    return module.exports;
  }
  return load;
}

function compareFixture(saved, mocks = {}) {
  const middleware = require("zustand/middleware");
  let value = saved ? JSON.stringify({ state: saved, version: 0 }) : null;
  const storage = {
    getItem: () => value,
    setItem: (_key, next) => { value = next; },
    removeItem: () => { value = null; },
  };
  const load = createLoader({
    ...mocks,
    "zustand/middleware": {
      ...middleware,
      createJSONStorage: () => middleware.createJSONStorage(() => storage),
    },
  });
  const { useCompare } = load("@/features/catalog/compare.store");
  return { load, store: useCompare, saved: () => JSON.parse(value).state };
}

test("So sánh giữ sản phẩm cùng danh mục, xóa khi đổi danh mục và không khôi phục khi quay lại", () => {
  const { store, saved } = compareFixture();
  const { add, setCategory, clear } = store.getState();
  setCategory("Điện thoại");
  for (const id of ["1", "2", "3", "4"]) assert.equal(add(id, "Điện thoại"), true);
  assert.equal(add("1", "Điện thoại"), false);
  assert.equal(add("5", "Điện thoại"), false);
  setCategory("Điện thoại");
  assert.deepEqual(store.getState().compareIds, ["1", "2", "3", "4"]);
  setCategory("Laptop");
  assert.deepEqual(store.getState().compareIds, []);
  assert.deepEqual(saved(), { compareIds: [], categoryName: "Laptop" });
  setCategory("Điện thoại");
  assert.deepEqual(store.getState().compareIds, []);
  add("1", "Điện thoại");
  assert.equal(add("5", "Laptop"), true);
  assert.deepEqual(store.getState().compareIds, ["5"]);
  assert.equal(store.getState().categoryName, "Laptop");
  clear();
  assert.deepEqual(saved(), { compareIds: [], categoryName: null });
});

test("Khôi phục so sánh kèm danh mục; xóa dữ liệu cũ không xác định được danh mục", () => {
  const restored = compareFixture({ compareIds: ["1", "1", "bad", "2"], categoryName: "Laptop" });
  assert.deepEqual(restored.store.getState().compareIds, ["1", "2"]);
  restored.store.getState().setCategory("Laptop");
  assert.deepEqual(restored.store.getState().compareIds, ["1", "2"]);
  restored.store.getState().setCategory("Điện thoại");
  assert.deepEqual(restored.store.getState().compareIds, []);
  for (const categoryName of [undefined, null, "", " ", 123]) {
    assert.deepEqual(compareFixture({ compareIds: ["1", "2"], categoryName }).store.getState().compareIds, []);
  }
});

test("Trang danh sách dọn so sánh khi đổi danh mục qua URL hoặc mở lại trang; giữ khi đổi bộ lọc", () => {
  const effects = [];
  let params = new URLSearchParams("categoryId=10&page=1");
  let categoriesReady = true;
  const { load, store } = compareFixture(undefined, {
    react: { ...React, useEffect: (effect) => effects.push(effect) },
    "react-router": { useSearchParams: () => [params, () => {}] },
    "@/features/catalog/queries": {
      useGetCategories: () => ({ isSuccess: categoriesReady, isPending: !categoriesReady, data: categoriesReady ? [
        { id: "10", name: "Điện thoại", status: "ACTIVE" },
        { id: "20", name: "Laptop", status: "ACTIVE" },
      ] : undefined }),
      useGetBrands: () => ({ isSuccess: false }),
      useGetProducts: () => ({ isPending: true }),
    },
    "@/features/catalog/components/ProductFilters": { ProductFilters: () => null },
    "@/features/catalog/components/ProductGrid": { ProductGrid: () => null },
    "@/shared/components/Pagination": { Pagination: () => null },
    "@/components/ui/button": { Button: () => null },
  });
  const { ProductListPage } = load("@/features/catalog/pages/ProductListPage");
  function render() {
    renderToStaticMarkup(React.createElement(ProductListPage));
    effects.splice(0).forEach((effect) => effect());
  }
  render();
  store.getState().add("1", "Điện thoại");
  params = new URLSearchParams("categoryId=10&page=2&brandId=3&sort=PRICE_ASC&minPrice=1000&q=test");
  render();
  assert.deepEqual(store.getState().compareIds, ["1"]);
  params = new URLSearchParams("categoryId=20");
  categoriesReady = false;
  render();
  assert.deepEqual(store.getState().compareIds, ["1"]);
  categoriesReady = true;
  render();
  assert.deepEqual(store.getState().compareIds, []);
  store.getState().add("2", "Laptop");
  params = new URLSearchParams("categoryId=10");
  render();
  assert.deepEqual(store.getState().compareIds, []);
});

test("Mở chi tiết sản phẩm khác danh mục cũng dọn so sánh sau khi tải thành công", () => {
  const effects = [];
  let categoryName = "Điện thoại";
  let ready = true;
  const { load, store } = compareFixture(undefined, {
    react: { ...React, useEffect: (effect) => effects.push(effect) },
    "react-router": {
      useParams: () => ({ id: "2" }),
      Link: ({ children }) => React.createElement("a", null, children),
    },
    "@/features/catalog/queries": { useGetProductDetails: () => ({
      isSuccess: ready, isPending: !ready,
      data: ready ? { id: "2", name: "Sản phẩm", categoryName, averageRating: null } : undefined,
    }) },
    "@/features/catalog/components/ProductGallery": { ProductGallery: () => null },
    "@/features/catalog/components/SpecTable": { SpecTable: () => null },
    "@/features/catalog/components/ProductPurchaseOptions": { ProductPurchaseOptions: () => null },
    "@/features/catalog/components/CompareToggleButton": { CompareToggleButton: () => null },
  });
  const { ProductDetailPage } = load("@/features/catalog/pages/ProductDetailPage");
  function render() {
    renderToStaticMarkup(React.createElement(ProductDetailPage));
    effects.splice(0).forEach((effect) => effect());
  }
  store.getState().add("1", "Điện thoại");
  render();
  assert.deepEqual(store.getState().compareIds, ["1"]);
  categoryName = "Laptop";
  ready = false;
  render();
  assert.deepEqual(store.getState().compareIds, ["1"]);
  ready = true;
  render();
  assert.deepEqual(store.getState().compareIds, []);
});

test("URL so sánh trực tiếp không hiển thị bảng cho các sản phẩm khác danh mục", () => {
  let products = [
    { id: "1", categoryName: "Điện thoại" },
    { id: "2", categoryName: "Laptop" },
  ];
  const load = createLoader({
    "react-router": {
      useSearchParams: () => [new URLSearchParams("ids=1,2"), () => {}],
      Link: ({ children }) => React.createElement("a", null, children),
    },
    "@/features/catalog/queries": { useGetProductCompare: () => ({ data: products, isSuccess: true }) },
    "@/features/catalog/components/CompareTable": { CompareTable: () => React.createElement("table", null) },
  });
  const { ComparePage } = load("@/features/catalog/pages/ComparePage");
  const mixed = renderToStaticMarkup(React.createElement(ComparePage));
  assert.match(mixed, /Chỉ có thể so sánh các sản phẩm cùng danh mục/);
  assert.doesNotMatch(mixed, /<table/);
  products = products.map((product) => ({ ...product, categoryName: "Laptop" }));
  assert.match(renderToStaticMarkup(React.createElement(ComparePage)), /<table/);
});

test("Giá tính theo đồng: nhận 99.500đ, số 0, bỏ trống; chặn giá sai", () => {
  const { parsePriceRange } = createLoader()("@/features/catalog/priceFilters");
  assert.deepEqual(parsePriceRange("99500", "450000"), {
    valid: true, minPrice: 99500, maxPrice: 450000,
  });
  assert.deepEqual(parsePriceRange("0", ""), {
    valid: true, minPrice: 0, maxPrice: undefined,
  });
  assert.deepEqual(parsePriceRange("", ""), {
    valid: true, minPrice: undefined, maxPrice: undefined,
  });
  for (const [min, max] of [["500", "100"], ["-1", ""], ["1.5", ""], ["abc", ""], ["9007199254740992", ""]]) {
    assert.equal(parsePriceRange(min, max).valid, false);
  }
});

test("Khoảng checkbox thích ứng với giá danh mục và không trùng/hở tại ranh giới", () => {
  const { buildCategoryPriceRanges } = createLoader()("@/features/catalog/priceFilters");
  const accessories = buildCategoryPriceRanges({ minPrice: 25000, maxPrice: 495000 });
  const laptops = buildCategoryPriceRanges({ minPrice: 8000000, maxPrice: 45000000 });
  assert.ok(accessories[0].maxPrice < laptops[0].maxPrice);

  for (const bounds of [
    { minPrice: 0, maxPrice: 1 },
    { minPrice: 99500, maxPrice: 500000 },
    { minPrice: 8000000, maxPrice: 45000000 },
  ]) {
    const ranges = buildCategoryPriceRanges(bounds);
    assert.ok(ranges.length >= 2 && ranges.length <= 6);
    const prices = new Set([bounds.minPrice, bounds.maxPrice]);
    for (const range of ranges) {
      if (range.minPrice !== undefined) prices.add(range.minPrice);
      if (range.maxPrice !== undefined) {
        prices.add(range.maxPrice);
        prices.add(range.maxPrice + 1);
      }
    }
    for (const price of prices) {
      const matches = ranges.filter((range) =>
        (range.minPrice === undefined || price >= range.minPrice) &&
        (range.maxPrice === undefined || price <= range.maxPrice));
      assert.equal(matches.length, 1, "Giá " + price + " phải thuộc đúng một khoảng");
    }
  }
  assert.deepEqual(buildCategoryPriceRanges({ minPrice: 99500, maxPrice: 99500 }), []);
});

function backendPage(items) {
  return { data: { content: items, page: { number: 0, size: 1, totalElements: items.length, totalPages: items.length ? 1 : 0 } } };
}

test("Mốc giá lấy toàn bộ danh mục bằng hai truy vấn, không mang theo lọc giá/thương hiệu", async () => {
  const requests = [];
  const load = createLoader({
    "@/shared/api/client": { api: { get: async (url, { params }) => {
      requests.push({ url, params });
      return backendPage([{ basePrice: params.sort === "PRICE_ASC" ? 99500 : 950000 }]);
    } } },
  });
  const { getCategoryPriceBounds } = load("@/features/catalog/api");
  assert.deepEqual(await getCategoryPriceBounds("123"), { minPrice: 99500, maxPrice: 950000 });
  assert.deepEqual(requests.map(({ url, params }) => ({ url, ...params })), [
    { url: "/api/products", categoryId: "123", sort: "PRICE_ASC", page: 0, size: 1 },
    { url: "/api/products", categoryId: "123", sort: "PRICE_DESC", page: 0, size: 1 },
  ]);
});

test("Danh mục trống trả null thay vì tạo mốc giá giả bằng 0", async () => {
  const load = createLoader({ "@/shared/api/client": { api: { get: async () => backendPage([]) } } });
  assert.equal(await load("@/features/catalog/api").getCategoryPriceBounds("123"), null);
});

test("Không tìm sản phẩm trước khi có danh mục; cache mốc giá tách theo danh mục", async () => {
  let calls = 0;
  const load = createLoader({
    "@tanstack/react-query": { ...require("@tanstack/react-query"), useQuery: (options) => options },
    "@/shared/api/client": { api: { get: async (_url, { params }) => {
      calls++;
      return backendPage([{ basePrice: Number(params.categoryId) * 1000 }]);
    } } },
  });
  const queries = load("@/features/catalog/queries");
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const observer = new QueryObserver(client, queries.useGetProducts({ page: 0, size: 12 }, false));
  const unsubscribe = observer.subscribe(() => {});
  try {
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(calls, 0);
    assert.equal(queries.useCategoryPriceBounds().enabled, false);
    const first = queries.useCategoryPriceBounds("123");
    const second = queries.useCategoryPriceBounds("456");
    assert.notDeepEqual(first.queryKey, second.queryKey);
    assert.deepEqual(await client.fetchQuery(first), { minPrice: 123000, maxPrice: 123000 });
    assert.deepEqual(await client.fetchQuery(second), { minPrice: 456000, maxPrice: 456000 });
    assert.deepEqual(client.getQueryData(first.queryKey), { minPrice: 123000, maxPrice: 123000 });
  } finally {
    unsubscribe();
    client.clear();
  }
});

test("Chuyển trang giữ kết quả cũ, đổi danh mục không hiện sản phẩm của danh mục trước", () => {
  const load = createLoader({
    "@tanstack/react-query": { ...require("@tanstack/react-query"), useQuery: (options) => options },
    "@/shared/api/client": { api: {} },
  });
  const { useGetProducts } = load("@/features/catalog/queries");
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  const initial = { ...useGetProducts({ categoryId: "123", page: 0, size: 12 }), staleTime: Infinity };
  const firstPage = { items: [{ id: "1", basePrice: 99500 }], totalPages: 2 };
  client.setQueryData(initial.queryKey, firstPage);
  const observer = new QueryObserver(client, initial);
  const unsubscribe = observer.subscribe(() => {});
  try {
    observer.setOptions({
      ...useGetProducts({ categoryId: "123", page: 1, size: 12 }),
      queryFn: () => new Promise(() => {}),
    });
    assert.equal(observer.getCurrentResult().isPlaceholderData, true);
    assert.deepEqual(observer.getCurrentResult().data, firstPage);
    observer.setOptions({
      ...useGetProducts({ categoryId: "456", page: 0, size: 12 }),
      queryFn: () => new Promise(() => {}),
    });
    assert.equal(observer.getCurrentResult().isPlaceholderData, false);
    assert.equal(observer.getCurrentResult().data, undefined);
  } finally {
    unsubscribe();
    client.clear();
  }
});

test("Bộ lọc hiện giá mặc định/giá URL bằng đồng và không còn nút Áp dụng", () => {
  const load = createLoader({
    "@/features/catalog/queries": {
      useGetBrands: () => ({ data: [], isPending: false, isError: false }),
      useCategoryPriceBounds: () => ({ data: { minPrice: 99500, maxPrice: 950000 }, isSuccess: true }),
    },
    "@/components/ui/button": { Button: ({ children, ...props }) => React.createElement("button", props, children) },
  });
  const { ProductFilters } = load("@/features/catalog/components/ProductFilters");
  const props = {
    values: { categoryId: "123", sort: "NEWEST" },
    categories: [{ id: "123", name: "Phụ kiện", status: "ACTIVE" }],
    onChange() {},
  };
  const html = renderToStaticMarkup(React.createElement(ProductFilters, props));
  assert.match(html, /value="99\.500"/);
  assert.match(html, /value="950\.000"/);
  assert.match(html, /type="checkbox"/);
  assert.doesNotMatch(html, /Áp dụng|Tất cả danh mục|\.000 ₫/);
  const restored = renderToStaticMarkup(React.createElement(ProductFilters, {
    ...props, values: { ...props.values, minPrice: 123500, maxPrice: 800000 },
  }));
  assert.match(restored, /value="123\.500"/);
  assert.match(restored, /value="800\.000"/);
});
