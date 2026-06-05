export const FORMATS = {
  a4: {
    label: 'A4',
    width: 794,
    height: 1123,
    output: 'pdf' as const,
    category: 'print' as const
  },
  a5: {
    label: 'A5',
    width: 559,
    height: 794,
    output: 'pdf' as const,
    category: 'print' as const
  },
  instagram_post: {
    label: 'Instagram Post',
    width: 1080,
    height: 1080,
    output: 'png' as const,
    category: 'digital' as const
  },
  instagram_story: {
    label: 'Instagram Story',
    width: 1080,
    height: 1920,
    output: 'png' as const,
    category: 'digital' as const
  },
  tv_board: {
    label: 'TV Board',
    width: 1920,
    height: 1080,
    output: 'png' as const,
    category: 'digital' as const
  },
  youtube_preview: {
    label: 'YouTube Preview',
    width: 1280,
    height: 720,
    output: 'png' as const,
    category: 'digital' as const
  },
  twitter_post: {
    label: 'Twitter / X',
    width: 1200,
    height: 675,
    output: 'png' as const,
    category: 'digital' as const
  }
} as const

export type FormatKey = keyof typeof FORMATS
export type Format = (typeof FORMATS)[FormatKey]
export const FORMAT_KEYS = Object.keys(FORMATS) as FormatKey[]
