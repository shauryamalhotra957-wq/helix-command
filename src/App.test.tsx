import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import App from './App'

vi.mock('./components/DigitalTwin', () => ({
  DigitalTwin: () => <div data-testid="digital-twin-canvas" />,
}))

describe('App', () => {
  it('renders the command center with mission controls and planner output', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /HELIX Command/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cyber Blackout/i })).toBeInTheDocument()
    expect(await screen.findByTestId('digital-twin-canvas')).toBeInTheDocument()
    expect(screen.getByText(/Dispatch plan/i)).toBeInTheDocument()
  })

  it('switches scenarios and keeps the interface populated', async () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: /Heatfire Cascade/i }))

    expect(await screen.findByTestId('digital-twin-canvas')).toBeInTheDocument()
    expect(screen.getAllByText(/Fuel farm heat ignition/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Thermal risk/i)).toBeInTheDocument()
  })

  it('steps and resets the mission clock', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Step mission clock' }))
    expect(screen.getByLabelText('Mission clock')).toHaveTextContent('T+039m')

    fireEvent.click(screen.getByRole('button', { name: 'Reset mission clock' }))
    expect(screen.getByLabelText('Mission clock')).toHaveTextContent('T+000m')
  })
})
