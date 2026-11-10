const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const args = process.argv.slice(2);
const option = (name, fallback) => { const i = args.indexOf(name); return i < 0 ? fallback : args[i + 1]; };
const directory = path.resolve(option('--spec-dir', path.join(__dirname, '../spec')));
const sourceDirectory = option('--source-dir', null);
const spec = JSON.parse(fs.readFileSync(path.join(directory, 'observed-endpoints.json'), 'utf8'));
const unresolved = JSON.parse(fs.readFileSync(path.join(directory, 'unresolved-calls.json'), 'utf8'));
const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'source-manifest.json'), 'utf8'));
const sources = new Map(manifest.sources.map(s => [s.id, s]));
const sourceText = new Map();
if (sourceDirectory) {
  for (const source of manifest.sources.filter(s => s.analyze)) {
    const bytes = fs.readFileSync(path.resolve(sourceDirectory, source.cachePath));
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), source.sha256, `Actual source bytes differ: ${source.id}`);
    sourceText.set(source.id, bytes.toString('utf8'));
  }
}
const ids = new Set(), keys = new Set();
for (const operation of spec.operations) {
  assert(!ids.has(operation.operationId), `Duplicate operationId ${operation.operationId}`); ids.add(operation.operationId);
  const key = `${operation.service}|${operation.method}|${operation.pathTemplate}|${operation.queryTemplate || ''}`;
  assert(!keys.has(key), `Duplicate canonical operation ${key}`); keys.add(key);
  assert(operation.pathTemplate.startsWith('/'), key);
  assert(!operation.pathTemplate.includes('@@P'), `Unresolved resolver marker: ${key}`);
  assert(operation.queryTemplate === null || typeof operation.queryTemplate === 'string', key);
  assert(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].includes(operation.method), key);
  const placeholders = [...(operation.pathTemplate + '?' + (operation.queryTemplate || '')).matchAll(/\{([pq]\d+)\}/g)].map(m => m[1]);
  assert.deepEqual([...placeholders].sort(), operation.parameters.map(p => p.name).sort(), `Parameter mapping mismatch: ${key}`);
  if (operation.sdkBasePathMatched) assert.equal(operation.sdkBasePath + (operation.sdkPathTemplate === '/' ? '' : operation.sdkPathTemplate), operation.pathTemplate, `SDK root mismatch: ${key}`);
  for (const evidence of operation.evidence) {
    assert(sources.has(evidence.sourceId), `Unknown source ${evidence.sourceId}`);
    assert.equal(evidence.sourceSha256, sources.get(evidence.sourceId).sha256, `Source hash mismatch: ${key}`);
    assert(Number.isInteger(evidence.offsetUtf16) || typeof evidence.jsonPointer === 'string', `Missing evidence location: ${key}`);
    if (sourceDirectory && Number.isInteger(evidence.offsetUtf16)) {
      const text = sourceText.get(evidence.sourceId);
      assert(text, `Source text is absent: ${evidence.sourceId}`);
      const call = text.slice(evidence.offsetUtf16, evidence.endOffsetUtf16);
      assert(call.startsWith(evidence.callee + '('), `Callee does not match actual source offset: ${key}`);
      assert(call.includes(evidence.pathExpression), `URL expression does not match actual source call: ${key}`);
    }
  }
}
for (const row of spec.coverage.bySource) assert.equal(row.candidateCallsites, row.normalizedCallsites + row.unresolvedCallsites + row.genericTransportImplementationsExcluded, `Coverage mismatch: ${row.sourceId}`);
assert.equal(spec.coverage.candidateCallsites, spec.coverage.normalizedCallsites + unresolved.calls.length + unresolved.exclusions.length);
assert.equal(spec.coverage.normalizedOperations, spec.operations.length);
assert(spec.operations.some(o => o.method === 'GET' && o.pathTemplate === '/lyaptf/api/courtage/contrat/lire/{p1}' && o.sdkPathTemplate === '/courtage/contrat/lire/{p1}'));
assert(spec.operations.some(o => o.method === 'POST' && o.pathTemplate === '/lyaptf/api/documents/generer' && o.responseMode === 'envelope-body'));
assert(spec.operations.some(o => o.method === 'GET' && o.pathTemplate.includes('/genererFicheParametragePaie/') && o.effect === 'mutation'));
assert(spec.operations.some(o => o.sdkService === 'platformFlux' && o.responseModes.includes('ndjson')));
assert(spec.operations.some(o => o.responseMode === 'byte-stream' && o.streamExecutable && !o.executable));
assert(spec.operations.some(o => o.service === 'mail' && o.pathTemplate === '/file/{p1}/{p2}/{p3}' && o.queryTemplate === 'messageId={q1}' && o.responseMode === 'blob'));
assert(spec.operations.some(o => o.service === 'forms' && o.pathTemplate === '/lyaform/auth/refresh' && o.sdkPathTemplate === '/auth/refresh'));
assert(spec.operations.some(o => o.pathTemplate === '/lyaptf/api/v1/parcours/tarif' && o.evidence.some(e => e.sourceId === 'supplied-postman')));
assert(unresolved.calls.some(c => c.function === 'collection pre-request token exchange' && c.reason.includes('unset')));
console.log(JSON.stringify({ valid: true, sourceBytesAndOffsetsVerified: Boolean(sourceDirectory), operations: spec.operations.length, normalizedCallsites: spec.coverage.normalizedCallsites, unresolved: unresolved.calls.length }));
