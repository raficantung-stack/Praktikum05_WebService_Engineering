const fs = require('node:fs');
const path = require('node:path');

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const fields = {
  judul: {
    type: 'string',
    minLength: 1,
    maxLength: 120,
    description: 'Judul dipangkas dengan trim; panjang 1-120 unit string UTF-16.'
  },
  tersedia: { type: 'boolean', description: 'Status ketersediaan pada katalog.' }
};
const book = { id: 1, judul: 'Dasar Pemrograman Kotlin', tersedia: true };
const input = { judul: 'Belajar API dengan Express', tersedia: true };

function jsonResponse(description, schema, example) {
  return {
    description,
    content: {
      'application/json': {
        schema: ref(schema),
        ...(example ? { example } : {})
      }
    }
  };
}

const errorExamples = {
  400: {
    code: 'INVALID_BOOK',
    message: 'Isi hanya judul 1-120 karakter dan tersedia boolean.'
  },
  404: { code: 'BOOK_NOT_FOUND', message: 'Buku tidak ditemukan.' },
  413: { code: 'PAYLOAD_TOO_LARGE', message: 'Body melebihi batas 10kb.' },
  415: { code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Gunakan Content-Type application/json.' },
  500: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan pada server.' }
};

const errorDescriptions = {
  400: 'Input tidak valid, ID/query salah, atau body JSON tidak dapat diterima.',
  404: 'Buku atau route yang diminta tidak ditemukan.',
  413: 'Body melebihi batas parser 10kb.',
  415: 'Gunakan media type application/json untuk POST dan PUT.',
  500: 'Kegagalan internal server.'
};

function errorResponse(status) {
  return jsonResponse(
    errorDescriptions[status],
    'ErrorResponse',
    { success: false, error: errorExamples[status] }
  );
}

function responses(success, codes) {
  const result = { ...success };
  for (const code of codes) result[code] = errorResponse(code);
  return result;
}

const body = {
  required: true,
  description: 'Objek JSON wajib berisi judul dan tersedia; field tambahan ditolak.',
  content: {
    'application/json': { schema: ref('BukuInput'), example: input }
  }
};

const id = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Digit positif tanpa nol di depan; nilai maksimal 9007199254740991.',
  schema: { type: 'string', pattern: '^[1-9][0-9]*$' },
  example: '1'
};

const created = jsonResponse('Buku berhasil dibuat. Header Location berisi URI resource baru.', 'BukuResponse', {
  success: true,
  data: { id: 3, ...input }
});
created.headers = {
  Location: {
    description: 'URI buku baru, misalnya /api/buku/3.',
    schema: { type: 'string' },
    example: '/api/buku/3'
  }
};

const spec = {
  openapi: '3.1.0',
  info: {
    title: 'API Katalog Perpustakaan',
    version: '1.0.0',
    description: [
      'Layanan katalog buku untuk latihan Web Service Engineering.',
      'Consumer dapat membaca daftar, mencari judul, melihat detail, menambah, mengganti, dan menghapus buku.',
      'POST dan PUT wajib memuat judul serta tersedia tanpa field tambahan.',
      'Data disimpan dalam array di memori proses; data tambahan hilang saat server restart.',
      'Layanan lokal ini tidak menyediakan login, otorisasi, atau transaksi peminjaman.',
      'Kode error yang digunakan antara lain INVALID_ID, INVALID_QUERY, INVALID_BOOK, INVALID_JSON,',
      'BOOK_NOT_FOUND, PAYLOAD_TOO_LARGE, UNSUPPORTED_MEDIA_TYPE, ROUTE_NOT_FOUND, BAD_REQUEST, INTERNAL_ERROR.'
    ].join(' ')
  },
  servers: [{ url: 'http://127.0.0.1:3200', description: 'Server lokal praktikum' }],
  tags: [{ name: 'Buku', description: 'Operasi resource katalog buku.' }],
  paths: {
    '/api/buku': {
      get: {
        tags: ['Buku'],
        summary: 'Membaca atau mencari daftar buku',
        description: 'Tanpa q, seluruh buku ditampilkan. Pencarian tidak peka huruf besar/kecil; hasil kosong tetap 200.',
        parameters: [{
          name: 'q',
          in: 'query',
          description: 'Satu teks pencarian maksimal 80 unit UTF-16; q kosong menampilkan semua data.',
          schema: { type: 'string', maxLength: 80 },
          example: 'kotlin'
        }],
        responses: responses({
          200: jsonResponse('Daftar buku; data dapat berupa array kosong.', 'DaftarResponse', {
            success: true,
            data: [book]
          })
        }, [400, 500])
      },
      post: {
        tags: ['Buku'],
        summary: 'Menambahkan buku',
        description: 'ID dibuat otomatis oleh server. Respons 201 menyertakan header Location.',
        requestBody: body,
        responses: responses({ 201: created }, [400, 413, 415, 500])
      }
    },
    '/api/buku/{id}': {
      parameters: [id],
      get: {
        tags: ['Buku'],
        summary: 'Membaca satu buku',
        description: 'ID harus berupa bilangan bulat positif tanpa nol di depan.',
        responses: responses({
          200: jsonResponse('Buku ditemukan.', 'BukuResponse', { success: true, data: book })
        }, [400, 404, 500])
      },
      put: {
        tags: ['Buku'],
        summary: 'Mengganti seluruh field buku',
        description: 'Target harus sudah ada. Body wajib berisi judul dan tersedia; PUT parsial ditolak.',
        requestBody: body,
        responses: responses({
          200: jsonResponse('Buku berhasil diperbarui.', 'BukuResponse', {
            success: true,
            data: { id: 1, judul: 'Belajar API HTTP', tersedia: false }
          })
        }, [400, 404, 413, 415, 500])
      },
      delete: {
        tags: ['Buku'],
        summary: 'Menghapus buku',
        description: 'Respons 204 tidak mempunyai body.',
        responses: responses({ 204: { description: 'Berhasil dihapus tanpa body respons.' } }, [400, 404, 500])
      }
    }
  },
  components: {
    schemas: {
      BukuInput: {
        type: 'object',
        additionalProperties: false,
        required: ['judul', 'tersedia'],
        properties: fields
      },
      Buku: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'judul', 'tersedia'],
        properties: {
          id: { type: 'integer', minimum: 1, maximum: 9007199254740991 },
          ...fields
        }
      },
      BukuResponse: {
        type: 'object',
        required: ['success', 'data'],
        properties: { success: { const: true }, data: ref('Buku') }
      },
      DaftarResponse: {
        type: 'object',
        required: ['success', 'data'],
        properties: { success: { const: true }, data: { type: 'array', items: ref('Buku') } }
      },
      ErrorResponse: {
        type: 'object',
        required: ['success', 'error'],
        properties: {
          success: { const: false },
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: { code: { type: 'string' }, message: { type: 'string' } }
          }
        }
      }
    }
  }
};

const target = path.join(__dirname, '..', 'docs', 'openapi.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(target, `${JSON.stringify(spec, null, 2)}\n`);
console.log('Dokumen dibuat: docs/openapi.json');
