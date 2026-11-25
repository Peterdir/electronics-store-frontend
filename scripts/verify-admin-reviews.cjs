// Contract, query and real submit-handler tests with mock HTTP; no backend writes.
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

const { ApiError } = loader()('@/shared/api/errors');

test('reply schema trims and rejects missing/blank text without inventing a backend length limit', () => {
  const { reviewReplySchema: schema } = loader()('@/features/admin/reviews/schemas');
  assert.deepEqual(schema.parse({ replyText: '  Cảm ơn bạn!  ', hidden: true }), { replyText: 'Cảm ơn bạn!' });
  for (const input of [{}, { replyText: null }, { replyText: ' \n\t ' }]) assert.equal(schema.safeParse(input).success, false);
});

test('filters whitelist rating/size, bound page, trim names and round trip URLs', () => {
  const { parseReviewFilters: parse, serializeReviewFilters: serialize } = loader()('@/features/admin/reviews/filters');
  const filters = { productName: 'Điện thoại & máy tính', rating: 4, page: 3, size: 20 };
  assert.deepEqual(parse(serialize(filters)), filters);
  for (const page of ['0', '-1', '1e3', '1.5', '2147483648', '9007199254740993']) {
    assert.deepEqual(parse(new URLSearchParams({ rating: '4.5', size: '999', page, productName: '  TV  ' })), {
      productName: 'TV', rating: null, page: 1, size: 10,
    });
  }
});

test('API uses string Long ID, exact PATCH/POST contracts, hidden, fixed Pageable sort and abort signal', async () => {
  const calls = [];
  const row = { id: '9007199254740993', hidden: true };
  const message = { message: 'saved' };
  const load = loader({ '@/shared/api/client': { api: {
    get: async (...args) => { calls.push(['GET', ...args]); return { data: { content: [row], page: { number: 2, size: 20, totalElements: 41, totalPages: 3 } } }; },
    patch: async (...args) => { calls.push(['PATCH', ...args]); return { data: message }; },
    post: async (...args) => { calls.push(['POST', ...args]); return { data: message }; },
  } } });
  const api = load('@/features/admin/reviews/api');
  const signal = new AbortController().signal;
  const result = await api.getAdminReviews({ productName: 'TV', rating: 5, page: 3, size: 20 }, signal, 'token');
  assert.equal(result.items[0].hidden, true);
  assert.equal(result.totalItems, 41);
  assert.deepEqual(await api.toggleAdminReview(row.id, 'token'), message);
  assert.deepEqual(await api.replyAdminReview(row.id, { replyText: ' thanks ' }, 'token'), message);
  assert.deepEqual(calls, [
    ['GET', '/api/admin/reviews', { params: { rating: 5, productName: 'TV', page: 2, size: 20, sort: 'createdAt,desc' }, signal, meta: { authToken: 'token', noPublicRetry: true } }],
    ['PATCH', `/api/admin/reviews/${row.id}/toggle-visibility`, undefined, { meta: { authToken: 'token', noPublicRetry: true } }],
    ['POST', `/api/admin/reviews/${row.id}/reply`, { replyText: 'thanks' }, { meta: { authToken: 'token', noPublicRetry: true } }],
  ]);
  for (const id of ['0', '-1', '9223372036854775808', '1.2']) await assert.rejects(api.toggleAdminReview(id, 'token'));
  await assert.rejects(api.replyAdminReview(row.id, { replyText: ' ' }, 'token'));
  assert.equal(calls.length, 3);
});

function fixture({ dispatch = async () => ({ message: 'saved' }), role = 'ADMIN', action = 'toggle' } = {}) {
  const snapshot = { userId: '1', role, token: 'token' };
  let state = { user: { id: '1', role }, token: 'token' };
  let options, queryOptions, calls = 0;
  const session = selector => selector(state);
  session.getState = () => state;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } });
  const write = async () => { calls++; return dispatch(); };
  const load = loader({
    '@tanstack/react-query': { useQueryClient: () => client, useIsMutating: () => 0, useMutation: value => { options = value; return {}; }, useQuery: value => { queryOptions = value; return {}; } },
    '@/shared/auth/session.store': { useSession: session },
    '@/shared/auth/jwt': { isExpired: () => false },
    '@/features/admin/reviews/api': { toggleAdminReview: write, replyAdminReview: write, getAdminReviews: dispatch },
  });
  const queries = load('@/features/admin/reviews/queries');
  const hook = queries.useAdminReviewAction('9', action, snapshot);
  return {
    client, queries, hook, snapshot, get calls() { return calls; }, get queryOptions() { return queryOptions; },
    run: () => new MutationObserver(client, options).mutate(action === 'reply' ? { replyText: 'Thanks' } : undefined),
    changeSession: () => { state = { user: { id: '2', role: 'ADMIN' }, token: 'new-token' }; },
  };
}

test('STAFF can view/reply but cannot dispatch visibility; CUSTOMER cannot view', async () => {
  for (const [role, action, allowed] of [['STAFF', 'toggle', false], ['STAFF', 'reply', true], ['MANAGER', 'toggle', true], ['CUSTOMER', 'reply', false]]) {
    const f = fixture({ role, action });
    try {
      assert.equal(f.queries.isCurrentReviewsSession(f.snapshot), role !== 'CUSTOMER');
      if (allowed) await f.run();
      else await assert.rejects(f.run(), error => error.status === 403);
      assert.equal(f.calls, allowed ? 1 : 0);
    } finally { f.client.clear(); }
  }
});

test('query is scoped by user/role and rejects aborted or stale session responses', async () => {
  let finish;
  const f = fixture({ dispatch: () => new Promise(resolve => { finish = resolve; }) });
  try {
    f.queries.useAdminReviews({ productName: '', rating: null, page: 1, size: 10 }, f.snapshot);
    assert.deepEqual(f.queryOptions.queryKey.slice(0, 5), ['admin', '1', 'ADMIN', 'reviews', 'list']);
    assert.equal(JSON.stringify(f.queryOptions.queryKey).includes('token'), false);
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(f.queryOptions.queryFn({ signal: controller.signal }));
    const promise = f.queryOptions.queryFn({ signal: new AbortController().signal });
    f.changeSession();
    finish([]);
    await assert.rejects(promise, error => error.status === 401);
    await assert.rejects(f.queryOptions.queryFn({ signal: new AbortController().signal }));
  } finally { f.client.clear(); }
});

test('mutation invalidates review/product caches without changing another admin session or calculating ratings', async () => {
  const f = fixture();
  try {
    const keys = [['admin', '1', 'ADMIN', 'reviews'], ['admin', '1', 'ADMIN', 'products'], ['reviews'], ['products']];
    for (const key of [...keys, ['admin', '2', 'ADMIN', 'reviews']]) f.client.setQueryData(key, { averageRating: 4.5 });
    await f.run();
    for (const key of keys) {
      assert.equal(f.client.getQueryState(key).isInvalidated, true);
      assert.deepEqual(f.client.getQueryData(key), { averageRating: 4.5 });
    }
    assert.equal(f.client.getQueryState(['admin', '2', 'ADMIN', 'reviews']).isInvalidated, false);
  } finally { f.client.clear(); }
});

test('same row concurrent writes are blocked; late session cannot invalidate cache', async () => {
  let finish;
  const f = fixture({ dispatch: () => new Promise(resolve => { finish = resolve; }) });
  try {
    const first = f.run();
    await new Promise(setImmediate);
    await assert.rejects(f.run(), error => error.status === 409);
    assert.equal(f.calls, 1);
    f.client.setQueryData(['products'], []);
    f.changeSession();
    finish({ message: 'saved' });
    await assert.rejects(first, error => error.status === 401);
    assert.equal(f.client.getQueryState(['products']).isInvalidated, false);
  } finally { f.client.clear(); }
});

test('offline toggle executes once and never replays on reconnect', async () => {
  const f = fixture({ dispatch: async () => { throw new Error('offline'); } });
  try {
    onlineManager.setOnline(false);
    await assert.rejects(f.run());
    onlineManager.setOnline(true);
    await new Promise(setImmediate);
    assert.equal(f.calls, 1);
  } finally { onlineManager.setOnline(true); f.client.clear(); }
});

function dialogHarness({ action = 'toggle', write = async () => ({ message: 'saved' }), read = async () => {} } = {}) {
  const React = require('react');
  const slots = [];
  let cursor = 0, writes = 0, reads = 0, blocked = false, missing = false, current = true;
  const notices = [];
  const load = loader({
    react: { ...React,
      useEffect: effect => effect(),
      useId: () => 'reply',
      useState: initial => { const index = cursor++; if (!(index in slots)) slots[index] = initial; return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value; }]; },
      useRef: initial => { const index = cursor++; if (!(index in slots)) slots[index] = { current: initial }; return slots[index]; },
    },
    '@/shared/api/errors': { ApiError },
    '@/features/admin/reviews/queries': {
      isCurrentReviewsSession: () => current,
      useAdminReviewAction: () => ({ isPending: false,
        mutateAsync: async payload => { writes++; return write(payload); },
        refreshRelated: async () => { reads++; return read(); },
      }),
    },
  });
  const { ReviewActionDialog } = load('@/features/admin/reviews/components/ReviewActionDialog');
  function render() {
    cursor = 0;
    return ReviewActionDialog({ review: { id: '9', hidden: false, adminReply: null }, snapshot: { role: 'ADMIN' }, action, blocked,
      onBlocked: () => { blocked = true; }, onMissing: () => { missing = true; }, onNotice: text => notices.push(text) });
  }
  function find(predicate, node = render()) {
    if (!node || typeof node !== 'object') return;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props?.children)) {
      const found = find(predicate, child);
      if (found) return found;
    }
  }
  return { find, notices, changeSession: () => { current = false; }, submit: async () => {
    find(node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    await new Promise(setImmediate);
  }, get writes() { return writes; }, get reads() { return reads; }, get blocked() { return blocked; }, get missing() { return missing; } };
}

test('real handler: double click + successful toggle/failed GET cannot issue another PATCH', async () => {
  let finish;
  const h = dialogHarness({ write: () => new Promise(resolve => { finish = resolve; }), read: async () => { throw new Error('GET failed'); } });
  const first = h.submit();
  await h.submit();
  assert.equal(h.writes, 1);
  finish({ message: 'saved' });
  await first;
  await new Promise(setImmediate);
  assert.equal(h.blocked, true);
  assert.equal(h.reads, 1);
  assert.match(h.notices.at(-1), /Đã lưu.*không gửi lại/);
  await h.submit();
  assert.equal(h.writes, 1);
});

test('real handler: blank reply rejected, draft retained after timeout, closed/reopened attempt stays blocked', async () => {
  const h = dialogHarness({ action: 'reply', write: async () => { throw new Error('Timeout'); } });
  const input = () => h.find(node => node.type === 'textarea');
  input().props.onChange({ target: { value: '  ' } });
  await h.submit();
  assert.equal(h.writes, 0);
  input().props.onChange({ target: { value: 'Cảm ơn bạn!' } });
  await h.submit();
  assert.equal(h.blocked, true);
  assert.equal(input().props.value, 'Cảm ơn bạn!');
  h.find(node => typeof node.props?.onOpenChange === 'function').props.onOpenChange(false, { cancel() {} });
  h.find(node => typeof node.props?.onOpenChange === 'function').props.onOpenChange(true, { cancel() {} });
  await h.submit();
  assert.equal(h.writes, 1);
});

test('real handler: 404 removes review/form and refetches; 400 keeps reply editable', async () => {
  const missing = dialogHarness({ write: async () => { throw new ApiError(404, 'deleted'); } });
  await missing.submit();
  assert.equal(missing.missing, true);
  assert.equal(missing.reads, 1);
  const invalid = dialogHarness({ action: 'reply', write: async () => { throw new ApiError(400, 'invalid reply'); } });
  invalid.find(node => node.type === 'textarea').props.onChange({ target: { value: 'Thanks' } });
  await invalid.submit();
  assert.equal(invalid.blocked, false);
  assert.equal(invalid.find(node => node.type === 'textarea').props.disabled, false);
});

test('real handler: late session does not publish success notice or block the new session', async () => {
  let finish;
  const h = dialogHarness({ write: () => new Promise(resolve => { finish = resolve; }) });
  const first = h.submit();
  h.changeSession();
  finish({ message: 'saved' });
  await first;
  await new Promise(setImmediate);
  assert.deepEqual(h.notices, []);
  assert.equal(h.blocked, false);
});

test('real handler: timeout toggle stays blocked even when reconciliation GET succeeds', async () => {
  const h = dialogHarness({ write: async () => { throw new Error('Timeout'); } });
  await h.submit();
  assert.equal(h.reads, 1);
  assert.equal(h.blocked, true);
  await h.submit();
  assert.equal(h.writes, 1);
  assert.match(h.notices[0], /GET sau timeout chưa chứng minh/);
});

test('login redirect preserves review filters/hash for staff and rejects CUSTOMER admin destination', () => {
  const previousWindow = global.window;
  global.window = { location: { origin: 'https://shop.test' } };
  try {
    const { getLoginDestination } = loader()('@/shared/auth/redirect');
    const target = '/admin/reviews?rating=5&productName=TV&page=2#reviews';
    for (const role of ['ADMIN', 'MANAGER', 'STAFF']) assert.equal(getLoginDestination(role, target), target);
    assert.equal(getLoginDestination('CUSTOMER', target), '/');
  } finally { global.window = previousWindow; }
});
