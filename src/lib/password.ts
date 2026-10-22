import 'server-only';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function checkPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const hashBuffer = Buffer.from(hash, 'hex');
  const testBuffer = scryptSync(password, salt, 64);
  return timingSafeEqual(hashBuffer, testBuffer);
}

/** Rule for normal users: at least 6 characters and 1 uppercase letter. Returns an error message or null. */
export function passwordError(password: string): string | null {
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least 1 uppercase letter.';
  return null;
}

