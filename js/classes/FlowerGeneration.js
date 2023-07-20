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

      for (let i = 0; i < 10 * Math.PI; i += 0.008) {
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

      ///////////
      // Create stem
      const stemMaterial = new THREE.MeshBasicMaterial({ color: 0x008000 }) // green

      // Define parameters for the stem
      const stemRadius = 0.02 // Radius of the stem
      const stemSegments = 64 / 8 // Number of segments for the stem geometry
      const stemHeight = 3 // Height of the stem

      // Generate the points for the bend or spiral effect
      const generateBendOrSpiralPoints = () => {
        const points = []

        const bendAmplitude = 0.1 // Amplitude of the stem bend or spiral
        const bendFrequency = Math.random() * 0.1 + 0.1 // Frequency of the stem bend or spiral
        const hasBendOrSpiral = Math.random() < 0.5 // Randomly determine if there will be a bend or a spiral

        for (let i = 0; i < stemSegments; i++) {
          const t = i / (stemSegments - 1)
          const angle = Math.random() * Math.PI * 2
          const radius = i / (stemSegments - 1)
          let x = Math.cos(angle) * radius * bendAmplitude
          let y = (i / (stemSegments - 1)) * stemHeight
          let z = Math.sin(angle) * radius * bendAmplitude

          if (hasBendOrSpiral) {
            const bendOffset =
              Math.sin(t * bendFrequency * Math.PI) * bendAmplitude

            x += Math.cos(angle) * bendOffset
            z += Math.sin(angle) * bendOffset
          }

          points.push(new THREE.Vector3(x, y, z))
        }

        return points
      }

      // Create the stem geometry
      const stemGeometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(generateBendOrSpiralPoints()),
        stemSegments,
        stemRadius,
        4,
        false
      )

      const stem = new THREE.Mesh(stemGeometry, stemMaterial)

      // Update flower position on top of its steam
      flower.position.y += stemHeight

      // Create center sphere
      const sphereRadius = Math.random() * 0.2 + 0.1
      const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 8, 8)
      const sphereMaterial = new THREE.MeshBasicMaterial({
        color: flowerMaterial.color,
        wireframe: true,
      })
      const centerSphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
      flower.add(centerSphere)
      //   flower.add(stem)

      // Create group and add flower and stem to it
      const group = new THREE.Group()
      group.add(flower)
      group.add(stem)

      flower.userData = { offset: Math.random() }
      this.flowers.push(flower)

      return group
    } catch (error) {
      console.log({ error })
    }
  }

  addFlowers() {
    const { scene } = XR8.Threejs.xrScene()
    const centerX = 0 // X-coordinate of the center of the circle
    const centerY = 0 // Y-coordinate of the center of the circle
    const radius = 5 // Radius of the circle

    // Add flowers to the scene
    for (let i = 0; i < 20; i++) {
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
      f.position.z = (Math.sin(time * 0.00025) * offset) / 3
      //   f.position.z = f.position.z + Math.sin(time * 0.05) * 0.05
    })
  }
}

const FlowerGeneration = new _FlowerGeneration()
export default FlowerGeneration
