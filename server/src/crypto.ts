// Hashing and token generation, built entirely on node:crypto.
//
// No bcrypt/argon2 dependency on purpose: those need a native build step, and
// the deploy pipeline ships prebuilt artifacts to a 1.9 GB box that should not
// be compiling anything. scrypt is in the standard library and is a memory-hard
// KDF, which is what the password case actually needs.
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { env } from './env.js';

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

/** Hash a password for storage. Returns a self-describing `scrypt$salt$hash`. */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEY_LENGTH);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
}

/**
 * Verify a password against a stored hash. Constant-time, and returns false
 * rather than throwing on a malformed stored value.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;

  let expected: Buffer;
  try {
    expected = Buffer.from(hashHex, 'hex');
  } catch {
    return false;
  }
  if (expected.length !== KEY_LENGTH) return false;

  const derived = await scrypt(password, Buffer.from(saltHex, 'hex'), KEY_LENGTH);
  return timingSafeEqual(derived, expected);
}

/**
 * A URL-safe random token. 32 bytes = 256 bits, which is why the API-key and
 * session lookups below can use a plain SHA-256 rather than a slow KDF: there
 * is no dictionary to attack.
 */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** SHA-256 hex digest — used to store API keys and session tokens at rest. */
export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** An ingest key, prefixed so it is recognisable in logs and config files. */
export function generateApiKey(): string {
  return `klx_${generateToken(32)}`;
}

// ── Reversible encryption, for metric-source bearer tokens ──────────────────
//
// Ingest keys are hashed because we only ever need to *check* them. These have
// to be replayed to another service on every poll, so they must be recoverable
// — which makes encrypting them at rest the difference between a database dump
// being embarrassing and it being a fleet-wide credential leak.

const ALGORITHM = 'aes-256-gcm';

function encryptionKey(): Buffer {
  return Buffer.from(env.TOKEN_ENCRYPTION_KEY, 'base64');
}

/** Encrypt a token. Returns `iv:tag:ciphertext`, all hex. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return [iv.toString('hex'), cipher.getAuthTag().toString('hex'), ciphertext.toString('hex')].join(
    ':',
  );
}

/**
 * Decrypt a token. Returns null rather than throwing on anything malformed or
 * tampered with, so one bad row cannot take down the whole polling loop.
 */
export function decryptSecret(stored: string): string | null {
  try {
    const [ivHex, tagHex, dataHex] = stored.split(':');
    if (!ivHex || !tagHex || !dataHex) return null;

    const decipher = createDecipheriv(ALGORITHM, encryptionKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    return Buffer.concat([
      decipher.update(Buffer.from(dataHex, 'hex')),
      decipher.final(),
    ]).toString('utf8');
  } catch {
    // Wrong key (rotated) or tampered ciphertext. Either way, unusable.
    return null;
  }
}
