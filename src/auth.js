import crypto from 'node:crypto';

const JWT_SECRET = process.env.JWT_SECRET ?? 'MyCash-dev-secret';

function base64UrlEncode(value) {
  return Buffer.from(value).toString('base64url');
}

function base64UrlDecode(value) {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, 'sha256').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedPassword) {
  if (!storedPassword || typeof storedPassword !== 'string') return false;
  const [salt, storedHash] = storedPassword.split(':');
  if (!salt || !storedHash) return false;
  const hash = crypto.pbkdf2Sync(String(password), salt, 100000, 64, 'sha256').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(storedHash));
}

export function createToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const tokenPayload = { ...payload, iat: Math.floor(Date.now() / 1000) };
  const headerSegment = base64UrlEncode(JSON.stringify(header));
  const payloadSegment = base64UrlEncode(JSON.stringify(tokenPayload));
  const signingInput = `${headerSegment}.${payloadSegment}`;
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest('base64url');
  return `${signingInput}.${signature}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [headerSegment, payloadSegment, signature] = token.split('.');
  if (!headerSegment || !payloadSegment || !signature) return null;

  const signingInput = `${headerSegment}.${payloadSegment}`;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(signingInput).digest('base64url');

  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(payloadSegment));
    return payload;
  } catch {
    return null;
  }
}

export function authenticateRequest(request, response, next) {
  const authorization = request.headers.authorization ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;
  const payload = verifyToken(token);

  if (!payload?.id || !payload?.email) {
    return response.status(401).json({ message: 'Authentication required' });
  }

  request.user = payload;
  return next();
}
