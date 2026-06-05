import { describe, it, expect } from 'vitest'
import { FORMATS, FORMAT_KEYS } from '../lib/formats/index'

describe('FORMATS', () => {
  it('contains all 7 formats', () => {
    expect(FORMAT_KEYS).toHaveLength(7)
    expect(FORMAT_KEYS).toContain('a4')
    expect(FORMAT_KEYS).toContain('a5')
    expect(FORMAT_KEYS).toContain('instagram_post')
    expect(FORMAT_KEYS).toContain('instagram_story')
    expect(FORMAT_KEYS).toContain('tv_board')
    expect(FORMAT_KEYS).toContain('youtube_preview')
    expect(FORMAT_KEYS).toContain('twitter_post')
  })

  it('every format has valid dimensions and output type', () => {
    for (const key of FORMAT_KEYS) {
      const fmt = FORMATS[key]
      expect(fmt.width).toBeGreaterThan(0)
      expect(fmt.height).toBeGreaterThan(0)
      expect(['pdf', 'png']).toContain(fmt.output)
      expect(['print', 'digital']).toContain(fmt.category)
      expect(fmt.label).toBeTruthy()
    }
  })

  it('a4 is 794x1123 PDF', () => {
    expect(FORMATS.a4).toMatchObject({ width: 794, height: 1123, output: 'pdf' })
  })

  it('instagram_post is 1080x1080 PNG', () => {
    expect(FORMATS.instagram_post).toMatchObject({ width: 1080, height: 1080, output: 'png' })
  })

  it('tv_board is 1920x1080', () => {
    expect(FORMATS.tv_board).toMatchObject({ width: 1920, height: 1080 })
  })
})
