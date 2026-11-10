/* Reconstructs request interfaces from syntax. Does not execute source or call APIs. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const project = path.resolve(__dirname, '..');
const specDir = path.resolve(option('--out-dir', path.join(project, 'spec')));
const sourceDir = path.resolve(option('--source-dir', path.join(project, '.cache/sources')));
const indexDir = path.resolve(option('--index-dir', path.join(project, '.cache/ast-index')));
const manifest = JSON.parse(fs.readFileSync(option('--manifest', path.join(specDir, 'source-manifest.json')), 'utf8'));
const acorn = require(option('--acorn-path', 'acorn'));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const runtimeServices = {
  URL_API_PTF: ['platform', '/lyaptf/api'], URL_API_GED: ['ged', '/lyaGed/api'],
  URL_API_SIGN: ['signature', '/lyasign/api'], URL_API_MAIL: ['mail', ''],
  URL_API_MSG: ['messaging', '/lyamsg/api'], URL_API_DEMANDE: ['requests', '/api'],
  URL_API_CONNECTOR: ['connector', '/lyaConnector/api'], URL_API_TARIF_GATEWAY: ['pricingGateway', '/tarifGateway'],
  URL_API_FORMULAIRE: ['forms', '/lyaform'], URL_API_IDENTITY: ['identity', '/lyaIdentity'],
  URL_API_AI: ['ai', ''], URL_API_USAGE: ['usage', ''], URL_API_REPORTS: ['reports', ''],
  URL_API_SCRAP: ['scraping', ''], URL_API_POSTAL: ['postal', ''], URL_API_SOCKET: ['socket', '']
};
const services = [], origins = new Map(), runtimeOrigins = new Map();
const mainEntry = manifest.sources.find(s => s.id === 'main');
const mainSource = fs.readFileSync(path.join(sourceDir, mainEntry.cachePath), 'utf8');
for (const match of mainSource.matchAll(/(URL_API_[A-Z_]+):"(https:\/\/[^" ]+)"/g)) {
  const mapping = runtimeServices[match[1]];
  if (!mapping || runtimeOrigins.has(match[1])) continue;
  const [id, sdkBasePath] = mapping;
  const origin = new URL(match[2]).origin;
  services.push({ id, baseUrl: origin, basePath: '', sdkService: id, sdkBasePath, environment: 'PRO frontend default', authentication: 'Observed browser mechanism; credential permissions unverified', sourceEvidence: { sourceId: 'main', sourceSha256: mainEntry.sha256, offsetUtf16: match.index, runtimeVariable: match[1] } });
  origins.set(origin, id); runtimeOrigins.set(match[1], origin);
}
const enterpriseEntry = manifest.sources.find(s => s.id === 'enterprise');
const enterpriseSource = enterpriseEntry ? fs.readFileSync(path.join(sourceDir, enterpriseEntry.cachePath), 'utf8') : '';
const enterpriseBaseMatch = /this\.configurationPtfAssure=\{baseURL:"(https:\/\/[^" ]+)"\}/.exec(enterpriseSource);
const enterpriseOrigin = enterpriseBaseMatch ? new URL(enterpriseBaseMatch[1]).origin : null;
if (enterpriseOrigin) {
  services.push({ id: 'insuredPortal', baseUrl: enterpriseOrigin, basePath: '', sdkService: 'insuredPortal', sdkBasePath: '/lyaptfassure/api', environment: 'PRO frontend default', sourceEvidence: { sourceId: 'enterprise', sourceSha256: enterpriseEntry.sha256, offsetUtf16: enterpriseBaseMatch.index, expression: 'this.configurationPtfAssure.baseURL' } });
  origins.set(enterpriseOrigin, 'insuredPortal');
}
services.push({ id: 'platformFlux', baseUrl: runtimeOrigins.get('URL_API_PTF'), basePath: '', sdkService: 'platformFlux', sdkBasePath: '/lyaptf/flux', environment: 'PRO frontend default', sourceEvidence: { sourceId: 'main', expression: 'getRunTimeVar(API_ENDPOINTS.URL_API_PTF)+"/lyaptf/flux"' } });
services.push({ id: 'platformFile', baseUrl: runtimeOrigins.get('URL_API_PTF'), basePath: '', sdkService: 'platformFile', sdkBasePath: '/lyaptf/file', environment: 'PRO frontend default', sourceEvidence: { sourceId: 'main', expression: 'Observed /lyaptf/file request paths on URL_API_PTF' } });
const serviceMap = new Map(services.map(s => [s.id, s]));
const operationMap = new Map(), unresolved = [], exclusions = [], perSource = [];
let candidateCallsites = 0, normalizedCallsites = 0;
const knownMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
const modes = { myFetch: 'envelope-body', simpleApiFetch: 'json', simpleApiFetchWithCredential: 'json', fetchFile: 'blob', fetchFlux: 'ndjson', fetchStream: 'byte-stream' };

function processSource(entry) {
  const source = fs.readFileSync(path.join(sourceDir, entry.cachePath), 'utf8');
  if (hash(Buffer.from(source, 'utf8')) !== entry.sha256) throw new Error(`Hash mismatch: ${entry.id}`);
  const declarationsFile = JSON.parse(fs.readFileSync(path.join(indexDir, `${entry.id}-declarations.json`), 'utf8'));
  const callsFile = JSON.parse(fs.readFileSync(path.join(indexDir, `${entry.id}-calls.json`), 'utf8'));
  const declarations = declarationsFile.declarations, functions = declarationsFile.functions, assignments = declarationsFile.assignments || [];
  const fnMap = new Map(functions.map(f => [f.start, f]));
  const endByStart = new Map();
  for (const d of declarations) if (d.initializerStart != null) endByStart.set(d.initializerStart, d.initializerEnd);
  for (const c of callsFile.calls) for (const a of c.args) endByStart.set(a.start, a.end);
  for (const a of assignments) endByStart.set(a.rightStart, a.rightEnd);
  const scopeMap = new Map();
  for (const d of declarations) {
    if (!scopeMap.has(d.scopeFunction)) scopeMap.set(d.scopeFunction, new Map());
    const names = scopeMap.get(d.scopeFunction);
    if (!names.has(d.name)) names.set(d.name, []);
    names.get(d.name).push(d);
  }
  const nodeCache = new Map();
  const nodeAt = start => {
    if (start == null) return null;
    if (!nodeCache.has(start)) {
      try {
        const end = endByStart.get(start);
        if (end == null) { nodeCache.set(start, acorn.parseExpressionAt(source, start, { ecmaVersion: 'latest', sourceType: 'module' })); }
        else {
          const node = acorn.parseExpressionAt(source.slice(start, end), 0, { ecmaVersion: 'latest', sourceType: 'module' });
          const shift = n => { if (!n?.type) return; n.start += start; n.end += start; for (const [k,v] of Object.entries(n)) { if (['start','end','type'].includes(k)) continue; if (Array.isArray(v)) { for (const child of v) if (child?.type) shift(child); } else if (v?.type) shift(v); } };
          shift(node); nodeCache.set(start, node);
        }
      }
      catch { nodeCache.set(start, null); }
    }
    return nodeCache.get(start);
  };
  const text = node => node ? source.slice(node.start, node.end) : null;
  function scopes(fnStart) {
    const out = [], seen = new Set(); let cur = fnStart;
    while (cur != null && !seen.has(cur)) { seen.add(cur); out.push(cur); cur = fnMap.get(cur)?.parentFunction ?? null; }
    out.push(null); return out;
  }
  function lookup(name, ctx) {
    for (const scope of scopes(ctx.fn)) {
      const list = scopeMap.get(scope)?.get(name);
      if (list?.length) return list.filter(d => d.declarationStart <= ctx.position).at(-1) || list[0];
      const f = fnMap.get(scope);
      if (f?.params.some(p => p === name || p.startsWith(`${name}=`))) return { parameter: true, name };
    }
    return null;
  }
  function placeholder(node, ctx, encoding = 'raw', kind = 'value') {
    const id = ctx.tokens.length;
    ctx.tokens.push({ sourceExpression: text(node), encoding, kind });
    return [`@@P${id}@@`];
  }
  const combine = (a, b) => {
    if (a.length * b.length > 16) throw new Error('More than 16 static route variants');
    return a.flatMap(x => b.map(y => x + y));
  };
  function objectNode(node, ctx, seen = new Set()) {
    if (!node) return null;
    if (node.type === 'ObjectExpression') return node;
    if (node.type === 'Identifier' && !seen.has(node.name)) {
      const d = lookup(node.name, ctx);
      if (d && !d.parameter && d.initializerStart != null) return objectNode(nodeAt(d.initializerStart), { ...ctx, fn: d.scopeFunction }, new Set([...seen, node.name]));
    }
    return null;
  }
  function property(node, key, ctx) {
    const obj = objectNode(node, ctx);
    return obj?.properties.find(p => p.type === 'Property' && (p.key.name || p.key.value) === key)?.value || null;
  }
  function isStringy(node, ctx, seen = new Set()) {
    if (!node) return false;
    if (node.type === 'TemplateLiteral' || node.type === 'Literal' && typeof node.value === 'string') return true;
    if (node.type === 'BinaryExpression' && node.operator === '+') return isStringy(node.left, ctx, seen) || isStringy(node.right, ctx, seen);
    if (node.type === 'Identifier' && !seen.has(node.name)) {
      const d = lookup(node.name, ctx); if (d && !d.parameter) return isStringy(nodeAt(d.initializerStart), { ...ctx, fn: d.scopeFunction }, new Set([...seen, node.name]));
    }
    return node.type === 'CallExpression' && (text(node.callee) === 'getRunTimeVar' || node.callee.type === 'MemberExpression' && node.callee.property.name === 'concat');
  }
  function evalRoute(node, ctx, depth = 0) {
    if (!node) return [''];
    if (depth > 25) return placeholder(node, ctx);
    if (node.type === 'ChainExpression') return evalRoute(node.expression, ctx, depth + 1);
    if (node.type === 'Literal') return [node.value == null ? String(node.value) : String(node.value)];
    if (node.type === 'TemplateLiteral') {
      let result = [node.quasis[0].value.cooked ?? node.quasis[0].value.raw];
      for (let i = 0; i < node.expressions.length; i++) result = combine(combine(result, evalRoute(node.expressions[i], ctx, depth + 1)), [node.quasis[i + 1].value.cooked ?? node.quasis[i + 1].value.raw]);
      return result;
    }
    if (node.type === 'Identifier') {
      if (ctx.substitutions?.has(node.name)) return evalRoute(ctx.substitutions.get(node.name), { ...ctx, substitutions: null }, depth + 1);
      if (!ctx.seen.has(node.name)) {
        const d = lookup(node.name, ctx);
        if (d && !d.parameter && d.initializerStart != null) {
          const value = evalRoute(nodeAt(d.initializerStart), { ...ctx, fn: d.scopeFunction, seen: new Set([...ctx.seen, node.name]) }, depth + 1);
          const changes = assignments.filter(a => a.name === node.name && a.scopeFunction === d.scopeFunction && a.operator === '+=' && a.start > d.declarationStart && a.start < ctx.position);
          if (changes.length) {
            let variants = value;
            for (const change of changes) variants = [...variants, ...combine(variants, evalRoute(nodeAt(change.rightStart), ctx, depth + 1))];
            return [...new Set(variants)].slice(0, 16);
          }
          return value;
        }
      }
      return placeholder(node, ctx);
    }
    if (node.type === 'BinaryExpression' && node.operator === '+' && isStringy(node, ctx)) return combine(evalRoute(node.left, ctx, depth + 1), evalRoute(node.right, ctx, depth + 1));
    if (node.type === 'ConditionalExpression') {
      const branchText = text(node.consequent) + text(node.alternate);
      if (/[/?&]/.test(branchText) || node.consequent.type === 'Literal' && node.consequent.value === '' || node.alternate.type === 'Literal' && node.alternate.value === '') {
        ctx.conditions.push(text(node.test));
        return [...new Set([...evalRoute(node.consequent, ctx, depth + 1), ...evalRoute(node.alternate, ctx, depth + 1)])];
      }
      return placeholder(node, ctx);
    }
    if (node.type === 'NewExpression' && text(node.callee) === 'URLSearchParams') {
      const obj = objectNode(node.arguments[0], ctx);
      if (!obj || obj.properties.some(p => p.type !== 'Property' || p.computed)) return placeholder(node, ctx, 'query-fragment', 'query-fragment');
      let out = [''];
      for (const [i, prop] of obj.properties.entries()) {
        const key = prop.key.name ?? prop.key.value;
        const val = prop.value.type === 'Literal' ? [encodeURIComponent(String(prop.value.value))] : placeholder(prop.value, ctx, 'URLSearchParams', 'query-value');
        out = combine(out, combine([`${i ? '&' : ''}${encodeURIComponent(key)}=`], val));
      }
      return out;
    }
    if (node.type === 'CallExpression') {
      const callee = text(node.callee);
      if (callee === 'getRunTimeVar') {
        const key = node.arguments[0]?.type === 'Literal' ? node.arguments[0].value : text(node.arguments[0])?.split('.').at(-1);
        if (runtimeOrigins.has(key)) return [runtimeOrigins.get(key)];
      }
      if (callee === 'encodeURIComponent' || callee === 'encodeURI') {
        const val = node.arguments[0];
        if (val?.type === 'Literal') return [callee === 'encodeURIComponent' ? encodeURIComponent(String(val.value)) : encodeURI(String(val.value))];
        return placeholder(val || node, ctx, callee);
      }
      if (node.callee.type === 'MemberExpression') {
        const member = node.callee.property.name, object = node.callee.object;
        if (member === 'concat') {
          let result = evalRoute(object, ctx, depth + 1);
          for (const arg of node.arguments) result = combine(result, evalRoute(arg, ctx, depth + 1));
          return result;
        }
        if (member === 'toString') {
          if (object.type === 'NewExpression' && text(object.callee) === 'URLSearchParams') return evalRoute(object, ctx, depth + 1);
          if (object.type === 'Identifier') {
            const d = lookup(object.name, ctx), init = d && !d.parameter ? nodeAt(d.initializerStart) : null;
            if (init?.type === 'NewExpression' && text(init.callee) === 'URLSearchParams') return evalRoute(init, ctx, depth + 1);
          }
          return placeholder(node, ctx);
        }
        if (member === 'replace' && /\/\+?\$/.test(text(node.arguments[0]) || '') && node.arguments[1]?.value === '') return evalRoute(object, ctx, depth + 1).map(v => v.replace(/\/+$/, ''));
        if (member === 'join' && node.arguments[0]?.value === '/') {
          const compact = object.type === 'CallExpression' && text(object.callee) === 'lodash.compact';
          const array = compact ? object.arguments[0] : object;
          if (array?.type === 'ArrayExpression') {
            let result = [''];
            for (const [i, element] of array.elements.entries()) {
              const part = evalRoute(element, ctx, depth + 1);
              result = compact && element?.type !== 'Literal' ? [...result, ...combine(result, combine([i ? '/' : ''], part))] : combine(result, combine([i ? '/' : ''], part));
            }
            return [...new Set(result)];
          }
        }
      }
      if (node.callee.type === 'Identifier' && !ctx.seen.has(node.callee.name)) {
        const d = lookup(node.callee.name, ctx), fn = d && !d.parameter ? nodeAt(d.initializerStart) : null;
        if (fn && ['ArrowFunctionExpression', 'FunctionExpression'].includes(fn.type) && fn.params.every(p => p.type === 'Identifier' || p.type === 'AssignmentPattern' && p.left.type === 'Identifier')) {
          const returned = fn.body.type !== 'BlockStatement' ? fn.body : fn.body.body.length === 1 && fn.body.body[0].type === 'ReturnStatement' ? fn.body.body[0].argument : null;
          if (returned) {
            const substitutions = new Map(fn.params.map((p, i) => [p.name || p.left.name, node.arguments[i] || p.right]));
            return evalRoute(returned, { ...ctx, fn: fn.start, substitutions, seen: new Set([...ctx.seen, node.callee.name]) }, depth + 1);
          }
        }
      }
      return placeholder(node, ctx, ctx.queryContext ? 'query-fragment' : 'raw');
    }
    return placeholder(node, ctx);
  }
  function resolveBody(node, ctx, encodingOverride) {
    if (!node || node.type === 'Literal' && node.value === null || node.type === 'UnaryExpression' && node.operator === 'void' || node.type === 'Identifier' && node.name === 'undefined') return { encoding: 'none', expression: null, observedFields: [] };
    let encoding = encodingOverride || 'opaque', payload = node;
    if (node.type === 'CallExpression' && text(node.callee) === 'JSON.stringify') { encoding = 'json'; payload = node.arguments[0]; }
    if (encodingOverride === 'json') payload = node;
    const obj = objectNode(payload, ctx);
    const observedFields = obj ? obj.properties.filter(p => p.type === 'Property' && !p.computed).map(p => ({ name: p.key.name ?? String(p.key.value), sourceExpression: text(p.value), requiredByServer: 'unknown' })) : [];
    let actual = payload;
    if (payload?.type === 'Identifier') { const d = lookup(payload.name, ctx); if (d && !d.parameter) actual = nodeAt(d.initializerStart); }
    if (actual?.type === 'NewExpression' && text(actual.callee) === 'FormData') {
      encoding = 'form-data';
      const f = fnMap.get(ctx.fn), snippet = source.slice(f?.start || 0, ctx.position);
      const variable = payload.name;
      const re = new RegExp(`\\b${variable.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.append\\(\"([^\"]+)\"`, 'g');
      for (const match of snippet.matchAll(re)) if (!observedFields.some(p => p.name === match[1])) observedFields.push({ name: match[1], requiredByServer: 'unknown' });
    }
    return { encoding, expression: text(payload), observedFields, serverSchemaKnown: false };
  }
  function namedFunction(start) {
    for (const scope of scopes(start)) { const f = fnMap.get(scope); if (f && !f.name.startsWith('anonymous@')) return f.name; }
    return fnMap.get(start)?.name || null;
  }
  function namedFunctionParameters(start) {
    for (const scope of scopes(start)) { const f = fnMap.get(scope); if (f && !f.name.startsWith('anonymous@')) return f.params; }
    return fnMap.get(start)?.params || [];
  }
  function normalize(call) {
    const ctx = { fn: call.functionStart, position: call.start, seen: new Set(), tokens: [], substitutions: null, conditions: [] };
    const nodes = call.args.map(a => nodeAt(a.start));
    let method, urlNode = nodes[0], bodyNode, bodyOverride, responseMode, base = null, frontendAuth = 'unknown', headersExpression = null, optionsNode = null;
    if (Object.hasOwn(modes, call.callee)) {
      method = nodes[1]?.value; bodyNode = nodes[2]; responseMode = modes[call.callee];
      base = runtimeOrigins.get('URL_API_PTF') + (call.callee === 'fetchFlux' ? '/lyaptf/flux' : '/lyaptf/api');
      frontendAuth = call.args[3]?.source === '!0' ? 'bearer-marker-true' : 'bearer-marker-false-or-default';
      if (call.function && ['simpleApiFetch', 'myFetch'].includes(call.function)) return { excluded: 'generic-transport-implementation' };
    } else if (entry.id === 'adhesion' && /^Ze\./.test(call.callee)) {
      const verb = call.callee.split('.').at(-1); method = verb === 'upload' ? 'POST' : verb.toUpperCase();
      base = runtimeOrigins.get('URL_API_FORMULAIRE') + '/lyaform'; responseMode = 'json-or-text';
      frontendAuth = 'session-bearer-when-present';
      if (['POST', 'PUT', 'PATCH'].includes(method)) { bodyNode = nodes[1]; bodyOverride = verb === 'upload' ? 'form-data' : 'json'; optionsNode = nodes[2]; }
      else optionsNode = nodes[1];
    } else if (entry.id === 'enterprise' && /\.(get|post|put|patch|delete)$/.test(call.callee)) {
      method = call.callee.match(/\.(get|post|put|patch|delete)$/)[1].toUpperCase();
      const specified = call.callee.match(/baseURL:"([^"]+)"/); base = specified ? specified[1] : enterpriseOrigin;
      responseMode = 'json'; frontendAuth = call.callee.includes('.restricted(') ? 'bearer-token' : 'unknown';
      if (method === 'GET') optionsNode = nodes[1];
      else if (method === 'DELETE') { optionsNode = nodes[1]; bodyNode = property(optionsNode, 'data', ctx); bodyOverride = 'json'; }
      else { bodyNode = nodes[1]; bodyOverride = 'json'; optionsNode = nodes[2]; }
      headersExpression = text(property(optionsNode, 'headers', ctx));
    } else if (call.callee === 'fetch' || entry.id === 'generalForms' && call.callee === 'sx') {
      optionsNode = nodes[1];
      const opt = objectNode(optionsNode, ctx);
      const methodNode = property(optionsNode, 'method', ctx);
      method = methodNode?.type === 'Literal' ? String(methodNode.value).toUpperCase() : !optionsNode || opt && !methodNode ? 'GET' : null;
      bodyNode = property(optionsNode, 'body', ctx); headersExpression = text(property(optionsNode, 'headers', ctx));
      responseMode = call.callee === 'sx' ? 'json' : 'unknown';
      if (entry.id === 'main' && call.function === 'updateAgentActif') responseMode = 'json';
      if (entry.id === 'main' && call.function === 'affecterUneDemande') responseMode = 'custom-auto-assignment';
      if (headersExpression?.includes('needAuthorizationHeader:"true"')) frontendAuth = 'bearer-marker-true';
      if (['simpleApiFetchWithCredential', 'fetchFile', 'fetchStream', 'fetchFlux'].includes(call.function)) return { excluded: 'generic-transport-implementation' };
    } else if (call.callee === 'useLyaEventStream') {
      urlNode = property(nodes[0], 'url', ctx); method = 'GET'; responseMode = 'sse'; frontendAuth = 'fresh-access-token-bearer';
    } else return { reason: call.callee.includes('createServerReference') ? 'Next.js server-action reference, not a stable REST endpoint' : 'Dynamic or generic transport; no concrete business route inferred' };
    if (!knownMethods.has(method)) return { reason: 'HTTP method is dynamic or not recoverable', method: method || null };
    const urls = evalRoute(urlNode, ctx);
    const additionalQuery = property(optionsNode, 'params', ctx);
    let queryVariants = [''];
    if (additionalQuery) {
      const obj = objectNode(additionalQuery, ctx);
      if (obj && obj.properties.every(p => p.type === 'Property' && !p.computed)) {
        queryVariants = [''];
        for (const [i, p] of obj.properties.entries()) queryVariants = combine(queryVariants, combine([`${i ? '&' : ''}${encodeURIComponent(p.key.name ?? p.key.value)}=`], p.value.type === 'Literal' ? [encodeURIComponent(String(p.value.value))] : placeholder(p.value, ctx, 'URLSearchParams', 'query-value')));
      } else queryVariants = placeholder(additionalQuery, ctx, 'query-fragment', 'query-fragment');
    }
    const body = resolveBody(bodyNode, ctx, bodyOverride);
    const records = [];
    for (let raw of urls) {
      if (!raw.startsWith('http')) {
        if (!base) return { reason: 'Relative or dynamic URL with no proven service base', method, urlExpression: text(urlNode) };
        if (raw.startsWith('@@P')) return { reason: 'Whole URL is dynamic; a wildcard service endpoint would be invented', method, urlExpression: text(urlNode) };
        raw = base + (raw.startsWith('/') ? raw : '/' + raw);
      }
      const match = raw.match(/^(https?:\/\/[^/?#]+)([^#]*)(?:#.*)?$/);
      if (!match) return { reason: 'Unable to resolve a static service origin', method, urlExpression: text(urlNode) };
      const origin = match[1].replace(/:443$/, '');
      let service = origins.get(origin);
      if (!service) return { reason: 'External or unrecognized origin; never attach integration credentials', method, resolvedUrl: raw, external: true };
      for (const extraQuery of queryVariants) {
        let fullPath = match[2] || '/';
        if (extraQuery) fullPath += (fullPath.includes('?') ? '&' : '?') + extraQuery;
        const qIndex = fullPath.indexOf('?');
        let pathname = qIndex < 0 ? fullPath : fullPath.slice(0, qIndex), query = qIndex < 0 ? null : fullPath.slice(qIndex + 1);
        const parameters = [], replace = (s, location) => {
          if (s == null) return null;
          let count = 0;
          return s.replace(/@@P(\d+)@@/g, (whole, index, offset) => {
            const info = ctx.tokens[Number(index)]; const name = (location === 'path' ? 'p' : 'q') + ++count;
            const previous = s.slice(0, offset); const last = previous.split('&').at(-1);
            const queryKey = location === 'query' && last.includes('=') ? last.slice(0, last.indexOf('=')) : null;
            parameters.push({ name, location, ...(queryKey ? { queryKey } : {}), sourceExpression: info?.sourceExpression, encoding: info?.encoding || 'raw', kind: info?.kind || 'value', callerParameters: namedFunctionParameters(call.functionStart) });
            return `{${name}}`;
          });
        };
        pathname = replace(pathname, 'path'); query = replace(query, 'query');
        let sdkService = service, sdkBasePath = serviceMap.get(service)?.sdkBasePath || '';
        if (service === 'platform' && pathname.startsWith('/lyaptf/flux')) { sdkService = 'platformFlux'; sdkBasePath = '/lyaptf/flux'; }
        if (service === 'platform' && pathname.startsWith('/lyaptf/file')) { sdkService = 'platformFile'; sdkBasePath = '/lyaptf/file'; }
        const sdkPathTemplate = sdkBasePath && (pathname === sdkBasePath || pathname.startsWith(sdkBasePath + '/')) ? pathname.slice(sdkBasePath.length) || '/' : pathname;
        const sdkBasePathMatched = !sdkBasePath || pathname === sdkBasePath || pathname.startsWith(sdkBasePath + '/');
        const mutationWords = /(?:^|\/)(?:souscrire|souscription|choisir|transmettre|envoyer|send|signer|generer[^/]*|generate[^/]*|creer|create|supprimer|delete|modifier|update|enregistrer|save|resync|init|initier|relancer|abandonner|activer|desactiver|archiver|marquer|mettreEnGestion|mdpOublie)(?:\/|$)/i;
        const readWords = /(?:^|\/)(?:lire|lister|rechercher|compter|count|search|find|proof|download|url)(?:\/|$)/i;
        const effect = mutationWords.test(pathname) ? 'mutation' : readWords.test(pathname) ? 'read' : 'unknown';
        const hasQueryFragment = parameters.some(p => p.kind === 'query-fragment' || p.encoding === 'query-fragment' || p.location === 'query' && !p.queryKey);
        const evidence = { sourceId: entry.id, sourceSha256: entry.sha256, offsetUtf16: call.start, endOffsetUtf16: call.end, callee: call.callee, function: namedFunction(call.functionStart), functionParameters: namedFunctionParameters(call.functionStart), functionParameterScopes: scopes(call.functionStart).filter(s => s != null).map(s => ({ function: fnMap.get(s)?.name, parameters: fnMap.get(s)?.params || [] })).slice(0, 4), pathExpression: text(urlNode), bodyExpression: text(bodyNode), optionsExpression: text(optionsNode), headersExpression, sourcePathVariants: urls.length, conditions: ctx.conditions };
        records.push({ service, sdkService, sdkBasePath, sdkBasePathMatched, method, pathTemplate: pathname, sdkPathTemplate, queryTemplate: query, parameters, body, responseMode, responseModes: [responseMode], effect, effectConfidence: 'name-based inference; no live side-effect verification', frontendAuth, observedFunctions: evidence.function ? [evidence.function] : [], confidence: call.args[0]?.type === 'Literal' ? 'source-observed' : 'source-resolved', executable: sdkBasePathMatched && !hasQueryFragment && !['unknown', 'custom-auto-assignment', 'ndjson', 'byte-stream', 'sse'].includes(responseMode), streamExecutable: sdkBasePathMatched && !hasQueryFragment && ['ndjson', 'byte-stream'].includes(responseMode), executionLimitations: [...(!sdkBasePathMatched ? ['Path lies outside configured SDK service base; configure a separate service root before execution'] : []), ...(hasQueryFragment ? ['Query contains a dynamic fragment; explicit query construction required'] : []), ...(['unknown', 'custom-auto-assignment'].includes(responseMode) ? ['Response handling requires an explicit decoder/mode'] : []), ...(['ndjson', 'byte-stream', 'sse'].includes(responseMode) ? ['Streaming transport required'] : [])], evidence: [evidence] });
      }
    }
    return { records };
  }
  let normalized = 0, rejected = 0, excluded = 0;
  for (const call of callsFile.calls) {
    candidateCallsites++;
    let result;
    try { result = normalize(call); }
    catch (error) { result = { reason: `Static resolver stopped conservatively: ${error.message}` }; }
    if (result.excluded) { excluded++; exclusions.push({ sourceId: entry.id, offsetUtf16: call.start, callee: call.callee, reason: result.excluded }); continue; }
    if (!result.records?.length) {
      rejected++;
      unresolved.push({ sourceId: entry.id, sourceSha256: entry.sha256, offsetUtf16: call.start, callee: call.callee, function: namedFunction(call.functionStart), argumentExpressions: call.args.map(a => a.source), ...result });
      continue;
    }
    normalized++; normalizedCallsites++;
    for (const record of result.records) {
      const key = `${record.service}|${record.method}|${record.pathTemplate}|${record.queryTemplate || ''}`;
      const old = operationMap.get(key);
      if (!old) {
        const label = record.pathTemplate.replace(/\{[^}]+\}/g, 'param').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 100);
        record.operationId = `${record.service}_${record.method.toLowerCase()}_${label}_${hash(key).slice(0, 8)}`;
        operationMap.set(key, record);
      } else {
        old.evidence.push(...record.evidence);
        old.observedFunctions = [...new Set([...old.observedFunctions, ...record.observedFunctions])];
        old.responseModes = [...new Set([...old.responseModes, record.responseMode])];
        if (old.responseModes.length > 1) { old.responseMode = 'multiple'; old.executable = false; old.streamExecutable = false; if (!old.executionLimitations.includes('Multiple observed response modes; select a mode explicitly')) old.executionLimitations.push('Multiple observed response modes; select a mode explicitly'); }
        const bodyVariants = [...(old.body.variants || [{ ...old.body }]), record.body];
        const uniqueBodies = [...new Map(bodyVariants.map(b => [JSON.stringify([b.encoding, b.expression, b.observedFields]), b])).values()];
        if (uniqueBodies.length > 1) old.body = { ...uniqueBodies[0], encoding: new Set(uniqueBodies.map(b => b.encoding)).size === 1 ? uniqueBodies[0].encoding : 'multiple', variants: uniqueBodies };
        old.parameterBindings = [...(old.parameterBindings || [{ sourceId: old.evidence[0].sourceId, offsetUtf16: old.evidence[0].offsetUtf16, parameters: old.parameters }]), { sourceId: entry.id, offsetUtf16: record.evidence[0].offsetUtf16, parameters: record.parameters }];
        old.executable = old.executable && record.executable;
        old.streamExecutable = old.streamExecutable && record.streamExecutable;
      }
    }
  }
  perSource.push({ sourceId: entry.id, candidateCallsites: callsFile.calls.length, normalizedCallsites: normalized, unresolvedCallsites: rejected, genericTransportImplementationsExcluded: excluded });
}

for (const entry of manifest.sources.filter(s => s.analyze && s.kind === 'javascript')) processSource(entry);

function addPostman(entry) {
  const collection = JSON.parse(fs.readFileSync(path.join(sourceDir, entry.cachePath), 'utf8'));
  const requests = [];
  function walk(items, prefix = '/item') {
    for (const [index, item] of (items || []).entries()) {
      const pointer = `${prefix}/${index}`;
      if (item.request) requests.push({ item, pointer });
      if (item.item) walk(item.item, `${pointer}/item`);
    }
  }
  walk(collection.item);
  let normalized = 0, rejected = 0;
  for (const { item, pointer } of requests) {
    candidateCallsites++;
    const request = item.request;
    const raw = typeof request.url === 'string' ? request.url : request.url.raw;
    let service, pathname, suppliedOrigin = null, normalizationNotes = [];
    if (raw.startsWith('{{ptfUrl}}')) {
      service = 'platform'; pathname = '/lyaptf/' + raw.slice('{{ptfUrl}}'.length).replace(/^\//, '');
      normalizationNotes.push('Collection ptfUrl is unset; root /lyaptf is supported by the explicit PPR URL in another collection request and the matching frontend route family. A leading duplicate slash in one sample is normalized to that observed route.');
    } else if (raw.startsWith('{{msgUrl}}')) {
      service = 'messaging'; pathname = '/lyamsg/' + raw.slice('{{msgUrl}}'.length).replace(/^\//, '');
      normalizationNotes.push('Collection msgUrl is absent; service-root mapping is corroborated by the identical /api/taches/enregistrer route in the frontend messaging client.');
    } else if (/^https:\/\/ppr-ptf-api\.app\.dismoilya\.fr(?::443)?\//.test(raw)) {
      const url = new URL(raw); suppliedOrigin = url.origin; service = 'platform'; pathname = url.pathname;
    }
    if (!service) { rejected++; unresolved.push({ sourceId: entry.id, sourceSha256: entry.sha256, jsonPointer: `${pointer}/request`, callee: 'Postman request', reason: 'Collection base URL is unresolved', argumentExpressions: [raw] }); continue; }
    const parameters = [];
    if (pathname.includes('[NUMERO]')) { pathname = pathname.replace('[NUMERO]', '{p1}'); parameters.push({ name: 'p1', location: 'path', sourceExpression: '[NUMERO]', encoding: 'raw', kind: 'value', callerParameters: [] }); }
    if (/\/api\/v1\/parcours\/projet\/[^/]+$/.test(pathname)) { pathname = pathname.replace(/(\/api\/v1\/parcours\/projet\/)[^/]+$/, '$1{p1}'); parameters.push({ name: 'p1', location: 'path', sourceExpression: 'project identifier in supplied example (value omitted)', encoding: 'raw', kind: 'value', callerParameters: [] }); }
    let parsedBody = null;
    if (request.body?.mode === 'raw') try { parsedBody = JSON.parse(request.body.raw); } catch {}
    const observedFields = parsedBody && typeof parsedBody === 'object' && !Array.isArray(parsedBody) ? Object.keys(parsedBody).map(name => ({ name, observedType: parsedBody[name] === null ? 'null' : Array.isArray(parsedBody[name]) ? 'array' : typeof parsedBody[name], requiredByServer: 'unknown' })) : [];
    const body = { encoding: request.body?.mode === 'raw' ? 'json' : request.body?.mode || 'none', expression: request.body ? 'Supplied request example; field values omitted' : null, observedFields, serverSchemaKnown: false };
    const responseExamples = [];
    for (const response of item.response || []) try {
      const example = JSON.parse(response.body);
      responseExamples.push({ status: response.code, topLevelFields: Object.keys(example), bodyFields: example.body && typeof example.body === 'object' ? Object.keys(example.body).slice(0, 200) : [], sampleValuesOmitted: true });
    } catch {}
    const responseMode = responseExamples.some(r => r.topLevelFields.includes('success') && r.topLevelFields.includes('body')) ? 'envelope-body' : 'unknown';
    const sdkBasePath = serviceMap.get(service).sdkBasePath;
    const record = { service, sdkService: service, sdkBasePath, sdkBasePathMatched: pathname.startsWith(sdkBasePath + '/'), method: request.method, pathTemplate: pathname, sdkPathTemplate: pathname.slice(sdkBasePath.length), queryTemplate: null, parameters, body, responseMode, responseModes: [responseMode], effect: /\/parcours\/(devis|tarif)$/.test(pathname) ? pathname.endsWith('/tarif') ? 'read' : 'mutation' : /\/(lire|lister|rechercher)(\/|$)/.test(pathname) ? 'read' : 'unknown', effectConfidence: 'Name and example purpose; no live side-effect verification', frontendAuth: 'collection-bearer-token-variable', observedFunctions: [item.name], confidence: 'supplied-collection', executable: responseMode !== 'unknown', executionLimitations: responseMode === 'unknown' ? ['No supplied response example; explicit response decoder/mode required'] : [], responseExamples, evidence: [{ sourceId: entry.id, sourceSha256: entry.sha256, jsonPointer: `${pointer}/request`, callee: 'Postman request', function: item.name, pathExpression: raw.replace(/(api\/v1\/parcours\/projet\/)[^/?]+/, '$1<example-project-id-omitted>'), bodyExpression: request.body ? 'Supplied request example; field values omitted' : null, suppliedOrigin, normalizationNotes }] };
    const key = `${record.service}|${record.method}|${record.pathTemplate}|`;
    const existing = operationMap.get(key);
    if (existing) {
      existing.evidence.push(...record.evidence); existing.observedFunctions = [...new Set([...existing.observedFunctions, item.name])];
      existing.responseExamples = [...(existing.responseExamples || []), ...responseExamples];
      existing.suppliedBodyExamples = [...(existing.suppliedBodyExamples || []), { jsonPointer: `${pointer}/request/body`, fields: observedFields }];
    } else {
      record.operationId = `${record.service}_${record.method.toLowerCase()}_${record.pathTemplate.replace(/\{[^}]+\}/g, 'param').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 100)}_${hash(key).slice(0, 8)}`;
      operationMap.set(key, record);
    }
    normalized++; normalizedCallsites++;
  }
  const authEvent = collection.event?.find(e => e.script?.exec?.join('\n').includes('pm.sendRequest'));
  if (authEvent) {
    candidateCallsites++; rejected++;
    unresolved.push({ sourceId: entry.id, sourceSha256: entry.sha256, jsonPointer: '/event', callee: 'pm.sendRequest', function: 'collection pre-request token exchange', method: 'POST', reason: 'identityUrl variable is unset in the supplied collection; no authentication URL is invented', argumentExpressions: ["pm.variables.get('identityUrl')"], requestBody: { encoding: 'json', observedFields: ['clientId', 'clientSecret'], valuesOmitted: true }, responseSelection: 'body.token' });
  }
  perSource.push({ sourceId: entry.id, candidateCallsites: requests.length + (authEvent ? 1 : 0), normalizedCallsites: normalized, unresolvedCallsites: rejected, genericTransportImplementationsExcluded: 0 });
}
for (const entry of manifest.sources.filter(s => s.analyze && s.kind === 'postman')) addPostman(entry);

const operations = [...operationMap.values()].sort((a, b) => `${a.service}|${a.pathTemplate}|${a.method}|${a.queryTemplate || ''}`.localeCompare(`${b.service}|${b.pathTemplate}|${b.method}|${b.queryTemplate || ''}`));
const coverage = { candidateCallsites, normalizedCallsites, normalizedOperations: operations.length, distinctMethodPathsIgnoringQueryVariants: new Set(operations.map(o => `${o.service}|${o.method}|${o.pathTemplate}`)).size, unresolvedCallsites: unresolved.length, genericTransportImplementationsExcluded: exclusions.length, bySource: perSource, byService: Object.fromEntries(services.map(s => [s.id, operations.filter(o => o.service === s.id).length])) };
const limitations = ['These are observed frontend request interfaces, not an authoritative backend schema or permission guarantee.', 'Source was parsed statically; no discovered business API, authentication, signature, payment, message-send, or subscription operation was invoked.', 'Parameter names p1/q1 are positional; exact minified source expressions and function parameters are retained as evidence.', 'Body fields are observations, not server-requiredness assertions.', 'Read/mutation labels are name-based inferences; GET is never assumed safe solely from its method.', 'Conditional URL expressions are retained as finite source-observed variants. Opaque URL fragments and unknown origins remain unresolved.', 'Configured PRO frontend origins do not imply compatibility with the supplied PPR integration credentials.'];
fs.mkdirSync(specDir, { recursive: true });
fs.writeFileSync(path.join(specDir, 'observed-endpoints.json'), JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), generator: 'scripts/extract-observed-api.cjs', sourceManifest: 'source-manifest.json', offsetConvention: 'zero-based JavaScript UTF-16 string offsets', services, coverage, limitations, operations }, null, 2));
fs.writeFileSync(path.join(specDir, 'unresolved-calls.json'), JSON.stringify({ schemaVersion: 1, generatedAt: new Date().toISOString(), sourceManifest: 'source-manifest.json', count: unresolved.length, limitations: ['No endpoints are invented for these calls. Many are generic transports, third-party library fetches, returned download URLs, or unsupported dynamic constructions.'], calls: unresolved, exclusions }, null, 2));
console.log(JSON.stringify(coverage, null, 2));
