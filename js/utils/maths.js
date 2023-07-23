import { Vector3 } from 'three'

export const getRandomSpherePoint = (position, radius, is2D = true) => {
  const p = new Vector3().copy(position) // new random point

  const u = Math.random()
  const v = Math.random()
  const theta = 2 * Math.PI * u
  const phi = Math.acos(2 * v - 1)

  p.x = position.x + radius * Math.sin(phi) * Math.cos(theta)

  p.y = is2D
    ? position.y
    : position.y + radius * Math.sin(phi) * Math.sin(theta)

  p.z = position.z + radius * Math.cos(phi)

  return p
}
