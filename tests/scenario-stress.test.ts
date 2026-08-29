import { describe, expect, it } from 'vitest'
import { scenarios } from '../src/engine/scenarios'

describe('scenario stress wiring', () => {
  it('applies incident telemetry degradation to the Mumbai drill', () => {
    const mumbai = scenarios.find((scenario) => scenario.id === 'mumbai')
    expect(mumbai).toBeDefined()

    const floodplain = mumbai!.sectors.find((sector) => sector.id === 'mumbai-mithi-bkc')
    const unaffected = mumbai!.sectors.find((sector) => sector.id === 'mumbai-colaba-command')

    expect(floodplain?.mobility).toBeUndefined()
    expect(floodplain?.telemetry.mobility).toBeLessThan(50)
    expect(unaffected?.telemetry.mobility).toBeGreaterThan(65)
  })
})
