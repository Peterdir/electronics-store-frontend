// API/Query/handler harness; no real backend or browser writes.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { QueryClient, MutationObserver, onlineManager } = require('@tanstack/react-query');
const root = path.resolve(__dirname, '..');
function createLoader(mocks = {}) {
  const cache = new Map();
  function load(name, parent = path.join(root, 'src/index.ts')) {
    const resolved = name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : name.startsWith('.') ? path.resolve(path.dirname(parent), name) : null;
    const alias = resolved ? '@/' + path.relative(path.join(root, 'src'), resolved).split(path.sep).join('/') : name;
    if (Object.hasOwn(mocks, alias)) return mocks[alias];
    if (!resolved) return require(name);
    const filename = [resolved + '.ts', resolved + '.tsx', resolved].find(fs.existsSync);
    if (cache.has(filename)) return cache.get(filename).exports;
    const module = { exports: {} };
    cache.set(filename, module);
    const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    new Function('require', 'module', 'exports', output)(child => load(child, filename), module, module.exports);
    return module.exports;
  }
  return load;
}

test('API: PATCH query param/text, DELETE, string Long IDs và validation trước dispatch', async () => {
  const calls = [];
  const api = Object.fromEntries(['patch', 'delete'].map(method => [method, async (...args) => { calls.push({ method, args }); return { data: 'OK' }; }]));
  const load = createLoader({ '@/shared/api/client': { api } });
  const { mutateAdminProductLifecycle: write } = load('@/features/admin/products/api');
  const id = '9007199254740993';
  await write(id, { kind: 'status', status: 'HIDDEN' }, 'token');
  await write(id, { kind: 'deactivate', variantId: '9223372036854775807' }, 'token');
  await write(id, { kind: 'reactivate', variantId: '9223372036854775807' }, 'token');
  assert.deepEqual(calls, [
    { method: 'patch', args: [`/api/admin/products/${id}/status`, undefined, { meta: { authToken: 'token', noPublicRetry: true }, params: { status: 'HIDDEN' } }] },
    { method: 'delete', args: [`/api/admin/products/${id}/variants/9223372036854775807`, { meta: { authToken: 'token', noPublicRetry: true } }] },
    { method: 'patch', args: [`/api/admin/products/${id}/variants/9223372036854775807/status`, undefined, { meta: { authToken: 'token', noPublicRetry: true }, params: { status: 'ACTIVE' } }] },
  ]);
  for (const [productId, action] of [['0', { kind: 'status', status: 'ACTIVE' }], [id, { kind: 'status', status: 'BAD' }], [id, { kind: 'deactivate', variantId: '9223372036854775808' }]]) await assert.rejects(write(productId, action, 'token'));
  await assert.rejects(write(id, { kind: 'reactivate', variantId: '0' }, 'token'));
  assert.equal(calls.length, 3);
});

function fixture(role = 'ADMIN', dispatch = async () => 'OK') {
  let options;
  let valid = true;
  const snapshot = { userId: '100', role, token: 'snapshot' };
  const queryClient = new QueryClient();
  const load = createLoader({
    '@tanstack/react-query': { useQueryClient: () => queryClient, useIsMutating: () => 0, useMutation: value => { options = value; return {}; } },
    '@/features/admin/products/queries': { useProductSession: () => snapshot, isCurrentProductSession: () => valid },
    '@/features/admin/products/api': { mutateAdminProductLifecycle: dispatch },
    '@/shared/auth/session.store': { useSession: () => {} },
  });
  load('@/features/admin/products/lifecycleQueries').useAdminProductLifecycle('9');
  return { queryClient, options, setValid: value => { valid = value; }, run: action => new MutationObserver(queryClient, options).mutate({ action, session: snapshot }) };
}
const statusAction = { kind: 'status', status: 'HIDDEN' };
const variantAction = { kind: 'deactivate', variantId: '2' };
const restoreAction = { kind: 'reactivate', variantId: '2' };
const settle = () => new Promise(setImmediate);

test('Quyền thực thi: A/M được ghi; STAFF/CUSTOMER bị chặn status/ngừng bán/bán lại trước API', async () => {
  for (const role of ['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER']) {
    let calls = 0;
    const f = fixture(role, async () => { calls++; return 'OK'; });
    for (const action of [statusAction, variantAction, restoreAction]) {
      if (role === 'ADMIN' || role === 'MANAGER') await f.run(action);
      else await assert.rejects(f.run(action), error => error.status === 403);
    }
    assert.equal(calls, ['ADMIN', 'MANAGER'].includes(role) ? 3 : 0);
    f.queryClient.clear();
  }
});

test('Khóa đồng thời status/variant; response muộn sau đổi phiên không invalidate', async () => {
  let release;
  let calls = 0;
  const f = fixture('ADMIN', () => { calls++; return new Promise(resolve => { release = resolve; }); });
  const key = ['admin', '100', 'ADMIN', 'products'];
  f.queryClient.setQueryData(key, 'old');
  const first = f.run(restoreAction);
  await settle();
  await assert.rejects(f.run(variantAction), error => error.status === 409);
  f.setValid(false);
  release('OK');
  await assert.rejects(first, error => error.status === 401);
  await assert.rejects(f.run(statusAction), error => error.status === 401);
  assert.equal(calls, 1);
  assert.equal(f.queryClient.getQueryState(key).isInvalidated, false);
  f.queryClient.clear();
});

test('Invalidate products/list/detail/compare, inventory/dashboard/cart/wishlist đúng phiên; không đoán status', async () => {
  const f = fixture();
  const keys = [['admin', '100', 'ADMIN', 'products', 'detail', '9'], ['admin', '100', 'ADMIN', 'products', 'list'], ['admin', '100', 'ADMIN', 'inventory'], ['admin', '100', 'ADMIN', 'dashboard'], ['products', 'detail', '9'], ['products', 'compare', ['9', '10']], ['cart'], ['wishlist']];
  const other = ['admin', '200', 'ADMIN', 'products'];
  for (const key of [...keys, other]) f.queryClient.setQueryData(key, { status: 'ACTIVE' });
  await f.run(statusAction);
  for (const key of keys) {
    assert.equal(f.queryClient.getQueryState(key).isInvalidated, true);
    assert.deepEqual(f.queryClient.getQueryData(key), { status: 'ACTIVE' });
  }
  assert.equal(f.queryClient.getQueryState(other).isInvalidated, false);
  assert.equal(f.options.retry, false);
  assert.equal(f.options.gcTime, 0);
  f.queryClient.clear();
});

test('Offline không queue/retry khi reconnect', async () => {
  let calls = 0;
  const f = fixture('ADMIN', async () => { calls++; throw new Error('offline'); });
  onlineManager.setOnline(false);
  try {
    await assert.rejects(f.run(statusAction));
    onlineManager.setOnline(true);
    await settle();
    assert.equal(calls, 1);
  } finally { onlineManager.setOnline(true); f.queryClient.clear(); }
});

function uiFixture(role = 'ADMIN') {
  let index = 0;
  const slots = [];
  const effects = [];
  let calls = 0;
  let reads = 0;
  let readFailure = false;
  let writeFailure = null;
  let current = true;
  let mutationError = null;
  const actions = [];
  const hooks = { ...React, useId: () => 'lifecycle',
    useRef: value => { const i = index++; slots[i] ??= { current: value }; return slots[i]; },
    useState: value => { const i = index++; if (!(i in slots)) slots[i] = value; return [slots[i], next => { slots[i] = typeof next === 'function' ? next(slots[i]) : next; }]; },
    useEffect: effect => { index++; effects.push(effect); },
  };
  const load = createLoader({
    react: hooks,
    '@/shared/auth/session.store': { useSession: () => {} },
    '@/features/admin/products/queries': { isCurrentProductSession: () => current, isProductWriteUncertain: error => error?.status === 0 },
    '@/features/admin/products/lifecycleQueries': { useAdminProductLifecycle: () => ({ isPending: false, error: mutationError, reset: () => { mutationError = null; }, mutateAsync: async ({ action }) => { calls++; actions.push(action); if (writeFailure) { mutationError = writeFailure; throw writeFailure; } return 'OK'; } }) },
  });
  const { ProductLifecycleManager } = load('@/features/admin/products/components/ProductLifecycleManager');
  const { ApiError } = load('@/shared/api/errors');
  const props = { children: ({ statusControl, variants }) => React.createElement('div', null, statusControl, variants), product: { id: '9', status: 'ACTIVE', totalStock: 3, variants: [{ id: '2', sku: 'SKU', price: 1, stock: 3, attributes: {}, status: 'ACTIVE' }] }, session: { role }, unavailable: false, reload: async () => { reads++; if (readFailure) throw new Error('GET failed'); return props.product; } };
  function render() { index = 0; const tree = ProductLifecycleManager(props); effects.splice(0).forEach(effect => effect()); return tree; }
  function nodes(tree) { return !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)]; }
  const find = (tree, name) => nodes(tree).find(node => node.type?.name === name);
  const button = (tree, label) => nodes(tree).find(node => node.props?.children === label);
  return { render, find, button, ApiError, props, actions, get calls() { return calls; }, get reads() { return reads; }, setReadFailure: value => { readFailure = value; }, setWriteFailure: value => { writeFailure = value; }, setCurrent: value => { current = value; } };
}

test('UI: A/M có actions; STAFF chỉ xem; INACTIVE khóa nút ngừng bán, variants null an toàn', () => {
  for (const role of ['ADMIN', 'MANAGER', 'STAFF']) {
    const f = uiFixture(role);
    const tree = f.render();
    assert.doesNotMatch(renderToStaticMarkup(tree), /Trạng thái và ngừng bán|Máy chủ áp dụng/);
    assert.equal(Boolean(f.find(tree, 'ProductStatusAction')), role !== 'STAFF');
    assert.equal(Boolean(f.find(tree, 'SavedProductVariants').props.renderAction), role !== 'STAFF');
  }
  const load = createLoader();
  const { DeactivateVariantAction } = load('@/features/admin/products/components/DeactivateVariantAction');
  assert.match(renderToStaticMarkup(React.createElement(DeactivateVariantAction, { variant: { sku: 'OLD', status: 'INACTIVE' }, disabled: false })), /disabled=""/);
  const { SavedProductVariants } = load('@/features/admin/products/components/SavedProductVariants');
  assert.match(renderToStaticMarkup(React.createElement(SavedProductVariants, { product: { variants: null } })), /Chưa có biến thể/);
});

test('Bán lại INACTIVE/HIDDEN: đúng nút/quyền, xác nhận, gửi một PATCH, GET lỗi hướng dẫn F5', async () => {
  for (const status of ['INACTIVE', 'HIDDEN']) {
    const f = uiFixture();
    f.props.product.status = 'HIDDEN';
    f.props.product.variants[0].status = status;
    f.setReadFailure(true);
    const variant = f.props.product.variants[0];
    let row = f.find(f.render(), 'SavedProductVariants').props.renderAction(variant);
    assert.equal(f.find(row, 'DeactivateVariantAction'), undefined);
    f.find(row, 'ReactivateVariantAction').props.onSelect();
    assert.equal(f.calls, 0);
    let tree = f.render();
    assert.match(renderToStaticMarkup(tree), /Bán lại biến thể #2/);
    assert.match(renderToStaticMarkup(tree), /chỉ có thể được mua khi sản phẩm được bật bán/);
    row = f.find(tree, 'SavedProductVariants').props.renderAction(variant);
    f.button(row, 'Xác nhận thay đổi').props.onClick();
    f.button(row, 'Xác nhận thay đổi').props.onClick();
    await settle();
    assert.equal(f.calls, 1);
    assert.deepEqual(f.actions, [{ kind: 'reactivate', variantId: '2' }]);
    tree = f.render();
    row = f.find(tree, 'SavedProductVariants').props.renderAction(variant);
    assert.equal(f.find(row, 'ReactivateVariantAction').props.disabled, true);
    assert.match(renderToStaticMarkup(row), /Đã bật bán lại biến thể/);
    assert.equal(f.button(row, 'Tải lại để kiểm tra'), undefined);
    assert.match(renderToStaticMarkup(row), /Nhấn F5/);
    f.find(row, 'ReactivateVariantAction').props.onSelect();
    await settle();
    row = f.find(f.render(), 'SavedProductVariants').props.renderAction(variant);
    f.button(row, 'Xác nhận thay đổi').props.onClick();
    await settle();
    assert.equal(f.calls, 1);
    assert.equal(f.reads, 1);
  }
  const staff = uiFixture('STAFF');
  staff.props.product.variants[0].status = 'INACTIVE';
  assert.equal(staff.find(staff.render(), 'SavedProductVariants').props.renderAction, undefined);
});

test('Thẻ biến thể giữ SKU/Long ID/giá/kho/thuộc tính; ảnh thiếu và dữ liệu null có fallback', () => {
  const { SavedProductVariants } = createLoader()('@/features/admin/products/components/SavedProductVariants');
  const product = { status: 'ACTIVE', totalStock: 0, images: null, variants: [{ id: '9223372036854775807', sku: 'PHONE-256-BLACK', status: 'INACTIVE', price: 12500000, stock: 0, imageUrl: null, images: null, attributes: { color: 'Đen', storage: '256 GB', esim: true } }] };
  const html = renderToStaticMarkup(React.createElement(SavedProductVariants, { product }));
  for (const text of ['PHONE-256-BLACK', '9223372036854775807', '12.500.000', '256 GB', 'Đen', 'true', 'Tồn kho']) assert.ok(html.includes(text));
  assert.doesNotMatch(html, /<img|<input/);
  product.variants[0].attributes = null;
  assert.match(renderToStaticMarkup(React.createElement(SavedProductVariants, { product })), /Chưa có thuộc tính/);
});

test('Handler: chọn status ghi ngay, chọn lặp một PATCH; GET lỗi hướng dẫn F5, tự GET thành công mở khóa', async () => {
  const f = uiFixture();
  f.setReadFailure(true);
  const select = f.find(f.render(), 'ProductStatusAction').props.onSelect;
  select('ACTIVE');
  assert.equal(f.calls, 0);
  select('HIDDEN');
  select('HIDDEN');
  await settle();
  let tree = f.render();
  assert.equal(f.button(tree, 'Xác nhận thay đổi'), undefined);
  assert.equal(f.calls, 1);
  assert.equal(f.reads, 1);
  assert.doesNotMatch(renderToStaticMarkup(tree), /Đã lưu trạng thái sản phẩm/);
  assert.match(renderToStaticMarkup(tree), /Không tải lại được dữ liệu/);
  assert.equal(f.find(tree, 'ProductStatusAction').props.disabled, true);
  assert.equal(f.button(tree, 'Tải lại để kiểm tra'), undefined);
  assert.match(renderToStaticMarkup(tree), /Nhấn F5/);
  f.find(tree, 'ProductStatusAction').props.onSelect('INACTIVE');
  await settle();
  assert.equal(f.calls, 1);
  assert.equal(f.reads, 1);

  const success = uiFixture();
  success.find(success.render(), 'ProductStatusAction').props.onSelect('HIDDEN');
  await settle();
  assert.equal(success.calls, 1);
  assert.equal(success.reads, 1);
  assert.equal(success.find(success.render(), 'ProductStatusAction').props.disabled, false);
});

test('Handler: variant giữ ID, timeout/404/400 hướng dẫn F5; 403 khóa ghi; đổi phiên chặn confirm', async () => {
  for (const code of [0, 404, 400, 403]) {
    const f = uiFixture();
    f.setWriteFailure(new f.ApiError(code, 'failed'));
    const variants = f.find(f.render(), 'SavedProductVariants');
    f.find(variants.props.renderAction(f.props.product.variants[0]), 'DeactivateVariantAction').props.onSelect();
    let tree = f.render();
    assert.match(renderToStaticMarkup(tree), /Ngừng bán biến thể #2/);
    const row = f.find(tree, 'SavedProductVariants').props.renderAction(f.props.product.variants[0]);
    f.button(row, 'Xác nhận thay đổi').props.onClick();
    await settle();
    tree = f.render();
    assert.equal(f.find(tree, 'ProductStatusAction').props.disabled, true);
    const updatedRow = f.find(tree, 'SavedProductVariants').props.renderAction(f.props.product.variants[0]);
    if (code > 0) assert.match(renderToStaticMarkup(updatedRow), new RegExp(`HTTP ${code}: failed`));
    assert.equal(f.button(updatedRow, 'Tải lại để kiểm tra'), undefined);
    if (code !== 403) assert.match(renderToStaticMarkup(updatedRow), /Nhấn F5/);
    assert.equal(f.calls, 1);
  }
  const f = uiFixture();
  const select = f.find(f.render(), 'ProductStatusAction').props.onSelect;
  f.setCurrent(false);
  select('HIDDEN');
  await settle();
  assert.equal(f.calls, 0);
});
