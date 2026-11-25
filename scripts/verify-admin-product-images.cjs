/* Chạy: node --test scripts/verify-admin-product-images.cjs. Mô phỏng API/hooks, không sửa dữ liệu thật. */
const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { QueryClient, MutationObserver, onlineManager } = require("@tanstack/react-query");

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
const { productImagesSchema, buildProductImagesFormData } = load('@/features/admin/products/productImages');
const png = () => new File(['fixture'], 'photo.png', { type: 'image/png' });

test('Validation và multipart: ảnh hợp lệ, file rỗng/sai MIME/quá dung lượng, tổng request, lặp key images', () => {
  assert.equal(productImagesSchema.safeParse([]).success, false);
  for (const file of [new File([], 'empty.png', { type: 'image/png' }), new File(['x'], 'bad.svg', { type: 'image/svg+xml' }), new File(['x'], 'bad.png', { type: 'image/jpeg' }), new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' })]) {
    assert.equal(productImagesSchema.safeParse([file]).success, false);
  }
  const large = new File([new Uint8Array(5 * 1024 * 1024)], 'large.png', { type: 'image/png' });
  assert.equal(productImagesSchema.safeParse(Array(6).fill(large)).success, false);
  const data = buildProductImagesFormData([png(), png()]);
  assert.deepEqual([...data.keys()], ['images', 'images']);
  assert.equal(data.getAll('images').length, 2);
});

test('API chọn đúng method/path/body/token, ID Long không mất chính xác; chặn ID sai trước dispatch', async () => {
  const calls = [];
  const api = Object.fromEntries(['post', 'delete', 'patch'].map(method => [method, async (...args) => { calls.push({ method, args }); return { data: 'OK' }; }]));
  const apiLoad = createLoader({ '@/shared/api/client': { api } });
  const { mutateAdminProductImages } = apiLoad('@/features/admin/products/api');
  const id = '9007199254740993';
  const imageId = '9223372036854775807';
  assert.equal(await mutateAdminProductImages(id, { kind: 'upload', files: [png()] }, 'token'), 'OK');
  await mutateAdminProductImages(id, { kind: 'delete', imageId }, 'token');
  await mutateAdminProductImages(id, { kind: 'primary', imageId }, 'token');
  assert.deepEqual(calls.map(call => [call.method, call.args[0]]), [['post', `/api/admin/products/${id}/images`], ['delete', `/api/admin/products/${id}/images/${imageId}`], ['patch', `/api/admin/products/${id}/images/${imageId}/primary`]]);
  assert.ok(calls[0].args[1] instanceof FormData);
  assert.equal(calls[2].args[1], undefined);
  for (const call of calls) assert.deepEqual(call.args.at(-1), { meta: { authToken: 'token', noPublicRetry: true } });
  await assert.rejects(mutateAdminProductImages('0', { kind: 'upload', files: [png()] }, 'token'));
  await assert.rejects(mutateAdminProductImages(id, { kind: 'delete', imageId: '9223372036854775808' }, 'token'));
  assert.equal(calls.length, 3);
});

function fixture(dispatch = async () => 'OK') {
  let options;
  let valid = true;
  const snapshot = { userId: '100', role: 'STAFF', token: 'snapshot' };
  const queryClient = new QueryClient();
  const hookLoad = createLoader({
    '@tanstack/react-query': { useQueryClient: () => queryClient, useIsMutating: () => 0, useMutation: value => { options = value; return {}; } },
    '@/features/admin/products/queries': { useProductSession: () => snapshot, isCurrentProductSession: () => valid },
    '@/features/admin/products/api': { mutateAdminProductImages: dispatch },
  });
  hookLoad('@/features/admin/products/imageQueries').useAdminProductImages('9');
  return { queryClient, options, setValid: value => { valid = value; }, run: action => new MutationObserver(queryClient, options).mutate({ action, session: snapshot }) };
}

test('Mutation khóa chung upload/delete/primary; response sau đổi phiên không invalidate', async () => {
  let release;
  let calls = 0;
  const f = fixture(() => { calls++; return new Promise(resolve => { release = resolve; }); });
  const key = ['admin', '100', 'STAFF', 'products'];
  f.queryClient.setQueryData(key, 'old');
  const first = f.run({ kind: 'upload', files: [png()] });
  await new Promise(setImmediate);
  await assert.rejects(f.run({ kind: 'delete', imageId: '1' }), error => error.status === 409);
  f.setValid(false);
  release('OK');
  await assert.rejects(first, error => error.status === 401);
  await assert.rejects(f.run({ kind: 'primary', imageId: '2' }), error => error.status === 401);
  assert.equal(calls, 1);
  assert.equal(f.queryClient.getQueryState(key).isInvalidated, false);
  f.queryClient.clear();
});

test('Thành công đánh dấu stale đúng cache và phiên; không tự GET trước khi UI ghi nhận thành công', async () => {
  const f = fixture();
  const keys = [['admin', '100', 'STAFF', 'products', 'detail', '9'], ['admin', '100', 'STAFF', 'products', 'list'], ['products'], ['cart'], ['wishlist']];
  const other = ['admin', '200', 'STAFF', 'products'];
  for (const key of [...keys, other]) f.queryClient.setQueryData(key, 'old');
  assert.equal(await f.run({ kind: 'primary', imageId: '2' }), 'OK');
  for (const key of keys) assert.equal(f.queryClient.getQueryState(key).isInvalidated, true);
  assert.equal(f.queryClient.getQueryState(other).isInvalidated, false);
  assert.equal(f.options.retry, false);
  assert.equal(f.options.gcTime, 0);
  f.queryClient.clear();
});

test('Offline không xếp hàng phát lại POST ảnh khi reconnect', async () => {
  let calls = 0;
  const f = fixture(async () => { calls++; throw new Error('offline'); });
  onlineManager.setOnline(false);
  try {
    await assert.rejects(f.run({ kind: 'upload', files: [png()] }));
    onlineManager.setOnline(true);
    await new Promise(setImmediate);
    assert.equal(calls, 1);
  } finally { onlineManager.setOnline(true); f.queryClient.clear(); }
});

test('SSR: images null, fallback URL thiếu, isPrimary đúng field, STAFF thao tác và khóa khi thiếu quyền', () => {
  const uiLoad = createLoader({
    '@/features/admin/products/queries': { isCurrentProductSession: () => true },
    '@/features/admin/products/imageQueries': { useAdminProductImages: () => ({ isPending: false, error: null }) },
  });
  const { ProductImageManager } = uiLoad('@/features/admin/products/components/ProductImageManager');
  const props = { session: {}, unavailable: false, reload: async () => {}, product: { id: '9', images: null } };
  let markup = renderToStaticMarkup(React.createElement(ProductImageManager, props));
  assert.match(markup, /Chưa có ảnh sản phẩm/);
  props.product.images = [{ id: '1', imageUrl: '', isPrimary: true }, { id: '2', imageUrl: '', isPrimary: null }];
  markup = renderToStaticMarkup(React.createElement(ProductImageManager, props));
  assert.match(markup, /Ảnh đại diện/);
  assert.match(markup, /Không có ảnh hiển thị/);
  const buttons = markup.match(/<button\b[^>]*>/g);
  assert.ok(buttons.find(tag => tag.includes('aria-label="Chọn ảnh #1 làm đại diện"')).includes('disabled=""'));
  assert.ok(!buttons.find(tag => tag.includes('aria-label="Chọn ảnh #2 làm đại diện"')).includes('disabled=""'));
  markup = renderToStaticMarkup(React.createElement(ProductImageManager, { ...props, unavailable: true }));
  assert.match(markup, /<fieldset disabled/);
});

// Mô phỏng hook state để chạy handler thật; không thay thế tương tác DOM/browser.
function managerFixture() {
  let index = 0;
  const slots = [];
  const effects = [];
  let readFailure = true;
  let writeFailure = null;
  let calls = 0;
  let reads = 0;
  const hooks = {
    ...React, useId: () => 'images-test',
    useRef: value => { const position = index++; slots[position] ??= { current: value }; return slots[position]; },
    useState: value => { const position = index++; if (!(position in slots)) slots[position] = value; return [slots[position], next => { slots[position] = typeof next === 'function' ? next(slots[position]) : next; }]; },
    useEffect: fn => { index++; effects.push(fn); },
  };
  const uiLoad = createLoader({
    react: hooks,
    '@/features/admin/products/queries': { isCurrentProductSession: () => true, isProductWriteUncertain: error => error?.status === 0 },
    '@/features/admin/products/imageQueries': { useAdminProductImages: () => ({ isPending: false, error: null, reset: () => {}, mutateAsync: async () => { calls++; if (writeFailure) throw writeFailure; return 'OK'; } }) },
  });
  const { ApiError } = uiLoad('@/shared/api/errors');
  const { ProductImageManager } = uiLoad('@/features/admin/products/components/ProductImageManager');
  const product = { id: '9', images: [{ id: '2', imageUrl: '', isPrimary: false }] };
  function render() {
    index = 0;
    const tree = ProductImageManager({ product, session: {}, unavailable: false, reload: async () => { reads++; if (readFailure) throw new Error('GET failed'); return product; } });
    effects.splice(0).forEach(fn => fn());
    return tree;
  }
  function nodes(tree) {
    if (!tree || typeof tree !== 'object') return [];
    if (Array.isArray(tree)) return tree.flatMap(nodes);
    return [tree, ...nodes(tree.props?.children)];
  }
  return { render, nodes, ApiError, get calls() { return calls; }, get reads() { return reads; }, setReadFailure: value => { readFailure = value; }, setWriteFailure: value => { writeFailure = value; } };
}
const settle = () => new Promise(setImmediate);
const button = (f, tree, label) => f.nodes(tree).find(node => node.props?.children === label);

test('Handler: double click chỉ một mutation; GET lỗi khóa ghi và hướng dẫn F5; GET tự động thành công mở khóa', async () => {
  const f = managerFixture();
  let tree = f.render();
  const primary = button(f, tree, 'Chọn đại diện');
  primary.props.onClick();
  primary.props.onClick();
  await settle();
  tree = f.render();
  assert.equal(f.calls, 1);
  assert.equal(f.reads, 1);
  assert.ok(f.nodes(tree).some(node => node.props?.children === 'Đã chọn ảnh đại diện.'));
  assert.equal(button(f, tree, 'Chọn đại diện').props.disabled, true);
  assert.equal(button(f, tree, 'Tải lại ảnh để kiểm tra'), undefined);
  assert.match(renderToStaticMarkup(tree), /Nhấn F5/);
  button(f, tree, 'Chọn đại diện').props.onClick();
  await settle();
  assert.equal(f.calls, 1);
  assert.equal(f.reads, 1);

  const success = managerFixture();
  success.setReadFailure(false);
  button(success, success.render(), 'Chọn đại diện').props.onClick();
  await settle();
  assert.equal(success.calls, 1);
  assert.equal(success.reads, 1);
  assert.equal(button(success, success.render(), 'Chọn đại diện').props.disabled, false);
});

test('Handler: timeout/404 hướng dẫn F5 và khóa ghi; xóa phải xác nhận mới gửi DELETE', async () => {
  for (const status of [0, 404]) {
    const f = managerFixture();
    let tree = f.render();
    f.setWriteFailure(new f.ApiError(status, 'failed'));
    button(f, tree, 'Xóa ảnh').props.onClick();
    assert.equal(f.calls, 0);
    tree = f.render();
    button(f, tree, 'Xác nhận xóa').props.onClick();
    await settle();
    tree = f.render();
    assert.equal(f.calls, 1);
    assert.equal(button(f, tree, 'Chọn đại diện').props.disabled, true);
    assert.equal(button(f, tree, 'Tải lại ảnh để kiểm tra'), undefined);
    assert.match(renderToStaticMarkup(tree), /Nhấn F5/);
    button(f, tree, 'Chọn đại diện').props.onClick();
    await settle();
    tree = f.render();
    assert.equal(f.calls, 1);
    assert.equal(button(f, tree, 'Chọn đại diện').props.disabled, true);
    assert.equal(f.reads, 0);
  }
});

test('Handler: nhiều lần chọn file giữ ảnh cũ; upload thành công xóa file local, GET lỗi không cho POST lại', async () => {
  const f = managerFixture();
  let tree = f.render();
  let input = f.nodes(tree).find(node => node.type === 'input');
  input.props.onChange({ currentTarget: { files: [png()], value: 'fake' } });
  tree = f.render();
  input = f.nodes(tree).find(node => node.type === 'input');
  input.props.onChange({ currentTarget: { files: [png()], value: 'fake' } });
  tree = f.render();
  assert.equal(f.nodes(tree).filter(node => node.props?.file instanceof File).length, 2);
  button(f, tree, 'Tải ảnh lên').props.onClick();
  await settle();
  tree = f.render();
  assert.equal(f.nodes(tree).filter(node => node.props?.file instanceof File).length, 0);
  assert.equal(button(f, tree, 'Tải ảnh lên').props.disabled, true);
  assert.equal(f.calls, 1);
});
