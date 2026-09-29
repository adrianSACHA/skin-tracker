import { describe, expect, it, vi } from 'vitest'
import { notifyDueChanged, subscribeDueChanged } from './dueSignal'

// Sygnał jest cienki, ale musi być bezpieczny tam, gdzie nie ma `window`
// (import w środowisku bez DOM nie może wysypać modułu).
describe('dueSignal', () => {
  it('poza przeglądarką nic nie robi i nie wywala', () => {
    expect(typeof window).toBe('undefined')

    expect(() => notifyDueChanged()).not.toThrow()

    const off = subscribeDueChanged(() => {})
    expect(typeof off).toBe('function')
    expect(() => off()).not.toThrow()
  })
})
