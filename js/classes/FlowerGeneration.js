import * as THREE from 'three'
import { createNoise2D, createNoise3D } from 'simplex-noise'

class _FlowerGeneration {
  createFlower() {
    // Create the noise generator
    try {
      // Define geometry and material for the flower
      const flowerGeometry = new THREE.BufferGeometry()
      const flowerMaterial = new THREE.LineBasicMaterial({
        color: Math.random() * 0xffffff,
      })

      // Define the characteristics of the flower
      const petals = Math.round(Math.random() * 5) + 4
      const radius = Math.random()
      const height = (Math.random() - 0.5) * 2

      // Generate the flower's points
      const flowerPositions = []

      for (let i = 0; i < 4 * Math.PI; i += 0.008) {
        const p = i * petals

        const noise2D = createNoise2D()
        // const noise3D = createNoise3D()
        const r = (1 + noise2D(radius * Math.cos(p), radius * Math.sin(p))) / 2
        const x = r * Math.cos(i)
        const y = r * Math.sin(i)
        const z = height * Math.sin(i)
        flowerPositions.push(x, y, z)
      }

      flowerGeometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(flowerPositions, 3)
      )

      // Create the flower
      const flower = new THREE.Line(flowerGeometry, flowerMaterial)

      // Create stem
      const stemMaterial = new THREE.LineBasicMaterial({
        color: 0x008000,
        linewidth: 2,
      }) // green
      const stemGeometry = new THREE.BufferGeometry()
      //   stemGeometry.scale.set(2, 2, 2)

      const v0 = new THREE.Vector3(0, 0, 0)
      const v1 = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        Math.random() * -2,
        (Math.random() - 0.5) * 0.5
      )
      const v2 = new THREE.Vector3(
        (Math.random() - 0.5) * 1,
        Math.random() * -4,
        (Math.random() - 0.5) * 1
      )
      const v3 = new THREE.Vector3(0, -5, 0)

      const curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3)
      const points = curve.getPoints(50)
      const positions = new Float32Array(points.length * 3)

      // Add spiral effect to the stem
      const spiralFrequency = Math.random() * 0.15 + 0.15 // Randomly adjust the frequency of the spiral
      const spiralAmplitude = Math.random() * 0.1 + 0.1 // Randomly adjust the amplitude of the spiral

      for (let i = 0; i < points.length; i++) {
        const spiralOffset = Math.sin(i * spiralFrequency) * spiralAmplitude
        positions[i * 3 + 0] = points[i].x + spiralOffset
        positions[i * 3 + 1] = points[i].y
        positions[i * 3 + 2] = points[i].z + spiralOffset
      }

      stemGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      )

      const stem = new THREE.Line(stemGeometry, stemMaterial)

      // Create center sphere
      const sphereGeometry = new THREE.SphereBufferGeometry(0.15, 8, 8)
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: flowerMaterial.color,
        wireframe: true,
      })
      const centerSphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      flower.add(centerSphere)

      // Create group and add flower and stem to it
      const group = new THREE.Group()
      group.add(flower)
      group.add(stem)

      flower.userData = { offset: Math.random() }
      this.flowers.push(flower)
      this.stems.push(flower)

      return group
    } catch (error) {
      console.log({ error })
    }
  }

  addFlowers() {
    const { scene } = XR8.Threejs.xrScene()
    const centerX = 0 // X-coordinate of the center of the circle
    const centerY = 0 // Y-coordinate of the center of the circle
    const radius = 10 // Radius of the circle

    // Add flowers to the scene
    for (let i = 0; i < 100; i++) {
      const flower = this.createFlower()

      // Generate random angle within a circle
      const angle = Math.random() * 2 * Math.PI

      // Generate random radius within the circle
      const randomRadius = Math.sqrt(Math.random()) * radius

      // Calculate random position within the circle
      const x = centerX + randomRadius * Math.cos(angle)
      const z = centerY + randomRadius * Math.sin(angle)

      flower.position.set(x + 1, 0, z)
      scene.add(flower)
    }
  }

  init() {
    this.flowers = []
    this.stems = []
    this.addFlowers()
  }

  update() {
    const time = performance.now()

    this.flowers?.forEach((f) => {
      const offset = f.userData.offset
      console.log(offset)
      f.position.z = (Math.sin(time * 0.0005) * offset) / 2
      //   f.position.z = f.position.z + Math.sin(time * 0.05) * 0.05
    })
  }
}

const FlowerGeneration = new _FlowerGeneration()
export default FlowerGeneration
