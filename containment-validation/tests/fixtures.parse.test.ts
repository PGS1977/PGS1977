import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  CableProductSchema,
  ContainmentProductSchema,
  PROVENANCE,
  ProductSourceSchema,
  parseOrThrow,
} from '../src/domain'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function readJson(rel: string): unknown {
  return JSON.parse(readFileSync(join(root, rel), 'utf8'))
}

describe('fixture pack — synthetic only', () => {
  it('parses product sources as fixture provenance', () => {
    const raw = readJson('data/fixtures/product-sources.json') as unknown[]
    for (const row of raw) {
      // Strip documentation-only keys before schema parse.
      const { _comment: _c, ...data } = row as Record<string, unknown>
      const source = parseOrThrow(ProductSourceSchema, data, 'fixture ProductSource')
      expect(source.provenance).toBe(PROVENANCE.fixture)
      expect(source.manufacturer).toBe('SYNTHETIC')
      expect(source.manufacturerId).toBe('synthetic')
      expect(source.structuredDataStatus).toBe('fixture')
    }
  })

  it('parses containment fixtures without claiming verified status', () => {
    const raw = readJson('data/fixtures/containment-products.json') as unknown[]
    for (const row of raw) {
      const { _comment: _c, ...data } = row as Record<string, unknown>
      const product = parseOrThrow(
        ContainmentProductSchema,
        data,
        'fixture ContainmentProduct',
      )
      expect(product.code.startsWith('SYNTH-')).toBe(true)
      // Must not hard-code 150/300 mm outcomes via fixture codes.
      expect(product.nominalWidthMm).not.toBe(150)
      expect(product.nominalWidthMm).not.toBe(300)
    }
  })

  it('parses cable fixtures', () => {
    const raw = readJson('data/fixtures/cable-products.json') as unknown[]
    for (const row of raw) {
      const { _comment: _c, ...data } = row as Record<string, unknown>
      const product = parseOrThrow(CableProductSchema, data, 'fixture CableProduct')
      expect(product.code.startsWith('SYNTH-')).toBe(true)
    }
  })
})
