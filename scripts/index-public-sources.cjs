/* Static syntax extraction only. Never evaluates application JavaScript. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const project = path.resolve(__dirname, '..');
const manifestFile = path.resolve(option('--manifest', path.join(project, 'spec/source-manifest.json')));
const sourceDir = path.resolve(option('--source-dir', path.join(project, '.cache/sources')));
const indexDir = path.resolve(option('--index-dir', path.join(project, '.cache/ast-index')));
const acorn = require(option('--acorn-path', 'acorn'));
const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
fs.mkdirSync(indexDir, { recursive: true });
for (const entry of manifest.sources.filter(s => s.analyze === true && s.kind === 'javascript')) {
  const file = path.join(sourceDir, entry.cachePath);
  const bytes = fs.readFileSync(file);
  const sha256 = crypto.createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== entry.sha256) throw new Error(`Hash mismatch for ${entry.id}; explicitly update the provenance manifest before parsing a different release.`);
  const source = bytes.toString('utf8');
  const tree = acorn.parse(source, { ecmaVersion: 'latest', sourceType: 'module', allowHashBang: true });
  const declarations = [], functions = [], calls = [], assignments = [];
  const text = n => n ? source.slice(n.start, n.end) : null;
  const label = n => n?.type === 'Identifier' ? n.name : n?.type === 'Literal' ? String(n.value) : text(n);
  function walk(node, parent = null, fn = null, enclosingClass = null) {
    if (!node?.type) return;
    let active = fn, activeClass = enclosingClass;
    if (node.type === 'ClassDeclaration' || node.type === 'ClassExpression') activeClass = node.id?.name || null;
    if (['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(node.type)) {
      let name = node.id?.name;
      if (!name && parent?.type === 'VariableDeclarator') name = label(parent.id);
      if (!name && ['Property', 'MethodDefinition'].includes(parent?.type)) name = label(parent.key);
      if (!name && parent?.type === 'AssignmentExpression') name = label(parent.left);
      active = { name: name || `anonymous@${node.start}`, start: node.start, end: node.end, params: node.params.map(text), parentFunction: fn?.start ?? null, className: activeClass, async: !!node.async, generator: !!node.generator, type: node.type };
      functions.push(active);
    }
    if (node.type === 'VariableDeclarator') declarations.push({ name: label(node.id), declarationStart: node.start, declarationEnd: node.end, initializerStart: node.init?.start ?? null, initializerEnd: node.init?.end ?? null, initializerType: node.init?.type ?? null, topLevel: fn === null, scopeFunction: fn?.start ?? null });
    if (node.type === 'AssignmentExpression' && node.left.type === 'Identifier') assignments.push({ name: node.left.name, start: node.start, end: node.end, operator: node.operator, rightStart: node.right.start, rightEnd: node.right.end, scopeFunction: fn?.start ?? null });
    if (node.type === 'CallExpression') {
      const callee = label(node.callee);
      const helper = /^(myFetch|simpleApiFetch|simpleApiFetchWithCredential|fetchFlux|fetchFile|fetchStream|fetch|fetchEventSource|useLyaEventStream)$/.test(callee);
      const adhesion = entry.id === 'adhesion' && /^Ze\.(get|post|put|patch|delete|upload)$/.test(callee);
      const enterprise = entry.id === 'enterprise' && /^(?:this\.client\.(?:public|restricted)\(.*\)|v\(\))\.(get|post|put|patch|delete)$/.test(callee);
      const general = entry.id === 'generalForms' && callee === 'sx';
      const serverAction = entry.id.startsWith('customer-') && callee.includes('createServerReference');
      if (helper || adhesion || enterprise || general || serverAction) calls.push({ callee, start: node.start, end: node.end, args: node.arguments.map(a => ({ start: a.start, end: a.end, type: a.type, source: text(a) })), function: active?.name ?? null, functionStart: active?.start ?? null });
    }
    for (const [key, value] of Object.entries(node)) {
      if (['type', 'start', 'end'].includes(key)) continue;
      if (Array.isArray(value)) for (const child of value) { if (child?.type) walk(child, node, active, activeClass); }
      else if (value?.type) walk(value, node, active, activeClass);
    }
  }
  walk(tree);
  const metadata = { sourceId: entry.id, sourceSha256: sha256, offsetConvention: 'zero-based JavaScript UTF-16 string offsets', parser: `acorn ${acorn.version}` };
  fs.writeFileSync(path.join(indexDir, `${entry.id}-declarations.json`), JSON.stringify({ metadata, declarations, functions, assignments }));
  fs.writeFileSync(path.join(indexDir, `${entry.id}-calls.json`), JSON.stringify({ metadata, calls }));
  console.log(JSON.stringify({ sourceId: entry.id, calls: calls.length, declarations: declarations.length, functions: functions.length }));
}
