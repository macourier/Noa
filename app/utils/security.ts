/**
 * Security utilities for NOA — The Vault.
 *
 * MIME validation, filename sanitization, and encryption placeholder.
 * Every file crossing the boundary MUST pass through validateFile().
 */

// ─── MIME Type Validation ───────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
] as const)

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

/**
 * Validates that a file's MIME type is in the allowed list.
 * MUST be checked server-side before storage — client-side `accept`
 * attribute is trivially bypassed.
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType as typeof ALLOWED_MIME_TYPES extends Set<infer T> ? T : never)
}

/**
 * Validates file size is within acceptable bounds.
 */
export function isFileSizeValid(bytes: number): boolean {
  return bytes > 0 && bytes <= MAX_FILE_SIZE_BYTES
}

/**
 * Full file validation — MIME type + size.
 * Returns a typed result with an error message if invalid.
 */
export function validateFile(file: File): { isValid: true } | { isValid: false; error: string } {
  if (!isAllowedMimeType(file.type)) {
    return {
      isValid: false,
      error: `Type non autorisé (${file.type || 'inconnu'}). Formats acceptés : PDF, JPG, PNG, WebP.`,
    }
  }

  if (!isFileSizeValid(file.size)) {
    return {
      isValid: false,
      error: `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum : 10 MB.`,
    }
  }

  return { isValid: true }
}

// ─── Filename Sanitization ──────────────────────────────────────────

/**
 * Generates a safe, unique filename to prevent path injection attacks.
 * The original filename is NEVER used as a storage path.
 *
 * Format: doc_{timestamp_base36}_{8-char-uuid}.{extension}
 * Example: doc_m5x7k2p_4a9b2c1f.pdf
 */
export function generateSafeFilename(originalName: string): string {
  const extension = originalName.split('.').pop()?.toLowerCase()

  // Only allow known safe extensions
  const safeExtensions = new Set(['pdf', 'jpg', 'jpeg', 'png', 'webp'])
  const safeExtension = extension && safeExtensions.has(extension) ? extension : 'bin'

  const timestamp = Date.now().toString(36)
  const uniqueId = crypto.randomUUID().slice(0, 8)

  return `doc_${timestamp}_${uniqueId}.${safeExtension}`
}

// ─── Encryption Placeholder (Phase 3) ───────────────────────────────
//
// For the "Secure Vault" — credentials and sensitive metadata.
// The encryption key lives ONLY on the user's device (Web Crypto API).
// Appwrite stores ciphertext — even a DB breach reveals nothing.
//
// Planned architecture:
//   1. On first use, generate an AES-256-GCM key via crypto.subtle.generateKey()
//   2. Wrap the key with a passphrase-derived key for backup
//   3. Encrypt metadata.client-side before writing to Appwrite
//   4. Decrypt on read — server NEVER sees plaintext
//
// This will be implemented in Phase 3 (identités/vault).

export interface EncryptedMetadata {
  /** Base64-encoded AES-256-GCM ciphertext */
  ciphertext: string
  /** Base64-encoded IV (12 bytes) */
  iv: string
  /** Encryption algorithm version for future migration */
  version: 1
}

/** Type guard for encrypted metadata */
export function isEncryptedMetadata(value: unknown): value is EncryptedMetadata {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  return typeof obj.ciphertext === 'string'
    && typeof obj.iv === 'string'
    && obj.version === 1
}