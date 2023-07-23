import * as THREE from 'three'
import { MeshLine, MeshLineMaterial } from 'three.meshline'

import { createNoise2D, createNoise3D } from 'simplex-noise'
import { getRandomSpherePoint } from '../utils/maths'

import DebugTweakpane from './DebugTweakpane'

const calcMap = (value, inputMin, inputMax, outputMin, outputMax) => {
  return (
    ((value - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) +
    outputMin
  )
}

class Walker {
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
      const stemMaterial = new THREE.MeshBasicMaterial({ color: 0x008751 }) // green

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
    const radius = 4 // Radius of the circle

    // Add flowers to the scene
    for (let i = 0; i < 15; i++) {
      const flower = this.createFlower()

      const position = getRandomSpherePoint(flower.position, radius, true)
      flower.position.copy(position)
      flower.rotation.y = Math.random() * (Math.PI * 2)
      scene.add(flower)
    }
  }

  ////////////////////////////////////////////////////////////////////////

  setupLines() {
    this.meshes = []
    this.meshGroup = new THREE.Group()

    this.meshGroup.scale.multiplyScalar(0.15)
    this.meshGroup.position.y = 2.5
    this.meshGroup.rotateX(-Math.PI / 2)

    this.meshGroupScale = 0.1
    this.meshGroupScaleTarget = 0.1

    this.scene.add(this.meshGroup)

    // folder.addInput(renderer, 'toneMappingExposure', {
    //   min: 0,
    //   max: 4,
    //   step: 0.01,
    // })

    this.folderGenerate
      .addInput({ scale: this.meshGroup.scale.x }, 'scale', {
        min: 0,
        max: 10,
        step: 0.01,
      })
      .on('change', ({ value }) => {
        this.meshGroup.scale.set(value, value, value)
      })

    // this.folderGenerate.addInput(this.meshGroup, 'scale')
    // this.folderGenerate.addInput(this.meshGroup, 'rotate')
  }

  async setupStroke() {
    const textureLoader = new THREE.TextureLoader()
    this.strokeMap = await textureLoader.loadAsync('/textures/stroke.png')
  }

  worldToScreen(vector, camera) {
    vector.project(camera)
    let cx = window.innerWidth / 2
    let cy = window.innerHeight / 2
    vector.x = vector.x * cx + cx
    vector.y = -(vector.y * cy) + cy
    return vector
  }

  reset() {
    // empty out meshes array
    if (this.meshes) {
      this.meshes.length = 0
    }

    // remove all children from mesh group
    if (this.meshGroup) {
      while (this.meshGroup.children.length) {
        this.meshGroup.remove(this.meshGroup.children[0])
      }
    }

    // initialize progres values
    this.progress = 0 // overall progress ticker
    this.progressed = false // has run once
    this.progressModulo = 0 // resets progress on modulus
    this.progressEffective = 0 // progress amount to use
    this.progressEased = 0 // eased progress

    this.generate()

    // requestAnimationFrame(() => {
    //   // scale until the flower roughly fits within the viewport
    //   let tick = 0
    //   let exit = 50
    //   let scale = 1
    //   this.meshGroup.scale.set(scale, scale, scale)
    //   let scr = this.worldToScreen(
    //     new THREE.Vector3(0, this.edge, 0),
    //     this.camera
    //   )

    //   const { camera } = XR8.Threejs.xrScene()
    //   while (scr.y < window.innerHeight * 0.2 && tick <= exit) {
    //     scale -= 0.05
    //     scr = this.worldToScreen(
    //       new THREE.Vector3(0, this.edge * scale, 0),
    //       camera
    //     )
    //     tick++
    //   }
    //   this.meshGroupScaleTarget = scale
    // })
  }

  generate() {
    const noise2D = createNoise2D()

    this.count = 8
    this.stems = 8
    this.edge = 8

    for (let i = 0; i < this.count; i++) {
      // setup a new walker/wanderer
      let centered = Math.random() > 0.5

      let walker = new Walker({
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

      let geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(walker.path.length * 3)

      // grab each path point and push it to the geometry
      for (let j = 0, len = walker.path.length; j < len; j++) {
        let p = walker.path[j]
        let x = p.x
        let y = p.y
        let z = p.z

        this.edge = Math.max(this.edge, Math.abs(x), Math.abs(y))

        positions[j * 3] = x
        positions[j * 3 + 1] = y
        positions[j * 3 + 2] = z
      }
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

      let lineMaterial = new THREE.LineBasicMaterial({
        color: new THREE.Color(
          `hsl(${
            360 * Math.random() + 300 + calcMap(i, 0, this.count, -350, 350)
          }, 100%, ${74}%)`
        ),
        linewidth: 4,
        depthTest: false,
        opacity: 1,
        transparent: true,
      })

      const lineRibbon = new MeshLine()
      lineRibbon.setGeometry(geometry)

      const lineRibbonMaterial = new MeshLineMaterial({
        useMap: true,
        map: this.strokeMap,
        color: lineMaterial.color,
        lineWidth: 0.08,
        sizeAttenuation: 1,
        opacity: 1,
        transparent: true,
        // side: THREE.DoubleSide,
        // blending: THREE.AdditiveBlending,
      })

      const ribbon = new THREE.Mesh(lineRibbon.geometry, lineRibbonMaterial)

      //   let line = new THREE.Line(geometry, lineMaterial)

      // create meshes for all of the stems/reflections
      for (let k = 0; k < this.stems; k++) {
        let mesh = ribbon.clone()
        // let mesh =  line.clone()
        mesh.rotation.z = calcMap(k, 0, this.stems, 0, Math.PI * 2)
        // mesh.rotateX(MAth.PI / 2)

        this.meshes.push(mesh)
        this.meshGroup.add(mesh)
      }
    }

    const stemMaterial = new THREE.LineBasicMaterial({
      color: 0x008126,
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

    // const stem = new THREE.Line(stemGeometry, stemMaterial)
    const stemLine = new MeshLine()
    stemLine.setGeometry(stemGeometry)

    const stemLineMaterial = new MeshLineMaterial({
      useMap: true,
      map: this.strokeMap,
      color: stemMaterial.color,
      lineWidth: 0.08,
      sizeAttenuation: 1,
      opacity: 1,
      transparent: true,
      // side: THREE.DoubleSide,
      // blending: THREE.AdditiveBlending,
    })
    const stem = new THREE.Mesh(stemLine.geometry, stemLineMaterial)

    this.meshGroup.add(stem)
  }

  ////////////////////////////////////////////////////////////////////////

  bind() {
    this.reset = this.reset.bind(this)
  }

  async init() {
    this.bind()

    // this.flowers = []
    // this.stems = []
    // this.addFlowers()
    const { scene } = XR8.Threejs.xrScene()
    this.scene = scene

    this.folderGenerate = DebugTweakpane.addFolder({ title: 'Flower' })

    try {
      await this.setupStroke()
      this.setupLines()
      this.generate()
    } catch (error) {
      console.log({ error })
    }

    const resetBtn = this.folderGenerate.addButton({
      title: 'reset',
      label: 'generate',
    })
    resetBtn.on('click', this.reset)
  }

  update() {
    // const time = performance.now()
    // this.flowers?.forEach((f) => {
    //   const offset = f.userData.offset
    //   f.position.z = (Math.sin(time * 0.00025) * offset) / 3
    //   //   f.position.z = f.position.z + Math.sin(time * 0.05) * 0.05
    // })

    if (this.meshGroup) {
      this.meshGroup.rotation.z += 0.01
    }
  }
}

const FlowerGeneration = new _FlowerGeneration()
export default FlowerGeneration
