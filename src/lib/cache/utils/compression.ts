/**
 * Compression utilities for cache optimization
 * Uses LZ-string for efficient text compression
 */

import LZString from 'lz-string'

/**
 * Compress data to reduce storage size
 */
export function compressData(data: any): string {
  if (typeof data === 'string') {
    return LZString.compressToUTF16(data)
  }
  return LZString.compressToUTF16(JSON.stringify(data))
}

/**
 * Decompress data back to original format
 */
export function decompressData(compressed: string): any {
  const decompressed = LZString.decompressFromUTF16(compressed)

  if (!decompressed) {
    throw new Error('Failed to decompress data')
  }

  try {
    return JSON.parse(decompressed)
  } catch {
    // Return as string if not JSON
    return decompressed
  }
}

/**
 * Smart compression that only compresses if beneficial
 */
export function smartCompress(data: any, threshold = 1024): { compressed: boolean; data: any } {
  const str = typeof data === 'string' ? data : JSON.stringify(data)

  // Don't compress small data
  if (str.length < threshold) {
    return { compressed: false, data }
  }

  const compressed = LZString.compressToUTF16(str)
  const compressionRatio = compressed.length / str.length

  // Only use compression if it saves at least 20%
  if (compressionRatio < 0.8) {
    return { compressed: true, data: compressed }
  }

  return { compressed: false, data }
}

/**
 * Smart decompression that handles both compressed and uncompressed data
 */
export function smartDecompress(item: { compressed: boolean; data: any }): any {
  if (!item.compressed) {
    return item.data
  }

  return decompressData(item.data)
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(original: string, compressed: string): number {
  if (original.length === 0) return 0
  return (1 - compressed.length / original.length) * 100
}

/**
 * Estimate compressed size without actually compressing
 */
export function estimateCompressedSize(data: any): number {
  const str = typeof data === 'string' ? data : JSON.stringify(data)

  // Rough estimation based on typical compression ratios
  // JSON typically compresses to 10-30% of original size
  const hasRepeatedContent = /(.)\1{3,}/.test(str) // Has repeated characters
  const hasJsonStructure = str.includes('{') && str.includes('}')

  if (hasRepeatedContent) {
    return Math.floor(str.length * 0.15) // 15% for highly repetitive
  } else if (hasJsonStructure) {
    return Math.floor(str.length * 0.25) // 25% for structured JSON
  } else {
    return Math.floor(str.length * 0.4) // 40% for regular text
  }
}

/**
 * Batch compress multiple items
 */
export function batchCompress(items: any[], threshold = 1024): Array<{ compressed: boolean; data: any }> {
  return items.map(item => smartCompress(item, threshold))
}

/**
 * Batch decompress multiple items
 */
export function batchDecompress(items: Array<{ compressed: boolean; data: any }>): any[] {
  return items.map(item => smartDecompress(item))
}