import { describe, expect, it } from 'vitest'
import { runChat, type ChatEvent } from '../../server/ai/runner'
import { ProviderError } from '../../server/ai/providers/types'
import { createScriptedProvider } from '../helpers/scripted-provider'

const baseInput = {
  system: 'system prompt',
  messages: [{ role: 'user' as const, content: 'hi' }],
  tools: [],
}

const noopDispatch = async (name: string) => ({
  output: JSON.stringify({ overview: `${name} ran`, filters: [], rows: [] }),
  result: { overview: `${name} ran`, filters: [], rows: [] },
  is_error: false,
})

function recorder() {
  const events: ChatEvent[] = []
  return { events, emit: (e: ChatEvent) => void events.push(e) }
}

describe('runChat', () => {
  it('emits text + done when the provider returns a text pick', async () => {
    const { events, emit } = recorder()
    const provider = createScriptedProvider({
      pick: { kind: 'text', text: "I don't have that data" },
    })

    await runChat({
      provider,
      ...baseInput,
      dispatch: noopDispatch,
      emit,
    })

    expect(events.map((e) => e.type)).toEqual(['text', 'done'])
    expect((events[0] as { text: string }).text).toBe("I don't have that data")
  })

  it('dispatches each picked tool and streams summary chunks', async () => {
    const { events, emit } = recorder()
    const provider = createScriptedProvider({
      pick: {
        kind: 'tools',
        calls: [
          { name: 'tool_a', args: { x: 1 } },
          { name: 'tool_b', args: { y: 2 } },
        ],
      },
      summary: ['Hello ', 'world'],
    })

    await runChat({
      provider,
      ...baseInput,
      dispatch: noopDispatch,
      emit,
    })

    const types = events.map((e) => e.type)
    expect(types).toEqual([
      'tool_start',
      'tool_result',
      'tool_start',
      'tool_result',
      'text',
      'text',
      'done',
    ])
    const textConcat = events
      .filter((e): e is Extract<ChatEvent, { type: 'text' }> => e.type === 'text')
      .map((e) => e.text)
      .join('')
    expect(textConcat).toBe('Hello world')
  })

  it('marks tool envelope is_error when dispatch fails', async () => {
    const { events, emit } = recorder()
    const provider = createScriptedProvider({
      pick: { kind: 'tools', calls: [{ name: 'broken', args: {} }] },
      summary: ['done'],
    })

    await runChat({
      provider,
      ...baseInput,
      dispatch: async () => ({
        output: JSON.stringify({ message: 'kaboom' }),
        result: { message: 'kaboom' },
        is_error: true,
      }),
      emit,
    })

    const toolResult = events.find((e) => e.type === 'tool_result') as Extract<
      ChatEvent,
      { type: 'tool_result' }
    >
    expect(toolResult.is_error).toBe(true)
    expect(toolResult.overview).toBe('kaboom')
  })

  it('emits an error event when the provider throws ProviderError', async () => {
    const { events, emit } = recorder()
    const provider = createScriptedProvider({
      pick: { kind: 'text', text: 'unused' },
      pickError: new ProviderError('upstream 401'),
    })

    await runChat({
      provider,
      ...baseInput,
      dispatch: noopDispatch,
      emit,
    })

    const types = events.map((e) => e.type)
    expect(types).toEqual(['error'])
    expect((events[0] as { message: string }).message).toBe('upstream 401')
  })
})
