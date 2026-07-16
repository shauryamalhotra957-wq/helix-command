import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const digitalTwinState = vi.hoisted(() => ({ failingScenarioId: null as string | null }))

vi.mock('./components/DigitalTwin', () => ({
  DigitalTwin: ({ scenario }: { scenario: { id: string } }) => {
    if (scenario.id === digitalTwinState.failingScenarioId) {
      throw new Error('WebGL context lost')
    }
    return <div data-testid="digital-twin-canvas" />
  },
}))

describe('App', () => {
  beforeEach(() => {
    digitalTwinState.failingScenarioId = null
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the command center with mission controls and planner output', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /HELIX Command/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cyber Blackout/i })).toBeInTheDocument()
    expect(await screen.findByTestId('digital-twin-canvas')).toBeInTheDocument()
    expect(screen.getByText(/Dispatch plan/i)).toBeInTheDocument()
    expect(screen.getByText(/Strategy compare/i)).toBeInTheDocument()
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

  it('applies a strategy preset to the planner policy', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: 'Apply Speed-first' }))

    expect(screen.getByLabelText('Move faster')).toHaveValue('0.95')
    expect(screen.getByLabelText('Control cost')).toHaveValue('0.22')
  })

  it('retries the digital twin after switching away from a failed scenario', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    digitalTwinState.failingScenarioId = 'mumbai'
    render(<App />)

    expect(await screen.findByText('3D map unavailable')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Heatfire Cascade/i }))

    expect(await screen.findByTestId('digital-twin-canvas')).toBeInTheDocument()
    expect(screen.queryByText('3D map unavailable')).not.toBeInTheDocument()
  })
})
