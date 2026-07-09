import OpenAI from 'openai'
import { REFERENCE_DIRECTIVE, type AssembledPrompt } from '@/lib/claude/prompt'
import type { ReferenceImage } from '@/lib/materials/repository'

// Selectable generation provider (GENERATION_PROVIDER=openai). Claude remains the
// default per the product spec; OpenAI is wired as an alternative. Set the exact
// model via OPENAI_MODEL (this key has gpt-5.x / gpt-4.1 / gpt-4o available).
export const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-5.1'

let client: OpenAI | null = null

function getClient(): OpenAI {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set')
  }
  if (!client) {
    // OPENAI_BASE_URL supports a corporate gateway / Azure-compatible endpoint.
    client = new OpenAI({ baseURL: process.env.OPENAI_BASE_URL || undefined })
  }
  return client
}

export async function generateHtmlOpenAI(
  { system, user }: AssembledPrompt,
  references: ReferenceImage[] = [],
): Promise<string> {
  // When the workspace has reference layouts, attach them as image parts so the
  // (vision-capable) model can match the house style. Text-only otherwise.
  const userContent: string | OpenAI.Chat.Completions.ChatCompletionContentPart[] =
    references.length === 0
      ? user
      : [
          { type: 'text', text: user },
          { type: 'text', text: REFERENCE_DIRECTIVE },
          ...references.map((reference) => ({
            type: 'image_url' as const,
            image_url: { url: `data:${reference.mime};base64,${reference.base64}` },
          })),
        ]

  // max_completion_tokens (not max_tokens) + no temperature keeps this valid for
  // both reasoning models (gpt-5.x) and standard ones (gpt-4.1 / gpt-4o).
  const completion = await getClient().chat.completions.create({
    model: OPENAI_MODEL,
    max_completion_tokens: 16000,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
  })

  return completion.choices[0]?.message?.content ?? ''
}
