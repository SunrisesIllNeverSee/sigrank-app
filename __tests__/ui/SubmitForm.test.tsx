import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/submit',
}))

import { SubmitForm } from '@/components/submit/SubmitForm'

describe('SubmitForm', () => {
  it('renders without crashing', () => {
    render(<SubmitForm />)
    // SubmitForm should render some form elements
    const form = document.querySelector('form')
    // If no form tag, at least check it rendered something
    expect(form || screen.getByText(/./)).toBeTruthy()
  })
})
