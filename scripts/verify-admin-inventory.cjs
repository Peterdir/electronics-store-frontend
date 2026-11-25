// Contract/query tests with mocked HTTP; no authenticated backend writes.
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { QueryClient, MutationObserver, onlineManager } = require('@tanstack/react-query');
const root = path.resolve(__dirname, '..');
function loader(mocks = {}) {
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
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    new Function('require', 'module', 'exports', source)(child => load(child, filename), module, module.exports);
    return module.exports;
  }
  return load;
}
const request = { quantity: 5, action: 'DEDUCT', reason: 'Kiểm kê' };

test('schema: positive safe integers, optional reason, exact deduction and unsafe preview', () => {
  const { adjustStockSchema: schema, previewStock } = loader()('@/features/admin/inventory/schemas');
  assert.deepEqual(schema.parse({ quantity: ' 5 ', action: 'ADD', reason: '  ' }), { quantity: 5, action: 'ADD', reason: undefined });
  for (const quantity of ['0', '-1', '1.5', '1e3', '', 'NaN', '9007199254740992']) {
    assert.equal(schema.safeParse({ quantity, action: 'ADD', reason: '' }).success, false, quantity);
  }
  assert.equal(schema.safeParse({ quantity: '1', action: 'BAD', reason: '' }).success, false);
  assert.equal(previewStock(5, 'DEDUCT', 5), 0);
  assert.equal(previewStock(5, 'DEDUCT', 6), null);
  assert.equal(previewStock(Number.MAX_SAFE_INTEGER, 'ADD', 1), null);
  assert.equal(previewStock(null, 'ADD', 1), null);
});

test('API: inventoryId kept as string, POST body/response, GET signal, reject invalid input before HTTP', async () => {
  const calls = [];
  const result = { id: '9007199254740993', quantity: 0 };
  const load = loader({ '@/shared/api/client': { api: {
    post: async (...args) => { calls.push(['POST', ...args]); return { data: result }; },
    get: async (...args) => { calls.push(['GET', ...args]); return { data: [] }; },
  } } });
  const api = load('@/features/admin/inventory/api');
  assert.equal(await api.adjustAdminStock(result.id, request, 'token'), result);
  const signal = new AbortController().signal;
  await api.getAdminInventoryHistory(result.id, signal, 'token');
  assert.deepEqual(calls, [
    ['POST', `/api/admin/inventory/${result.id}/adjust`, request, { meta: { authToken: 'token', noPublicRetry: true } }],
    ['GET', `/api/admin/inventory/${result.id}/history`, { signal, meta: { authToken: 'token', noPublicRetry: true } }],
  ]);
  await assert.rejects(api.adjustAdminStock('0', request, 'token'));
  await assert.rejects(api.adjustAdminStock(result.id, { ...request, quantity: 0 }, 'token'));
  await assert.rejects(api.getAdminInventoryHistory('9223372036854775808', signal, 'token'));
  assert.equal(calls.length, 2);
});

function fixture(dispatch = async () => ({ id: '9', quantity: 0 })) {
  const snapshot = { userId: '1', role: 'STAFF', token: 'token' };
  let state = { user: { id: snapshot.userId, role: snapshot.role }, token: snapshot.token };
  let options;
  let historyOptions;
  let calls = 0;
  const session = selector => selector(state);
  session.getState = () => state;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const load = loader({
    '@tanstack/react-query': { useQueryClient: () => client, useIsMutating: () => 0, useMutation: value => { options = value; return {}; }, useQuery: value => { historyOptions = value; return {}; } },
    '@/shared/auth/session.store': { useSession: session },
    '@/shared/auth/jwt': { isExpired: () => false },
    '@/features/admin/inventory/api': {
      adjustAdminStock: async (...args) => { calls++; return dispatch(...args); },
      getAdminInventory: async () => [{ id: '9', quantity: 0 }],
      getAdminInventoryHistory: async () => [],
    },
  });
  const queries = load('@/features/admin/inventory/queries');
  const hook = queries.useAdjustStock('9', snapshot);
  return { client, queries, hook, snapshot, load, get calls() { return calls; },
    get historyOptions() { return historyOptions; },
    changeSession: () => { state = { user: { id: '2', role: 'ADMIN' }, token: 'new-token' }; },
    run: () => new MutationObserver(client, options).mutate(request),
  };
}

test('mutation invalidates inventory/history, product/dashboard/catalog/cart and reconciles unfiltered stock', async () => {
  const f = fixture();
  const keys = [['admin', '1', 'STAFF', 'inventory', 'history', '9'], ['admin', '1', 'STAFF', 'inventory', 'list', { status: 'IN_STOCK' }], ['admin', '1', 'STAFF', 'products'], ['admin', '1', 'STAFF', 'dashboard'], ['products'], ['cart'], ['wishlist']];
  for (const key of keys) f.client.setQueryData(key, []);
  await f.run();
  for (const key of keys) assert.equal(f.client.getQueryState(key).isInvalidated, true);
  assert.deepEqual(await f.hook.reconcile(), { id: '9', quantity: 0 });
  assert.equal(f.calls, 1);
  f.client.clear();
});

test('two concurrent writes share a lock; late response after switching account cannot invalidate new cache', async () => {
  let finish;
  const f = fixture(() => new Promise(resolve => { finish = resolve; }));
  const first = f.run();
  while (!finish) await new Promise(setImmediate);
  await assert.rejects(f.run(), error => error.status === 409);
  f.changeSession();
  f.client.setQueryData(['products'], ['new session']);
  finish({ id: '9', quantity: 0 });
  await assert.rejects(first, error => error.status === 401);
  assert.equal(f.calls, 1);
  assert.equal(f.client.getQueryState(['products']).isInvalidated, false);
  await assert.rejects(f.run(), error => error.status === 401);
  f.client.clear();
});

test('offline/timeout: dispatch once, never pause/replay on reconnect; GET reconciliation does not POST', async () => {
  let timeout;
  const f = fixture(async () => { throw timeout; });
  const { ApiError } = f.load('@/shared/api/errors');
  timeout = new ApiError(0, 'Timeout');
  f.client.setQueryData(['products'], ['stale']);
  onlineManager.setOnline(false);
  try {
    await assert.rejects(f.run());
    assert.equal(f.calls, 1);
    assert.equal(f.client.getQueryState(['products']).isInvalidated, true);
    onlineManager.setOnline(true);
    await new Promise(setImmediate);
    assert.equal(f.calls, 1);
    await f.hook.reconcile();
    assert.equal(f.calls, 1);
    for (const status of [0, 408, 404, 500]) assert.equal(f.queries.isStockResultUncertain(new ApiError(status, 'error')), true);
    assert.equal(f.queries.isStockResultUncertain(new ApiError(403, 'error')), false);
  } finally { onlineManager.setOnline(true); f.client.clear(); }
});

test('history query rejects stale-session and cancelled responses', async () => {
  const f = fixture();
  f.queries.useInventoryHistory('9', f.snapshot);
  const options = f.historyOptions;
  assert.equal(options.enabled, true);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(options.queryFn({ signal: controller.signal }));
  f.changeSession();
  await assert.rejects(options.queryFn({ signal: new AbortController().signal }), error => error.status === 401);
  f.client.clear();
});

function dialogHarness(write, read) {
  const React = require('react');
  const slots = [];
  let cursor = 0;
  let posts = 0;
  let gets = 0;
  let historyOpens = 0;
  const load = loader({
    react: { ...React,
      useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
      useRef: initial => { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    },
    '@/features/admin/inventory/queries': {
      isCurrentInventorySession: () => true,
      isStockResultUncertain: error => [0, 408, 404].includes(error.status) || error.status >= 500,
      useAdjustStock: () => ({ isPending: false, error: null,
        mutateAsync: async data => { posts++; return write(data); },
        reconcile: async () => { gets++; return read(); },
      }),
    },
  });
  const { AdjustStockDialog } = load('@/features/admin/inventory/components/AdjustStockDialog');
  function render() {
    cursor = 0;
    return AdjustStockDialog({ item: { id: '9', quantity: 5 }, session: {}, onClose() {}, onHistory() { historyOpens++; } });
  }
  function find(predicate, node = render()) {
    if (!node || typeof node !== 'object') return undefined;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const result = find(predicate, child);
      if (result) return result;
    }
  }
  function submit() { find(node => node.type === 'form').props.onSubmit({ preventDefault() {} }); }
  function quantity(value) { find(node => node.type === 'input').props.onChange({ target: { value } }); }
  return { find, submit, quantity, get posts() { return posts; }, get gets() { return gets; }, get historyOpens() { return historyOpens; } };
}

test('real dialog handler: double click writes once; saved POST + GET error offers history, not another POST', async () => {
  let finish;
  const h = dialogHarness(() => new Promise(resolve => { finish = resolve; }), async () => { throw new Error('GET failed'); });
  h.quantity('1');
  h.submit(); h.submit();
  assert.equal(h.posts, 1);
  finish({ id: '9', quantity: 6 });
  await new Promise(setImmediate);
  assert.equal(h.gets, 1);
  assert.equal(h.find(node => node.props?.type === 'submit'), undefined);
  h.submit();
  assert.equal(h.posts, 1);
  assert.equal(h.find(node => node.props?.children === 'Đọc lại tồn và lịch sử'), undefined);
  h.find(node => node.props?.children === 'Xem lịch sử').props.onClick();
  assert.equal(h.historyOpens, 1);
  assert.equal(h.gets, 1);
  assert.equal(h.posts, 1);
});

test('real dialog handler: timeout locks the attempt; history remains available and draft survives', async () => {
  const error = Object.assign(new Error('Timeout'), { status: 0 });
  const h = dialogHarness(async () => { throw error; }, async () => ({ id: '9', quantity: 6 }));
  h.quantity('1');
  h.submit();
  await new Promise(setImmediate);
  assert.equal(h.find(node => node.props?.type === 'submit'), undefined);
  assert.equal(h.find(node => node.type === 'input').props.value, '1');
  h.find(node => node.props?.children === 'Xem lịch sử').props.onClick();
  h.submit();
  assert.equal(h.posts, 1);
  assert.equal(h.gets, 0);
  assert.equal(h.historyOpens, 1);
  assert.equal(h.find(node => node.props?.type === 'submit'), undefined);
});
