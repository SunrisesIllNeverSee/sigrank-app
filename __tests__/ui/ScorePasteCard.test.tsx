import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/score',
}))

import { ScorePasteCard } from '@/components/score/ScorePasteCard'

describe('ScorePasteCard', () => {
  it('renders without crashing', () => {
    render(<ScorePasteCard />)
    expect(screen.getByRole('textbox')).toBeInTheDocument()
  })

  it('shows a preview/parse button', () => {
    render(<ScorePasteCard />)
    // Look for any button — the paste card has a preview/calculate action
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })
})
