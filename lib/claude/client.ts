import Anthropic from '@anthropic-ai/sdk'
import { REFERENCE_DIRECTIVE, type AssembledPrompt } from './prompt'
import type { ReferenceImage } from '@/lib/materials/repository'

type ClaudeMediaType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif'

// The product spec (MASTER_PROJECT.md) targets claude-sonnet-4-6 for cost
// (~$0.05–0.12 per batch). The prototype defaults to the most capable model for
// output quality — switch this one constant to trade quality for cost.
export const GENERATION_MODEL = 'claude-opus-4-8'

let client: Anthropic | null = null

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }
  if (!client) client = new Anthropic()
  return client
}

export async function generateHtml(
  { system, user }: AssembledPrompt,
  references: ReferenceImage[] = [],
): Promise<string> {
  // Attach reference layouts as image blocks when present (Claude is
  // vision-capable); plain text otherwise.
  const content: Anthropic.MessageParam['content'] =
    references.length === 0
      ? user
      : [
          { type: 'text', text: user },
          { type: 'text', text: REFERENCE_DIRECTIVE },
          ...references.map((reference) => ({
            type: 'image' as const,
            source: {
              type: 'base64' as const,
              media_type: reference.mime as ClaudeMediaType,
              data: reference.base64,
            },
          })),
        ]

  const response = await getClient().messages.create({
    model: GENERATION_MODEL,
    max_tokens: 16000,
    thinking: { type: 'adaptive' },
    output_config: { effort: 'medium' },
    system,
    messages: [{ role: 'user', content }],
  })

  return response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
}
