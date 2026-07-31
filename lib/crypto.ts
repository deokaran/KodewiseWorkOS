import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.AUTH_SECRET || "default_fallback_secret_key_32_chars";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encrypt(text: string | null | undefined): string | null | undefined {
  if (!text) return text;
  try {
    const iv = crypto.randomBytes(16);
    const key = getKey();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return text;
  }
}

export function decrypt(text: string | null | undefined): string | null | undefined {
  if (!text) return text;
  try {
    const parts = text.split(":");
    if (parts.length !== 2) {
      // If it doesn't match iv:ciphertext pattern, return as is (might be unencrypted)
      return text;
    }
    const [ivHex, encryptedText] = parts;
    if (ivHex.length !== 32) {
      return text; // IV must be 16 bytes (32 hex characters)
    }
    const iv = Buffer.from(ivHex, "hex");
    const key = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    // Return original text if decryption fails (e.g., if it was stored as plain text)
    return text;
  }
}
