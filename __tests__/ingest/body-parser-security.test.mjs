import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { once } from 'node:events';
import { gzipSync, deflateSync } from 'node:zlib';
import bodyParser from 'body-parser';

async function withParser(parser, run) {
  const server = http.createServer((req, res) => {
    parser(req, res, (err) => {
      res.statusCode = err?.status ?? 200;
      res.end(JSON.stringify(err ? { error: err.type } : req.body));
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try { await run(`http://127.0.0.1:${server.address().port}`); }
  finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
}

test('resolved Express JSON parser accepts normal and compressed bodies and rejects malformed JSON', async () => {
  await withParser(bodyParser.json(), async url => {
    for (const encoding of ['identity', 'gzip', 'deflate']) {
      const text = '{"input":100,"output":50}';
      const body = encoding === 'gzip' ? gzipSync(text) : encoding === 'deflate' ? deflateSync(text) : text;
      const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': encoding }, body });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { input: 100, output: 50 });
    }
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{broken' });
    assert.equal(response.status, 400);
  });
});

test('shared qs preserves nested URL-encoded parsing and blocks prototype pollution', async () => {
  await withParser(bodyParser.urlencoded({ extended: true }), async url => {
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'operator[name]=example&tags[]=a&tags[]=b&__proto__[polluted]=yes' });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { operator: { name: 'example' }, tags: ['a', 'b'] });
    assert.equal({}.polluted, undefined);
  });
});

test('compressed trailing bytes do not crash the parser or subsequent requests', async () => {
  await withParser(bodyParser.json(), async url => {
    const body = Buffer.concat([gzipSync('{"a":1}'), Buffer.from([0]), Buffer.alloc(100 * 1024, 0x58)]);
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Encoding': 'gzip' }, body });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { a: 1 });
    await new Promise(resolve => setTimeout(resolve, 200));
    const next = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"alive":true}' });
    assert.equal(next.status, 200);
    assert.deepEqual(await next.json(), { alive: true });
  });
});
