import { createHmac } from 'node:crypto';

/*
 * RFC 6238 TOTP, 6-digit, 30-second step, SHA-1. Used only by the sweep to compute
 * the staff two-factor code from the fixed secret the BrowserSweepSeeder stores.
 */

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(input) {
    const clean = input.replace(/=+$/, '').toUpperCase().replace(/\s+/g, '');
    let bits = '';
    for (const char of clean) {
        const index = BASE32.indexOf(char);
        if (index < 0) throw new Error(`invalid base32 character: ${char}`);
        bits += index.toString(2).padStart(5, '0');
    }
    const bytes = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        bytes.push(parseInt(bits.slice(i, i + 8), 2));
    }
    return Buffer.from(bytes);
}

/** Compute the current 6-digit TOTP for `secret` at `whenMs` (default now). */
export function totp(secret, whenMs = Date.now()) {
    const key = base32Decode(secret);
    const counter = Math.floor(whenMs / 1000 / 30);
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter));
    const hmac = createHmac('sha1', key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code = ((hmac[offset] & 0x7f) << 24)
        | ((hmac[offset + 1] & 0xff) << 16)
        | ((hmac[offset + 2] & 0xff) << 8)
        | (hmac[offset + 3] & 0xff);
    return (code % 1_000_000).toString().padStart(6, '0');
}
