const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { MemoryRouter } = require('react-router');
const root = path.resolve(__dirname, '..');

function loader(mocks = {}) {
  const cache = new Map();
  function load(name, parent = path.join(root, 'src/index.ts')) {
    const resolved = name.startsWith('@/') ? path.join(root, 'src', name.slice(2))
      : name.startsWith('.') ? path.resolve(path.dirname(parent), name) : null;
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

const range = { startDate: '2024-01-01', endDate: '2024-12-31' };
const schemas = loader()('@/features/admin/reports/schemas');
const report = { ...range, totalOrders: 1, totalGrossRevenue: 100, totalDiscountAmount: 10,
  totalShippingFee: 5, totalNetRevenue: 95, items: [
    { date: range.startDate, totalOrders: 1, grossRevenue: 100, discountAmount: 10, shippingFee: 5, netRevenue: 95 },
  ] };

test('date validation: 365-day difference allows 366 inclusive days; future, missing, impossible dates rejected', () => {
  const schema = schemas.createReportRangeSchema('2026-11-27');
  assert.equal(schema.safeParse(range).success, true);
  assert.equal(schema.safeParse({ startDate: '2024-02-29', endDate: '2024-02-29' }).success, true);
  for (const invalid of [
    { ...range, endDate: '2025-01-01' }, { ...range, startDate: '' },
    { startDate: '2026-11-28', endDate: '2026-11-28' },
    { startDate: '2026-02-29', endDate: '2026-03-01' },
    { startDate: '2026-11-27', endDate: '2026-11-26' },
  ]) assert.equal(schema.safeParse(invalid).success, false);
});

test('preview/export contract: auth, signal, unchanged dates, Blob and mismatched response guard', async () => {
  const calls = [];
  let response = { data: report, headers: {} };
  const api = loader({ '@/shared/api/client': { api: { get: async (...args) => { calls.push(args); return response; } } } })('@/features/admin/reports/api');
  const signal = new AbortController().signal;
  assert.equal(await api.getRevenueReport(range, signal, 'token'), report);
  assert.equal(calls[0][0], '/api/admin/reports/preview');
  assert.deepEqual(calls[0][1], { params: range, signal, meta: { authToken: 'token', noPublicRetry: true } });
  response = { data: { ...report, endDate: '2024-01-01' } };
  await assert.rejects(api.getRevenueReport(range, signal, 'token'), /không khớp/);
  await assert.rejects(api.getRevenueReport({ ...range, endDate: '' }, signal, 'token'));
  assert.equal(calls.length, 2);
  response = { data: new Blob(['a,b'], { type: 'text/csv' }), headers: { 'content-disposition': 'attachment; filename="report.csv"' } };
  assert.equal((await api.exportRevenueReport(range, signal, 'token')).filename, 'report.csv');
  assert.equal(calls[2][0], '/api/admin/reports/export');
  assert.equal(calls[2][1].responseType, 'blob');
  response = { data: new Blob(['{}'], { type: 'application/json' }), headers: {} };
  await assert.rejects(api.exportRevenueReport(range, signal, 'token'), /CSV/);
});

test('filename*: UTF-8 preference, quoted/plain filename, malformed fallback and path sanitization', () => {
  const { downloadFilename: name } = loader()('@/shared/api/download');
  assert.equal(name("attachment; filename=old.csv; filename*=UTF-8''b%C3%A1o.csv", 'fallback.csv'), 'báo.csv');
  assert.equal(name('attachment; filename="../../report.csv"', 'fallback.csv'), 'report.csv');
  assert.equal(name('attachment; filename="C:\\temp\\report.csv"', 'fallback.csv'), 'report.csv');
  assert.equal(name("attachment; filename=ok.csv; filename*=UTF-8''%XX", 'fallback.csv'), 'ok.csv');
  assert.equal(name(undefined, 'fallback.csv'), 'fallback.csv');
  assert.equal(name('attachment; filename=".."', 'fallback.csv'), 'fallback.csv');
  assert.equal(name('attachment; filename="a\u0000?.csv"', 'fallback.csv'), 'a_.csv');
});

test('download attaches/clicks/removes anchor and revokes object URL after start, including click failure', () => {
  const original = { document: global.document, create: URL.createObjectURL, revoke: URL.revokeObjectURL, timeout: global.setTimeout };
  const events = [];
  let fail = false;
  const anchor = { click: () => { events.push('click'); if (fail) throw Error('click'); }, remove: () => events.push('remove') };
  try {
    global.document = { createElement: () => anchor, body: { append: () => events.push('append') } };
    URL.createObjectURL = () => 'blob:test';
    URL.revokeObjectURL = url => events.push(url);
    global.setTimeout = callback => { events.push('delay'); callback(); };
    const { downloadBlob } = loader()('@/shared/api/download');
    downloadBlob(new Blob(['test']), 'report.csv');
    assert.equal(anchor.download, 'report.csv');
    assert.deepEqual(events, ['append', 'click', 'remove', 'delay', 'blob:test']);
    fail = true;
    assert.throws(() => downloadBlob(new Blob(), 'report.csv'));
    assert.equal(events.at(-1), 'blob:test');
  } finally {
    global.document = original.document;
    URL.createObjectURL = original.create;
    URL.revokeObjectURL = original.revoke;
    global.setTimeout = original.timeout;
  }
});

test('Blob errors preserve JSON/text/status fallbacks and avoid returning HTML', async () => {
  const { normalizeError } = loader()('@/shared/api/errors');
  for (const [body, status, expected] of [
    ['{"message":"Không có dữ liệu"}', 404, 'Không có dữ liệu'],
    ['No data', 404, 'No data'], ['', 403, 'Bạn không có quyền'],
    ['<html>Error</html>', 500, 'Đã có lỗi'], ['{bad', 400, '{bad'],
  ]) {
    const result = await normalizeError({ isAxiosError: true, response: { status, data: new Blob([body]) } });
    assert.equal(result.status, status);
    assert.ok(result.message.includes(expected));
  }
});

function queryHarness(role = 'ADMIN', submitted = range) {
  let options;
  const snapshot = { userId: '123', role, token: 'token' };
  const current = { user: { id: '123', role }, token: 'token' };
  let read = async () => report;
  const hooks = loader({
    '@tanstack/react-query': { useQuery: value => { options = value; return {}; } },
    '@/shared/auth/jwt': { isExpired: () => false },
    '@/shared/auth/session.store': { useSession: { getState: () => current } },
    '@/features/admin/reports/api': { getRevenueReport: () => read() },
  })('@/features/admin/reports/queries');
  hooks.useRevenueReport(submitted, snapshot);
  return { options, current, setRead: value => { read = value; } };
}

test('query waits for submission; cache keyed by user/role/submitted range; STAFF/CUSTOMER blocked', async () => {
  assert.equal(queryHarness('ADMIN', null).options.enabled, false);
  assert.equal(queryHarness('ADMIN', { ...range, endDate: '' }).options.enabled, false);
  for (const role of ['ADMIN', 'MANAGER', 'STAFF', 'CUSTOMER']) {
    const h = queryHarness(role);
    assert.equal(h.options.enabled, ['ADMIN', 'MANAGER'].includes(role));
    assert.deepEqual(h.options.queryKey, ['admin', '123', role, 'reports', 'preview', range]);
    if (!h.options.enabled) await assert.rejects(h.options.queryFn({ signal: new AbortController().signal }));
  }
});

test('late response cannot publish after session change or abort', async () => {
  const h = queryHarness();
  h.setRead(async () => { h.current.token = 'new'; return report; });
  await assert.rejects(h.options.queryFn({ signal: new AbortController().signal }));
  h.current.token = 'token';
  const controller = new AbortController();
  h.setRead(async () => { controller.abort(); return report; });
  await assert.rejects(h.options.queryFn({ signal: controller.signal }));
});

test('table displays backend aggregate without replacing it with row sums; zero/null/empty preserved', () => {
  const { RevenueReportTable } = loader()('@/features/admin/reports/components/RevenueReportTable');
  const html = renderToStaticMarkup(React.createElement(RevenueReportTable, { report: { ...report, totalOrders: 77 } }));
  assert.match(html, />77</);
  assert.match(html, /2024-01-01/);
  const empty = renderToStaticMarkup(React.createElement(RevenueReportTable, { report: { ...report, totalOrders: 0, totalNetRevenue: null, items: [] } }));
  assert.match(empty, /Không có đơn hàng/);
  assert.match(empty, /Không có dòng báo cáo/);
  assert.match(empty, /—/);
});

test('reports redirect preserves query/hash only for A/M', () => {
  global.window = { location: { origin: 'http://localhost:5173' } };
  try {
    const { getLoginDestination: destination } = loader()('@/shared/auth/redirect');
    for (const role of ['ADMIN', 'MANAGER']) assert.equal(destination(role, '/admin/reports#result'), '/admin/reports#result');
    assert.equal(destination('STAFF', '/admin/reports'), '/admin/orders');
    assert.equal(destination('CUSTOMER', '/admin/reports'), '/');
  } finally { delete global.window; }
});

function hookHarness(modulePath, mocks = {}) {
  const states = [], refs = [], cleanups = [];
  let stateIndex = 0, refIndex = 0;
  const load = loader({ react: {
    ...React,
    useState: initial => {
      const index = stateIndex++;
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
      return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
    },
    useRef: initial => { const index = refIndex++; refs[index] ??= { current: initial }; return refs[index]; },
    useId: () => 'test-id',
    useEffect: callback => { const cleanup = callback(); if (cleanup) cleanups.push(cleanup); },
  }, ...mocks });
  const component = Object.values(load(modulePath))[0];
  return { states, render: props => { stateIndex = 0; refIndex = 0; return component(props); }, cleanup: () => cleanups.forEach(fn => fn()) };
}

function elements(node) {
  if (!node || typeof node !== 'object') return [];
  return [node, ...React.Children.toArray(node.props?.children).flatMap(elements)];
}

test('real form handler: editing draft never submits; valid submit uses draft; invalid submit preserves previous report', () => {
  const submitted = [];
  const h = hookHarness('@/features/admin/reports/components/ReportDateRangeForm');
  const props = { onPreview: value => submitted.push(value) };
  let tree = h.render(props);
  const startInput = elements(tree).find(el => el.type === 'input');
  startInput.props.onChange({ target: { value: '' } });
  tree = h.render(props);
  assert.equal(submitted.length, 0);
  tree.props.onSubmit({ preventDefault() {} });
  assert.equal(submitted.length, 0);
  h.states[0] = range;
  tree = h.render(props);
  tree.props.onSubmit({ preventDefault() {} });
  assert.deepEqual(submitted, [range]);
  h.states[0] = { ...range, endDate: '' };
  tree = h.render(props);
  tree.props.onSubmit({ preventDefault() {} });
  assert.deepEqual(submitted, [range]);
});

test('real export handler: double click dispatches once; session switch or unmount suppresses download', async () => {
  for (const scenario of ['success', 'session', 'unmount', 'error', 'disabled']) {
    let current = true, calls = 0, downloads = 0, resolve, reject, signal;
    const done = new Promise((yes, no) => { resolve = yes; reject = no; });
    const h = hookHarness('@/features/admin/reports/components/ExportReportButton', {
      '@/features/admin/reports/api': { exportRevenueReport: (input, abortSignal) => { calls++; signal = abortSignal; assert.deepEqual(input, range); return done; } },
      '@/features/admin/reports/queries': { isCurrentReportsSession: () => current },
      '@/shared/api/download': { downloadBlob: () => { downloads++; } },
    });
    const tree = h.render({ range, snapshot: {}, disabled: scenario === 'disabled' });
    const button = elements(tree).find(el => el.props.onClick);
    button.props.onClick();
    button.props.onClick();
    assert.equal(calls, scenario === 'disabled' ? 0 : 1);
    if (scenario === 'session') current = false;
    if (scenario === 'unmount') { h.cleanup(); assert.equal(signal.aborted, true); }
    if (scenario === 'error') reject(new Error('404 no data'));
    else resolve({ blob: new Blob(), filename: 'test.csv' });
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(downloads, scenario === 'success' ? 1 : 0);
    if (scenario === 'error') assert.equal(h.states[1], '404 no data');
  }
});
