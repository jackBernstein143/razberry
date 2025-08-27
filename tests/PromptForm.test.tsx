import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PromptForm from '@/components/PromptForm'

describe('PromptForm', () => {
  it('renders input field and submit button', () => {
    const mockSubmit = vi.fn()
    render(<PromptForm onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox', { name: /story prompt/i })
    const button = screen.getByRole('button', { name: /submit/i })
    
    expect(input).toBeInTheDocument()
    expect(button).toBeInTheDocument()
  })

  it('allows user to type in the input field', async () => {
    const user = userEvent.setup()
    const mockSubmit = vi.fn()
    render(<PromptForm onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox', { name: /story prompt/i }) as HTMLInputElement
    const testText = 'Once upon a time in a magical forest'
    
    await user.type(input, testText)
    
    expect(input.value).toBe(testText)
  })

  it('calls onSubmit with the prompt text when form is submitted', async () => {
    const user = userEvent.setup()
    const mockSubmit = vi.fn()
    render(<PromptForm onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox', { name: /story prompt/i })
    const button = screen.getByRole('button', { name: /submit/i })
    const testText = 'A hero embarks on an epic journey'
    
    await user.type(input, testText)
    await user.click(button)
    
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledTimes(1)
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          text: testText,
          timestamp: expect.any(Number)
        })
      )
    })
  })

  it('clears input after successful submission', async () => {
    const user = userEvent.setup()
    const mockSubmit = vi.fn()
    render(<PromptForm onSubmit={mockSubmit} />)
    
    const input = screen.getByRole('textbox', { name: /story prompt/i }) as HTMLInputElement
    const button = screen.getByRole('button', { name: /submit/i })
    
    await user.type(input, 'Test prompt')
    await user.click(button)
    
    await waitFor(() => {
      expect(input.value).toBe('')
    })
  })

  it('prevents submission of empty prompt', async () => {
    const user = userEvent.setup()
    const mockSubmit = vi.fn()
    render(<PromptForm onSubmit={mockSubmit} />)
    
    const button = screen.getByRole('button', { name: /submit/i })
    
    await user.click(button)
    
    expect(mockSubmit).not.toHaveBeenCalled()
  })

  it('respects maxLength prop when provided', async () => {
    const user = userEvent.setup()
    const mockSubmit = vi.fn()
    const maxLength = 100
    render(<PromptForm onSubmit={mockSubmit} maxLength={maxLength} />)
    
    const input = screen.getByRole('textbox', { name: /story prompt/i }) as HTMLInputElement
    
    expect(input.maxLength).toBe(maxLength)
  })

  it('uses custom placeholder when provided', () => {
    const mockSubmit = vi.fn()
    const customPlaceholder = 'Tell me your story...'
    render(<PromptForm onSubmit={mockSubmit} placeholder={customPlaceholder} />)
    
    const input = screen.getByPlaceholderText(customPlaceholder)
    
    expect(input).toBeInTheDocument()
  })
})