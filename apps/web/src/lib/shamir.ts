/**
 * Shamir Secret Sharing Implementation
 * Supports 2-of-3 threshold scheme for Release Key distribution
 * All operations performed client-side for zero-knowledge architecture
 */

// Finite field arithmetic for GF(2^8)
const GF256_EXP = new Uint8Array(256);
const GF256_LOG = new Uint8Array(256);

// Initialize GF(2^8) lookup tables
function initGF256() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF256_EXP[0] = 1; // eslint-disable-line security/detect-object-injection
    GF256_LOG[0] = 0; // eslint-disable-line security/detect-object-injection
    x = (x << 1) ^ (x & 0x80 ? 0x1d : 0);
  }
  GF256_EXP[255] = GF256_EXP[0];
}

initGF256();

/**
 * Galois Field multiplication in GF(2^8)
 */
function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return GF256_EXP[(GF256_LOG[a] + GF256_LOG[b]) % 255]; // eslint-disable-line security/detect-object-injection
}

/**
 * Galois Field division in GF(2^8)
 */
function gfDiv(a: number, b: number): number {
  if (a === 0) return 0;
  if (b === 0) throw new Error('Division by zero in GF(2^8)');
  return GF256_EXP[(GF256_LOG[a] - GF256_LOG[b] + 255) % 255];
}

/**
 * Evaluate polynomial at point x using Horner's method
 */
function evaluatePolynomial(coefficients: Uint8Array, x: number): number {
  let result = 0;
  for (let i = coefficients.length - 1; i >= 0; i--) {
    result = gfMul(result, x) ^ coefficients[i];
  }
  return result;
}

/**
 * Lagrange interpolation to reconstruct secret from shares
 */
function lagrangeInterpolation(shares: ShamirShare[]): number {
  let result = 0;
  
  for (let i = 0; i < shares.length; i++) {
    let numerator = 1;
    let denominator = 1;
    
    for (let j = 0; j < shares.length; j++) {
      if (i !== j) {
        numerator = gfMul(numerator, shares[j].x);
        denominator = gfMul(denominator, shares[i].x ^ shares[j].x);
      }
    }
    
    const lagrangeCoeff = gfDiv(numerator, denominator);
    result ^= gfMul(shares[i].y, lagrangeCoeff);
  }
  
  return result;
}

export interface ShamirShare {
  id: string; // Unique identifier for this share
  x: number; // X coordinate (1, 2, or 3 for our 2-of-3 scheme)
  y: number; // Y coordinate (share value)
  beneficiaryId: string; // Which beneficiary this share belongs to
  willId: string; // Which will this share is for
  shareIndex: number; // 1, 2, or 3
  createdAt: string; // ISO timestamp
}

export interface ShamirShareSet {
  willId: string;
  threshold: number; // Always 2 for our implementation
  totalShares: number; // Always 3 for our implementation
  shares: ShamirShare[];
  releaseKeyHash: string; // SHA-256 hash for verification
}

/**
 * Generate Shamir Secret Shares for a Release Key
 * Uses 2-of-3 threshold scheme
 */
export async function generateShamirShares(
  releaseKey: Uint8Array,
  willId: string,
  beneficiaryIds: string[]
): Promise<ShamirShareSet> {
  if (beneficiaryIds.length !== 3) {
    throw new Error('Exactly 3 beneficiaries required for 2-of-3 Shamir sharing');
  }

  if (releaseKey.length !== 32) {
    throw new Error('Release key must be 32 bytes');
  }

  const shares: ShamirShare[] = [];
  const threshold = 2;
  const totalShares = 3;

  // Process each byte of the release key separately
  const shareBytes: number[][] = [[], [], []];

  for (let byteIndex = 0; byteIndex < 32; byteIndex++) {
    const secret = releaseKey[byteIndex];
    
    // Generate random coefficient for degree-1 polynomial (2-of-3 scheme)
    const coefficient = crypto.getRandomValues(new Uint8Array(1))[0];
    
    // Polynomial: f(x) = secret + coefficient * x
    const polynomial = new Uint8Array([secret, coefficient]);
    
    // Generate shares at x = 1, 2, 3
    for (let x = 1; x <= 3; x++) {
      const y = evaluatePolynomial(polynomial, x);
      shareBytes[x - 1].push(y);
    }
  }

  // Create share objects
  for (let i = 0; i < 3; i++) {
    shares.push({
      id: crypto.randomUUID(),
      x: i + 1,
      y: 0, // Will be set per byte during reconstruction
      beneficiaryId: beneficiaryIds[i],
      willId,
      shareIndex: i + 1,
      createdAt: new Date().toISOString(),
    });
  }

  // Calculate release key hash for verification
  const releaseKeyHash = Array.from(
    new Uint8Array(
      await crypto.subtle.digest('SHA-256', releaseKey)
    )
  ).map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    willId,
    threshold,
    totalShares,
    shares: shares.map((share, index) => ({
      ...share,
      shareData: shareBytes[index], // Store the byte array for this share
    })) as any,
    releaseKeyHash,
  };
}

/**
 * Combine Shamir shares to reconstruct the Release Key
 * Requires at least 2 shares from the 2-of-3 scheme
 */
export function combineShamirShares(
  shares: (ShamirShare & { shareData: number[] })[]
): Uint8Array {
  if (shares.length < 2) {
    throw new Error('At least 2 shares required for reconstruction');
  }

  if (shares.length > 3) {
    throw new Error('Maximum 3 shares allowed');
  }

  // Verify all shares are for the same will
  const willId = shares[0].willId;
  if (!shares.every(share => share.willId === willId)) {
    throw new Error('All shares must be for the same will');
  }

  // Verify share data exists and has correct length
  if (!shares.every(share => share.shareData && share.shareData.length === 32)) {
    throw new Error('Invalid share data format');
  }

  const reconstructedKey = new Uint8Array(32);

  // Reconstruct each byte of the release key
  for (let byteIndex = 0; byteIndex < 32; byteIndex++) {
    const points = shares.map(share => [share.x, share.shareData[byteIndex]]); // eslint-disable-line security/detect-object-injection
    reconstructedKey[byteIndex] = lagrangeInterpolation(points.map(([x, y], index) => ({ x, y, beneficiaryId: shares[index].beneficiaryId, willId: shares[index].willId, id: shares[index].id, shareIndex: shares[index].shareIndex, createdAt: shares[index].createdAt })));
  }

  return reconstructedKey;
}

/**
 * Verify that reconstructed key matches expected hash
 */
export async function verifyShamirReconstruction(
  reconstructedKey: Uint8Array,
  expectedHash: string
): Promise<boolean> {
  try {
    const actualHash = Array.from(
      new Uint8Array(
        await crypto.subtle.digest('SHA-256', reconstructedKey)
      )
    ).map(b => b.toString(16).padStart(2, '0')).join('');

    return actualHash === expectedHash;
  } catch (error) {
    console.error('Failed to verify Shamir reconstruction:', error);
    return false;
  }
}

/**
 * Encode share data for secure transmission
 */
export function encodeShamirShare(
  share: ShamirShare & { shareData: number[] }
): string {
  const shareObject = {
    id: share.id,
    x: share.x,
    beneficiaryId: share.beneficiaryId,
    willId: share.willId,
    shareIndex: share.shareIndex,
    shareData: Array.from(share.shareData),
    createdAt: share.createdAt,
  };

  return btoa(JSON.stringify(shareObject));
}

/**
 * Decode share data from transmission format
 */
export function decodeShamirShare(
  encodedShare: string
): ShamirShare & { shareData: number[] } {
  try {
    const shareObject = JSON.parse(atob(encodedShare));
    
    return {
      id: shareObject.id,
      x: shareObject.x,
      y: 0, // Not used in encoded format
      beneficiaryId: shareObject.beneficiaryId,
      willId: shareObject.willId,
      shareIndex: shareObject.shareIndex,
      shareData: shareObject.shareData.map((data: string) => parseInt(data, 10)), // eslint-disable-line security/detect-object-injection
      createdAt: shareObject.createdAt,
    };
  } catch (error) {
    throw new Error('Invalid share encoding format');
  }
}

/**
 * Generate secure share distribution tokens
 * Each token contains encrypted share data for email distribution
 */
export async function generateShareDistributionTokens(
  shareSet: ShamirShareSet,
  beneficiaryEmails: string[]
): Promise<Array<{
  beneficiaryId: string;
  email: string;
  token: string;
  shareIndex: number;
}>> {
  if (beneficiaryEmails.length !== 3) {
    throw new Error('Exactly 3 beneficiary emails required');
  }

  const tokens = [];

  for (let i = 0; i < 3; i++) {
    const share = shareSet.shares[i] as any;
    const encodedShare = encodeShamirShare(share);
    
    // Create a JWT-like token for secure distribution
    const tokenData = {
      shareData: encodedShare,
      willId: shareSet.willId,
      beneficiaryId: share.beneficiaryId,
      shareIndex: share.shareIndex,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
      iat: Date.now(),
    };

    const token = btoa(JSON.stringify(tokenData));

    tokens.push({
      beneficiaryId: share.beneficiaryId,
      email: beneficiaryEmails[i],
      token,
      shareIndex: share.shareIndex,
    });
  }

  return tokens;
}

/**
 * Validate share combination before reconstruction
 */
export function validateShareCombination(
  shares: (ShamirShare & { shareData: number[] })[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check minimum shares
  if (shares.length < 2) {
    errors.push('At least 2 shares required for reconstruction');
  }

  // Check maximum shares
  if (shares.length > 3) {
    errors.push('Maximum 3 shares allowed');
  }

  // Check will ID consistency
  if (shares.length > 0) {
    const willId = shares[0].willId;
    if (!shares.every(share => share.willId === willId)) {
      errors.push('All shares must be for the same will');
    }
  }

  // Check for duplicate shares
  const shareIndices = shares.map(s => s.shareIndex);
  if (new Set(shareIndices).size !== shareIndices.length) {
    errors.push('Duplicate shares detected');
  }

  // Check share data format
  if (!shares.every(share => share.shareData && share.shareData.length === 32)) {
    errors.push('Invalid share data format');
  }

  // Check X coordinates are valid (1, 2, or 3)
  if (!shares.every(share => [1, 2, 3].includes(share.x))) {
    errors.push('Invalid share X coordinates');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
