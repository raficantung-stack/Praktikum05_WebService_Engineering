const fs = require('node:fs');
const path = require('node:path');

const BASE = 'http://127.0.0.1:3200';
const ROOT = path.join(__dirname, '..');
const results = [];
let createdId = null;
let taskId1 = null;
let taskId2 = null;

async function send(method, resource, body, contentType = 'application/json') {
  const options = { method, headers: { Accept: 'application/json' } };
  if (body !== undefined) {
    options.headers['Content-Type'] = contentType;
    options.body = body;
  }
  const response = await fetch(BASE + resource, options);
  const text = await response.text();
  let json;
  try { json = text ? JSON.parse(text) : undefined; } catch { json = undefined; }
  return { response, text, json };
}

function record(name, pass, detail) {
  results.push({ name, status: pass ? 'LULUS' : 'GAGAL', detail });
  console.log(`${pass ? '[LULUS]' : '[GAGAL]'} ${name}: ${detail}`);
}

function file(name) {
  return fs.readFileSync(path.join(ROOT, 'samples', name), 'utf8');
}

async function expect(name, method, resource, expectedStatus, body, check, contentType = 'application/json') {
  try {
    const result = await send(method, resource, body, contentType);
    const statusOk = result.response.status === expectedStatus;
    const extraOk = check ? check(result) : true;
    record(name, statusOk && extraOk, `HTTP ${result.response.status}; ${result.text || '(body kosong)'}`);
    return result;
  } catch (error) {
    record(name, false, error.message);
    return null;
  }
}

async function main() {
  console.log('Node:', process.version);
  console.log('Target:', BASE);
  const nodeMajor = Number(process.versions.node.split('.')[0]);
  const packageJson = require('../package.json');
  record('01 Versi runtime dan paket', nodeMajor >= 24
    && packageJson.dependencies.express === '5.3.0'
    && packageJson.dependencies['swagger-ui-express'] === '5.0.1',
  `Node ${process.version}; Express ${packageJson.dependencies.express}; swagger-ui-express ${packageJson.dependencies['swagger-ui-express']} (modul merekomendasikan Node 24.x)`);

  await expect('02 GET daftar awal', 'GET', '/api/buku', 200,
    undefined, (r) => Array.isArray(r.json?.data) && r.json.data.length >= 2);
  await expect('03 GET detail ID 2', 'GET', '/api/buku/2', 200,
    undefined, (r) => r.json?.data?.tersedia === false);
  await expect('04 Pencarian kotlin', 'GET', '/api/buku?q=kotlin', 200,
    undefined, (r) => r.json?.data?.some((b) => b.id === 1));
  await expect('05 Pencarian tidakada', 'GET', '/api/buku?q=tidakada', 200,
    undefined, (r) => Array.isArray(r.json?.data) && r.json.data.length === 0);

  const p = await expect('06 POST valid', 'POST', '/api/buku', 201, file('buku-baru.json'),
    (r) => Boolean(r.response.headers.get('location')) && Boolean(r.json?.data?.id));
  createdId = p?.json?.data?.id;
  if (createdId) {
    await expect('07 GET lokasi hasil POST', 'GET', `/api/buku/${createdId}`, 200,
      undefined, (r) => r.json?.data?.judul === 'Belajar API dengan Express');
    await expect('08 PUT lengkap', 'PUT', `/api/buku/${createdId}`, 200, file('buku-ubah.json'),
      (r) => r.json?.data?.judul === 'Belajar API HTTP' && r.json?.data?.tersedia === false);
    await expect('09 DELETE data baru', 'DELETE', `/api/buku/${createdId}`, 204,
      undefined, (r) => r.text === '');
    await expect('10 GET sesudah DELETE', 'GET', `/api/buku/${createdId}`, 404,
      undefined, (r) => r.json?.error?.code === 'BOOK_NOT_FOUND');
  } else {
    ['07 GET lokasi hasil POST','08 PUT lengkap','09 DELETE data baru','10 GET sesudah DELETE'].forEach((n) => record(n, false, 'Dilewati karena POST tidak berhasil.'));
  }

  const badId = await expect('11 ID 1abc', 'GET', '/api/buku/1abc', 400,
    undefined, (r) => r.json?.error?.code === 'INVALID_ID');
  await expect('12 ID 999', 'GET', '/api/buku/999', 404,
    undefined, (r) => r.json?.error?.code === 'BOOK_NOT_FOUND');
  await expect('13 tersedia berupa string', 'POST', '/api/buku', 400, file('buku-salah-tipe.json'),
    (r) => r.json?.error?.code === 'INVALID_BOOK');
  const before = await send('GET', '/api/buku/1');
  await expect('14 PUT parsial', 'PUT', '/api/buku/1', 400, file('buku-parsial.json'),
    (r) => r.json?.error?.code === 'INVALID_BOOK');
  const after = await send('GET', '/api/buku/1');
  record('14b Data target tidak berubah', before.json?.data?.judul === after.json?.data?.judul,
    `Sebelum: ${before.json?.data?.judul}; sesudah: ${after.json?.data?.judul}`);
  await expect('15 JSON sengaja rusak', 'POST', '/api/buku', 400, file('json-rusak.txt'),
    (r) => r.json?.error?.code === 'INVALID_JSON');
  await expect('16 Media type text/plain', 'POST', '/api/buku', 415, file('buku-baru.json'),
    (r) => r.json?.error?.code === 'UNSUPPORTED_MEDIA_TYPE', 'text/plain');
  await expect('17 q dikirim dua kali', 'GET', '/api/buku?q=a&q=b', 400,
    undefined, (r) => r.json?.error?.code === 'INVALID_QUERY');
  await expect('18 Path tidak dikenal', 'GET', '/api/tidak-ada', 404,
    undefined, (r) => r.json?.error?.code === 'ROUTE_NOT_FOUND');

  const openapi = await expect('19 GET /openapi.json', 'GET', '/openapi.json', 200,
    undefined, (r) => r.json?.openapi === '3.1.0' && Object.keys(r.json.paths || {}).length === 2);
  const docs = await expect('20 Halaman /docs/', 'GET', '/docs/', 200,
    undefined, (r) => r.text.toLowerCase().includes('swagger'));

  const one = await send('POST', '/api/buku', file('buku-mandiri-1.json'));
  const two = await send('POST', '/api/buku', file('buku-mandiri-2.json'));
  taskId1 = one.json?.data?.id;
  taskId2 = two.json?.data?.id;
  record('21 Tugas mandiri dua POST + CRUD API', one.response.status === 201 && two.response.status === 201,
    `Buku 1 HTTP ${one.response.status}, ID ${taskId1}; Buku 2 HTTP ${two.response.status}, ID ${taskId2}`);
  if (taskId1 && taskId2) {
    const read1 = await send('GET', `/api/buku/${taskId1}`);
    const read2 = await send('GET', `/api/buku/${taskId2}`);
    const update1 = await send('PUT', `/api/buku/${taskId1}`, file('buku-ubah.json'));
    const delete2 = await send('DELETE', `/api/buku/${taskId2}`);
    record('21b Baca dua buku', read1.response.status === 200 && read2.response.status === 200,
      `GET ID ${taskId1}: ${read1.response.status}; GET ID ${taskId2}: ${read2.response.status}`);
    record('21c Ubah satu buku', update1.response.status === 200 && update1.json?.data?.judul === 'Belajar API HTTP',
      `PUT ID ${taskId1}: HTTP ${update1.response.status}`);
    record('21d Hapus satu buku', delete2.response.status === 204,
      `DELETE ID ${taskId2}: HTTP ${delete2.response.status}`);
  } else {
    record('21b Baca dua buku', false, 'Dilewati karena POST tugas mandiri gagal.');
    record('21c Ubah satu buku', false, 'Dilewati karena POST tugas mandiri gagal.');
    record('21d Hapus satu buku', false, 'Dilewati karena POST tugas mandiri gagal.');
  }

  const output = path.join(__dirname, 'hasil-uji-http.json');
  fs.writeFileSync(output, `${JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2)}\n`);
  console.log(`\nRingkasan: ${results.filter((r) => r.status === 'LULUS').length}/${results.length} skenario lulus.`);
  console.log(`Rincian: ${output}`);
  console.log('22-24: uji server mati, restart, dan npm ci perlu dilakukan terpisah sesuai bagian README.');
  if (results.some((r) => r.status === 'GAGAL')) process.exitCode = 1;
}

main().catch((error) => {
  console.error('Test suite gagal:', error);
  process.exitCode = 1;
});
