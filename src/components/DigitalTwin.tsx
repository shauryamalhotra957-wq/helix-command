import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { getIncident, getResource, getSector } from '../engine/planner'
import type { MissionAnalysis, Scenario } from '../engine/types'

interface DigitalTwinProps {
  scenario: Scenario
  analysis: MissionAnalysis
  elapsedMinutes: number
  selectedIncidentId: string
}

function cityPoint(x: number, y: number, height = 0) {
  return new THREE.Vector3(x - 50, height, y - 50)
}

function riskColor(score: number) {
  if (score >= 88) return new THREE.Color('#fb7185')
  if (score >= 74) return new THREE.Color('#facc15')
  if (score >= 58) return new THREE.Color('#38bdf8')
  return new THREE.Color('#5eead4')
}

function resourceColor(kind: string) {
  switch (kind) {
    case 'medical':
      return '#f472b6'
    case 'power':
      return '#facc15'
    case 'cyber':
      return '#60a5fa'
    case 'drone':
      return '#38bdf8'
    case 'field':
      return '#fb7185'
    case 'shelter':
      return '#6ee7b7'
    default:
      return '#c4b5fd'
  }
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
      child.geometry.dispose()
      const material = child.material
      if (Array.isArray(material)) {
        material.forEach((entry) => entry.dispose())
      } else {
        material.dispose()
      }
    }
  })
}

export function DigitalTwin({
  scenario,
  analysis,
  elapsedMinutes,
  selectedIncidentId,
}: DigitalTwinProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const elapsedRef = useRef(elapsedMinutes)

  useEffect(() => {
    elapsedRef.current = elapsedMinutes
  }, [elapsedMinutes])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#071014')
    scene.fog = new THREE.Fog('#071014', 92, 180)

    const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 500)
    camera.position.set(64, 82, 114)
    camera.lookAt(0, 0, 0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    host.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.maxDistance = 170
    controls.minDistance = 62
    controls.maxPolarAngle = Math.PI * 0.47
    controls.target.set(0, 0, 0)

    const root = new THREE.Group()
    scene.add(root)

    const ambient = new THREE.AmbientLight('#9ccfd8', 0.68)
    scene.add(ambient)
    const sun = new THREE.DirectionalLight('#ffffff', 2.4)
    sun.position.set(42, 80, 34)
    sun.castShadow = true
    scene.add(sun)
    const rim = new THREE.PointLight('#38bdf8', 38, 150)
    rim.position.set(-42, 26, -50)
    scene.add(rim)

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: '#0d1c20',
      roughness: 0.8,
      metalness: 0.2,
    })
    const base = new THREE.Mesh(new THREE.BoxGeometry(112, 1.2, 112), baseMaterial)
    base.position.y = -0.8
    base.receiveShadow = true
    root.add(base)

    const grid = new THREE.GridHelper(112, 14, '#2dd4bf', '#1e3a3f')
    grid.position.y = 0.05
    root.add(grid)

    const riskBySector = new Map(analysis.sectorRisks.map((risk) => [risk.sectorId, risk.score]))
    const incidentPulses: THREE.Mesh[] = []
    const movingResources: {
      mesh: THREE.Mesh
      start: THREE.Vector3
      end: THREE.Vector3
      eta: number
      index: number
    }[] = []

    for (const sector of scenario.sectors) {
      for (const dependencyId of sector.dependencies) {
        const dependency = scenario.sectors.find((candidate) => candidate.id === dependencyId)
        if (!dependency) continue
        const points = [cityPoint(sector.position.x, sector.position.y, 0.08), cityPoint(dependency.position.x, dependency.position.y, 0.08)]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const line = new THREE.Line(
          geometry,
          new THREE.LineBasicMaterial({ color: '#214d55', transparent: true, opacity: 0.54 }),
        )
        root.add(line)
      }
    }

    for (const sector of scenario.sectors) {
      const risk = riskBySector.get(sector.id) ?? 0
      const height = 2.4 + risk * 0.16
      const radius = 1.9 + Math.log10(sector.population) * 0.22
      const material = new THREE.MeshStandardMaterial({
        color: riskColor(risk),
        emissive: riskColor(risk),
        emissiveIntensity: risk >= 80 ? 0.24 : 0.1,
        roughness: 0.5,
        metalness: 0.25,
      })
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius * 1.18, height, 6), material)
      tower.position.copy(cityPoint(sector.position.x, sector.position.y, height / 2))
      tower.castShadow = true
      tower.receiveShadow = true
      if (scenario.incidents.some((incident) => incident.sectorId === sector.id)) {
        tower.scale.x = 1.12
        tower.scale.z = 1.12
      }
      root.add(tower)
    }

    for (const incident of scenario.incidents) {
      const sector = getSector(scenario, incident.sectorId)
      const isSelected = selectedIncidentId === incident.id
      const point = cityPoint(sector.position.x, sector.position.y, 1.8)
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(isSelected ? 5.2 : 4.2, 0.16, 8, 56),
        new THREE.MeshBasicMaterial({
          color: isSelected ? '#ffffff' : riskColor(incident.severity * 10),
          transparent: true,
          opacity: isSelected ? 0.92 : 0.58,
        }),
      )
      ring.rotation.x = Math.PI / 2
      ring.position.copy(point)
      root.add(ring)
      incidentPulses.push(ring)

      const beacon = new THREE.Mesh(
        new THREE.SphereGeometry(isSelected ? 1.5 : 1.1, 24, 16),
        new THREE.MeshStandardMaterial({
          color: isSelected ? '#ffffff' : riskColor(incident.severity * 10),
          emissive: isSelected ? '#e0f2fe' : riskColor(incident.severity * 10),
          emissiveIntensity: isSelected ? 0.85 : 0.55,
        }),
      )
      beacon.position.copy(cityPoint(sector.position.x, sector.position.y, 4.4))
      root.add(beacon)
      incidentPulses.push(beacon)
    }

    analysis.assignments.forEach((assignment, index) => {
      const resource = getResource(scenario, assignment.resourceId)
      const incident = getIncident(scenario, assignment.incidentId)
      const sector = getSector(scenario, incident.sectorId)
      const start = cityPoint(resource.position.x, resource.position.y, 4.2 + (index % 3))
      const end = cityPoint(sector.position.x, sector.position.y, 7 + (index % 4))
      const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([start, end]),
        new THREE.LineBasicMaterial({
          color: resourceColor(resource.kind),
          transparent: true,
          opacity: selectedIncidentId === assignment.incidentId ? 0.9 : 0.42,
        }),
      )
      root.add(line)

      const mesh = new THREE.Mesh(
        new THREE.ConeGeometry(1.05, 3.1, 5),
        new THREE.MeshStandardMaterial({
          color: resourceColor(resource.kind),
          emissive: resourceColor(resource.kind),
          emissiveIntensity: 0.38,
          roughness: 0.38,
          metalness: 0.35,
        }),
      )
      mesh.position.copy(start)
      mesh.rotation.x = Math.PI
      root.add(mesh)
      movingResources.push({ mesh, start, end, eta: assignment.etaMinutes, index })
    })

    const resize = () => {
      const rect = host.getBoundingClientRect()
      const width = Math.max(320, Math.floor(rect.width))
      const height = Math.max(300, Math.floor(rect.height))
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    const observer = new ResizeObserver(resize)
    observer.observe(host)
    resize()

    let animationFrame = 0
    const animate = (time: number) => {
      const seconds = time / 1000
      controls.update()
      root.rotation.y = Math.sin(seconds * 0.12) * 0.025

      incidentPulses.forEach((pulse, index) => {
        const scale = 1 + Math.sin(seconds * 2.4 + index) * 0.09
        pulse.scale.setScalar(scale)
        if (pulse instanceof THREE.Mesh && pulse.material instanceof THREE.MeshBasicMaterial) {
          pulse.material.opacity = 0.45 + Math.sin(seconds * 2.1 + index) * 0.18
        }
      })

      movingResources.forEach((entry) => {
        const missionProgress = clampProgress((elapsedRef.current - entry.eta * 0.35) / 145)
        const shimmer = Math.sin(seconds * 1.5 + entry.index) * 0.04
        const progress = clampProgress(missionProgress + shimmer)
        entry.mesh.position.lerpVectors(entry.start, entry.end, progress)
        entry.mesh.position.y += Math.sin(seconds * 3 + entry.index) * 0.35
        entry.mesh.lookAt(entry.end)
      })

      renderer.render(scene, camera)
      animationFrame = requestAnimationFrame(animate)
    }
    animationFrame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrame)
      observer.disconnect()
      controls.dispose()
      disposeObject(root)
      scene.clear()
      renderer.dispose()
      renderer.domElement.remove()
    }
  }, [analysis, scenario, selectedIncidentId])

  return (
    <section className="twin-shell" aria-label="3D city digital twin">
      <div className="twin-toolbar">
        <span>City response map</span>
        <span>{scenario.pressure}</span>
      </div>
      <div className="twin-canvas" ref={hostRef} data-testid="digital-twin-canvas" />
      <div className="twin-legend" aria-hidden="true">
        <span><i className="risk-dot risk-dot--critical" /> Critical</span>
        <span><i className="risk-dot risk-dot--warning" /> Warning</span>
        <span><i className="risk-dot risk-dot--stable" /> Stabilizing</span>
      </div>
    </section>
  )
}

function clampProgress(value: number) {
  return Math.min(1, Math.max(0, value))
}
