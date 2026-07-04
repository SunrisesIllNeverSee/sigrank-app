import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next/navigation — ThemeToggle may use router
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

import { ThemeToggle } from '@/components/ui/ThemeToggle'

describe('ThemeToggle', () => {
  it('renders without crashing', () => {
    render(<ThemeToggle />)
    // ThemeToggle renders 4 buttons (one per theme: Carbon, Paper, Railway, Terminal)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBe(4)
  })
})
