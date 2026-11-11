class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

function parseId(value) {
  const id = Number(value);
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(id)) {
    throw new HttpError(400, 'INVALID_ID', 'ID harus berupa bilangan bulat positif tanpa nol di depan.');
  }
  return id;
}

function validateBuku(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'INVALID_BOOK', 'Body harus berupa objek buku.');
  }

  const allowed = ['judul', 'tersedia'];
  const hasExtraField = Object.keys(body).some((key) => !allowed.includes(key));
  const validTitle = typeof body.judul === 'string'
    && body.judul.trim().length >= 1
    && body.judul.trim().length <= 120;
  const validAvailability = typeof body.tersedia === 'boolean';

  if (hasExtraField || !validTitle || !validAvailability) {
    throw new HttpError(
      400,
      'INVALID_BOOK',
      'Isi hanya judul 1-120 karakter dan tersedia boolean.'
    );
  }

  return {
    judul: body.judul.trim(),
    tersedia: body.tersedia
  };
}

module.exports = { HttpError, parseId, validateBuku };
