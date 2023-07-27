import * as THREE from 'three'

import gsap from 'gsap'

import { MeshLineGeometry, MeshLineMaterial, raycast } from 'meshline'

import { createNoise2D } from 'simplex-noise'
import { getRandomSpherePoint } from '../utils/maths'

const calcMap = (value, inputMin, inputMax, outputMin, outputMax) => {
  return (
    ((value - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) +
    outputMin
  )
}

class FlowerPart {
  constructor(config) {
    this.noise2D = config.noise2D
    this.total = config.total
    this.x = config.x
    this.y = config.y
    this.dir = config.dir
    this.speed = config.speed
    this.delta = config.delta
    this.time = config.time
    this.angleRange = config.angleRange
    this.away = config.away
    this.depth = config.depth

    this.position = new THREE.Vector3(this.x, this.y, 0)
    this.path = []

    this.build()
  }

  build() {
    for (let i = 0; i < this.total; i++) {
      this.step(i / this.total)
    }
  }

  step(p) {
    // progress the time for noise
    this.time += this.delta

    // get noise values for angle and speed
    this.angle = calcMap(
      this.noise2D(this.time, 0),
      -1,
      1,
      -this.angleRange,
      this.angleRange
    )
    this.speed = calcMap(this.noise2D(this.time, 1000), -1, 1, 0, 0.01)

    // apply noise values
    this.dir += this.angle
    this.position.x += Math.cos(this.dir) * this.speed
    this.position.y += Math.sin(this.dir) * this.speed

    // grow away or toward the camera
    if (this.away) {
      this.position.z = calcMap(p, 0, 1, this.depth / 2, -this.depth / 2)
    } else {
      this.position.z = calcMap(p, 0, 1, -this.depth / 2, this.depth / 2)
    }

    // push new position into the path array
    this.path.push({
      x: this.position.x,
      y: this.position.y,
      z: this.position.z,
    })
  }
}

class _FlowerGeneration {
  ////////////////////////////////////////////////////////////////////////

  async setupTexture() {
    const textureLoader = new THREE.TextureLoader()
    this.strokeMap = await textureLoader.loadAsync('/textures/stroke.png')
  }

  ////////////////////////////////////////////////////////////////////////

  clear() {
    if (this.meshGroup && this.meshGroup.children.length) {
      this.meshGroup.children.forEach((child) => {
        child.userData.flowers.length = 0
        while (child.children.length) {
          child.remove(child.children[0])
        }
      })
    }
  }

  randomize() {
    // remove all children from mesh group
    this.clear()

    this.manyFlowers()
  }

  generateFlower(flowerGroup) {
    const flowers = []
    const noise2D = createNoise2D()

    this.count = 8
    this.stems = 8
    this.edge = 8

    for (let i = 0; i < this.count; i++) {
      // setup a new flowerPart
      let centered = Math.random() > 0.5

      let flowerPart = new FlowerPart({
        noise2D: noise2D,
        total: 3000,
        x: centered ? 0 : THREE.MathUtils.randFloat(-1, 1),
        y: centered ? 0 : THREE.MathUtils.randFloat(-1, 1),
        dir: (i / this.count) * ((Math.PI * 2) / this.stems),
        speed: 0,
        delta: 0.0003,
        angleRange: 0.01,
        away: 0,
        depth: 6,
        time: i * 1000,
      })

      let flowerGeometry = new THREE.BufferGeometry()
      const positions = new Float32Array(flowerPart.path.length * 3)

      // grab each path point and push it to the flowerGeometry
      for (let j = 0, len = flowerPart.path.length; j < len; j++) {
        let p = flowerPart.path[j]
        let x = p.x
        let y = p.y
        let z = p.z

        this.edge = Math.max(this.edge, Math.abs(x), Math.abs(y))

        positions[j * 3] = x
        positions[j * 3 + 1] = y
        positions[j * 3 + 2] = z
      }
      flowerGeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      )

      const lineRibbonGeometry = new MeshLineGeometry()
      lineRibbonGeometry.setPoints(flowerGeometry)

      const lineRibbonMaterial = new MeshLineMaterial({
        useMap: true,
        map: this.strokeMap,
        color: new THREE.Color(
          `hsl(${
            360 * Math.random() + 300 + calcMap(i, 0, this.count, -350, 350)
          }, 100%, ${74}%)`
        ),
        lineWidth: 0.25,
        depthTest: false,
        sizeAttenuation: 1,
        opacity: 1,
        transparent: true,
      })

      const ribbon = new THREE.Mesh(lineRibbonGeometry, lineRibbonMaterial)

      // create meshes for all of the stems/reflections
      for (let k = 0; k < this.stems; k++) {
        let mesh = ribbon.clone()

        mesh.rotation.z = calcMap(k, 0, this.stems, 0, Math.PI * 2)
        mesh.rotation.x = -Math.PI / 2
        mesh.position.y = 0
        mesh.name = `flower-${k}`
        // mesh.castShadow = true
        mesh.scale.set(0, 0, 0)

        // mesh.material.uniforms.opacity.value = 0
        mesh.material.uniforms.visibility.value = 0

        flowers.push(mesh)
        flowerGroup.add(mesh)
      }
    }

    return flowers
  }

  generateStem(flowerGroup, growHeight) {
    // Start with a base hue of 120 (green) and adjust it slightly.
    let h = 120 + (Math.random() * 20 - 10)
    // Keep saturation somewhat high (30-60) to ensure the color stays green.
    let s = 30 + Math.random() * 30
    // Keep lightness in the upper half of the range (50-80) to ensure the color isn't too dark.
    let l = 50 + Math.random() * 30

    // stem color
    const stemColor = `hsl(${h},${s}%,${l}%)`

    const stemMaterial = new THREE.LineBasicMaterial({
      color: stemColor,
      // color: '#0fbf7f',
      linewidth: 2,
    })

    const stemGeometry = new THREE.BufferGeometry()

    const v0 = new THREE.Vector3(0, 0, 0)
    const v1 = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      Math.random() * 2, //
      (Math.random() - 0.5) * 0.5
    )
    const v2 = new THREE.Vector3(
      (Math.random() - 0.5) * 1,
      Math.random() * 4,
      (Math.random() - 0.5) * 1
    )
    const v3 = new THREE.Vector3(0, growHeight, 0)

    const curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3)
    const points = curve.getPoints(80)
    const positions = new Float32Array(points.length * 3)

    // Add spiral effect to the stem
    const spiralFrequency = Math.random() * 0.15 + 0.15 // Randomly adjust the frequency of the spiral
    const spiralAmplitude = Math.random() * 0.15 + 0.15 // Randomly adjust the amplitude of the spiral

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

    const lineStemGeometry = new MeshLineGeometry()
    lineStemGeometry.setPoints(stemGeometry)

    const stemLineMaterial = new MeshLineMaterial({
      useMap: true,
      map: this.strokeMap,
      color: stemMaterial.color,
      lineWidth: 0.25,
      sizeAttenuation: 1,
      opacity: 1,
      // depthTest: false,
      transparent: true,
    })
    stemLineMaterial.uniforms.visibility.value = 0

    const stem = new THREE.Mesh(lineStemGeometry, stemLineMaterial)
    // stem.castShadow = true
    stem.name = 'stem'

    flowerGroup.add(stem)
    return stem
  }

  grow(flowers, stem, growHeight, growSpeed) {
    gsap.to(stem.material.uniforms.visibility, {
      value: 1,
      duration: growSpeed - growHeight / growSpeed,
      ease: 'power3.out',
    })

    flowers.forEach((f) => {
      gsap.to(f.material.uniforms.visibility, {
        value: 1,
        duration: 10,
        ease: 'power3.out',
        // onComplete: () => {
        //   f.material.depthTest = true
        // },
      })

      gsap.to(f.position, {
        y: growHeight,
        duration: growSpeed,
        ease: 'power3.out',
      })
      gsap.to(f.scale, {
        x: 0.15,
        y: 0.15,
        z: 0.15,
        duration: growSpeed + 0.5,
        ease: 'power3.out',
      })
    })
  }

  generate() {
    const flowerGroup = new THREE.Group()

    const growHeight = THREE.MathUtils.randFloat(3, 8)
    const growSpeed = THREE.MathUtils.randInt(5, 10)

    const flowers = this.generateFlower(flowerGroup)
    const stem = this.generateStem(flowerGroup, growHeight)

    this.grow(flowers, stem, growHeight, growSpeed)

    flowerGroup.userData.flowers = flowers

    this.meshGroup.add(flowerGroup)

    return flowerGroup
  }

  ////////////////////////////////////////////////////////////////////////

  bind() {
    this.randomize = this.randomize.bind(this)
  }

  async init() {
    this.bind()

    const { scene, renderer } = XR8.Threejs.xrScene()

    this.meshGroup = new THREE.Group()

    this.hasStarted = false

    this.flowers = []
    this.stem = null

    this.scene = scene
    this.scene.add(this.meshGroup)

    await this.setupTexture()

    // const canvas = renderer.domElement
    // canvas.addEventListener('click', () => {
    //   if (this.hasStarted) {
    //     this.hasStarted = true
    //     this.manyFlowers()
    //   } else {
    //     this.randomize()
    //   }
    // })
  }

  add(point, length = THREE.MathUtils.randInt(3, 10)) {
    for (let i = 0; i < length; i++) {
      const flowerGroup = this.generate()
      const spherePoint = getRandomSpherePoint(point, 5)

      const position = new THREE.Vector3(spherePoint.x, 0, spherePoint.z)

      flowerGroup.position.copy(position)
    }
  }

  manyFlowers(length = THREE.MathUtils.randInt(3, 10)) {
    for (let i = 0; i < length; i++) {
      const flowerGroup = this.generate()

      // Compute a random angle
      let angle = Math.random() * Math.PI * 2
      // Compute a random distance from the center, but no more than 5 units
      let radius = 5 * Math.sqrt(Math.random())

      // Convert polar coordinates to Cartesian coordinates
      let x = radius * Math.cos(angle)
      let z = radius * Math.sin(angle)

      // Set the flowerGroup's position
      flowerGroup.position.set(x, 0, z)
    }
  }

  update() {
    const time = performance.now() / 1000

    if (this.meshGroup) {
      this.meshGroup.children.forEach((child) => {
        child.rotation.y += 0.005
        child.position.y = Math.sin(time) * 0.1
      })
    }
  }
}

const FlowerGeneration = new _FlowerGeneration()
export default FlowerGeneration
