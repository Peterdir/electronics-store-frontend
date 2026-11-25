// Mock contract/query/handler tests; these do not write to the real backend.
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
    const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    new Function('require', 'module', 'exports', source)(child => load(child, filename), module, module.exports);
    return module.exports;
  }
  return load;
}

test('schema: only final decisions, trimmed nonblank rejection, no rejection text for approval', () => {
  const { processReturnSchema: schema } = loader()('@/features/admin/returns/schemas');
  assert.deepEqual(schema.parse({ status: 'APPROVED', rejectReason: 'old draft' }), { status: 'APPROVED' });
  assert.deepEqual(schema.parse({ status: 'REJECTED', rejectReason: '  Thiếu bằng chứng  ' }), { status: 'REJECTED', rejectReason: 'Thiếu bằng chứng' });
  for (const input of [{ status: 'PENDING' }, { status: 'REJECTED' }, { status: 'REJECTED', rejectReason: ' \n ' }]) {
    assert.equal(schema.safeParse(input).success, false);
  }
});

test('filters: whitelist, safe URL page, canonical round trip', () => {
  const { parseReturnFilters: parse, serializeReturnFilters: serialize } = loader()('@/features/admin/returns/filters');
  const filters = { status: 'REJECTED', page: 3, size: 20 };
  assert.deepEqual(parse(serialize(filters)), filters);
  for (const page of ['0', '-1', '1.5', '1e3', '9007199254740993', '2147483648']) {
    assert.deepEqual(parse(new URLSearchParams({ status: 'INVALID', page, size: '999' })), { status: 'PENDING', page: 1, size: 10 });
  }
});

test('API: string Long ID, GET page conversion/signal, PUT JSON validation and normalized Spring page', async () => {
  const calls = [];
  const row = { id: '9007199254740993', status: 'APPROVED' };
  const load = loader({ '@/shared/api/client': { api: {
    get: async (...args) => { calls.push(['GET', ...args]); return { data: { content: [row], page: { number: 2, size: 10, totalElements: 21, totalPages: 3 } } }; },
    put: async (...args) => { calls.push(['PUT', ...args]); return { data: row }; },
  } } });
  const api = load('@/features/admin/returns/api');
  const signal = new AbortController().signal;
  assert.deepEqual(await api.getAdminReturns({ status: 'PENDING', page: 3, size: 10 }, signal, 'token'), {
    items: [row], page: 2, size: 10, totalItems: 21, totalPages: 3,
  });
  assert.equal(await api.processAdminReturn(row.id, { status: 'APPROVED' }, 'token'), row);
  assert.deepEqual(calls, [
    ['GET', '/api/admin/return-requests', { params: { status: 'PENDING', page: 2, size: 10 }, signal, meta: { authToken: 'token', noPublicRetry: true } }],
    ['PUT', `/api/admin/return-requests/${row.id}/process`, { status: 'APPROVED' }, { meta: { authToken: 'token', noPublicRetry: true } }],
  ]);
  await assert.rejects(api.processAdminReturn('0', { status: 'APPROVED' }, 'token'));
  await assert.rejects(api.processAdminReturn(row.id, { status: 'REJECTED', rejectReason: ' ' }, 'token'));
  assert.equal(calls.length, 2);
});

function fixture(dispatch = async () => ({ id: '9', status: 'APPROVED' }), role = 'ADMIN') {
  const snapshot = { userId: '1', role, token: 'token' };
  let state = { user: { id: '1', role }, token: 'token' };
  let options, queryOptions, calls = 0;
  const session = selector => selector(state);
  session.getState = () => state;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const load = loader({
    '@tanstack/react-query': { useQueryClient: () => client, useIsMutating: () => 0, useMutation: value => { options = value; return {}; }, useQuery: value => { queryOptions = value; return {}; } },
    '@/shared/auth/session.store': { useSession: session },
    '@/shared/auth/jwt': { isExpired: () => false },
    '@/features/admin/returns/api': { processAdminReturn: async () => { calls++; return dispatch(); }, getAdminReturns: dispatch },
  });
  const queries = load('@/features/admin/returns/queries');
  const hook = queries.useProcessReturn('9', snapshot);
  return {
    client, queries, hook, snapshot, get calls() { return calls; }, get queryOptions() { return queryOptions; },
    run: () => new MutationObserver(client, options).mutate({ status: 'APPROVED' }),
    changeSession: () => { state = { user: { id: '2', role: 'ADMIN' }, token: 'new-token' }; },
  };
}

test('query: cache scoped by user/role, stale session and aborted response are rejected', async () => {
  const f = fixture();
  try {
    f.queries.useAdminReturns({ status: 'PENDING', page: 1, size: 10 }, f.snapshot);
    assert.deepEqual(f.queryOptions.queryKey.slice(0, 5), ['admin', '1', 'ADMIN', 'returns', 'list']);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(f.queryOptions.queryFn({ signal: controller.signal }));
    f.changeSession();
    await assert.rejects(f.queryOptions.queryFn({ signal: new AbortController().signal }));
  } finally { f.client.clear(); }
});

test('permissions: STAFF views but cannot dispatch process', async () => {
  const f = fixture(undefined, 'STAFF');
  try {
    assert.equal(f.queries.isCurrentReturnsSession(f.snapshot), true);
    await assert.rejects(f.run(), error => error.status === 403);
    assert.equal(f.calls, 0);
  } finally { f.client.clear(); }
});

test('mutation: invalidates related records, leaves other admin session untouched', async () => {
  const f = fixture();
  try {
    const keys = ['returns', 'orders', 'inventory', 'products', 'dashboard'].map(name => ['admin', '1', 'ADMIN', name, 'list']);
    for (const key of [...keys, ['orders'], ['returns'], ['products'], ['cart'], ['wishlist'], ['admin', '2', 'ADMIN', 'orders']]) f.client.setQueryData(key, []);
    await f.run();
    for (const key of keys) assert.equal(f.client.getQueryState(key).isInvalidated, true);
    assert.equal(f.client.getQueryState(['orders']).isInvalidated, true);
    assert.equal(f.client.getQueryState(['admin', '2', 'ADMIN', 'orders']).isInvalidated, false);
  } finally { f.client.clear(); }
});

test('mutation: concurrent dispatch locked; late response after account switch cannot invalidate new session', async () => {
  let finish;
  const f = fixture(() => new Promise(resolve => { finish = resolve; }));
  try {
    const first = f.run();
    await new Promise(setImmediate);
    await assert.rejects(f.run(), error => error.status === 409);
    assert.equal(f.calls, 1);
    f.client.setQueryData(['orders'], []);
    f.changeSession();
    finish({ id: '9', status: 'APPROVED' });
    await assert.rejects(first, error => error.status === 401);
    assert.equal(f.client.getQueryState(['orders']).isInvalidated, false);
  } finally { f.client.clear(); }
});

test('mutation: offline failure executes once, never replays on reconnect', async () => {
  const f = fixture(async () => { throw new Error('network'); });
  try {
    onlineManager.setOnline(false);
    await assert.rejects(f.run());
    onlineManager.setOnline(true);
    await new Promise(setImmediate);
    assert.equal(f.calls, 1);
  } finally { onlineManager.setOnline(true); f.client.clear(); }
});

function dialogHarness(write, read) {
  const React = require('react');
  const slots = [];
  let cursor = 0, writes = 0, reads = 0;
  let blocked = false, result = null;
  const load = loader({
    react: { ...React,
      useEffect: effect => effect(),
      useId: () => 'reason',
      useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
      useRef: initial => { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    },
    '@/features/admin/returns/queries': {
      isCurrentReturnsSession: () => true,
      useProcessReturn: () => ({ isPending: false,
        mutateAsync: async payload => { writes++; return write(payload); },
        refreshRelated: async () => { reads++; return read(); },
      }),
    },
  });
  const { ProcessReturnDialog } = load('@/features/admin/returns/components/ProcessReturnDialog');
  function render() {
    cursor = 0;
    return ProcessReturnDialog({ request: result ?? { id: '9', status: 'PENDING', quantity: 1 }, snapshot: { role: 'ADMIN' }, blocked,
      onBlocked: () => { blocked = true; }, onSaved: row => { result = row; }, onBusyChange() {} });
  }
  function find(predicate, node = render()) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const found = find(predicate, child);
      if (found) return found;
    }
  }
  return { find, submit: async () => {
    find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    await new Promise(setImmediate);
  },
    get writes() { return writes; }, get reads() { return reads; }, get blocked() { return blocked; } };
}

test('real dialog handler: double click and successful PUT followed by GET failure never resubmit', async () => {
  let finish;
  const h = dialogHarness(() => new Promise(resolve => { finish = resolve; }), async () => { throw new Error('GET failed'); });
  const first = h.submit();
  await h.submit();
  assert.equal(h.writes, 1);
  finish({ id: '9', status: 'APPROVED', quantity: 1 });
  await first;
  await new Promise(setImmediate);
  assert.equal(h.reads, 1);
  assert.equal(h.find(node => node.props?.type === 'submit'), undefined);
  assert.match(h.find(node => node.props?.role === 'status').props.children, /Đã lưu/);
  assert.equal(h.find(node => node.props?.children === 'Tải lại dữ liệu'), undefined);
  await h.submit();
  assert.equal(h.writes, 1);
});

test('real dialog handler: blank rejection never dispatches; timeout locks attempt and retains reason', async () => {
  const h = dialogHarness(async () => { throw new Error('Timeout'); }, async () => {});
  h.find(node => node.type === 'select').props.onChange({ target: { value: 'REJECTED' } });
  h.find(node => node.type === 'textarea').props.onChange({ target: { value: '  ' } });
  await h.submit();
  assert.equal(h.writes, 0);
  h.find(node => node.type === 'textarea').props.onChange({ target: { value: 'Không đủ bằng chứng' } });
  await h.submit();
  assert.equal(h.blocked, true);
  assert.equal(h.find(node => node.type === 'textarea').props.value, 'Không đủ bằng chứng');
  await h.submit();
  assert.equal(h.writes, 1);
});
