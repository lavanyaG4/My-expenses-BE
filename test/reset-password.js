import crypto from 'node:crypto';

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(String(password), salt, 100000, 64, 'sha256')
    .toString('hex');

  return `${salt}:${hash}`;
}

console.log(hashPassword('MytestUser'));