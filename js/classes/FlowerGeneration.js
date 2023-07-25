import * as THREE from 'three'

import gsap from 'gsap'

import { MeshLineGeometry, MeshLineMaterial, raycast } from 'meshline'

import { createNoise2D, createNoise3D } from 'simplex-noise'
import { getRandomSpherePoint } from '../utils/maths'

import DebugTweakpane from './DebugTweakpane'

function easeInExpo(t, b, c, d) {
  return t == 0 ? b : c * Math.pow(2, 10 * (t / d - 1)) + b
}

function easeOutExpo(t, b, c, d) {
  return t == d ? b + c : c * (-Math.pow(2, (-10 * t) / d) + 1) + b
}

function easeInOutExpo(t, b, c, d) {
  if (t == 0) return b
  if (t == d) return b + c
  if ((t /= d / 2) < 1) return (c / 2) * Math.pow(2, 10 * (t - 1)) + b
  return (c / 2) * (-Math.pow(2, -10 * --t) + 2) + b
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

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
  ////////////////////////////////////////////////////////////////////////

  setupLines() {
    this.meshes = []
    this.meshGroup = new THREE.Group()

    // this.meshGroup.scale.multiplyScalar(0.1)
    // this.meshGroup.position.y = 2.5
    // this.meshGroup.rotateX(-Math.PI / 2)

    this.meshGroupScale = 1
    this.meshGroupScaleTarget = 1

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

  async setupTexture() {
    const textureLoader = new THREE.TextureLoader()
    this.strokeMap = await textureLoader.loadAsync('/textures/stroke.png')
  }

  ////////////////////////////////////////////////////////////////////////

  randomize() {
    this.isReady = false

    // empty out meshes array
    if (this.meshes) {
      this.meshes.length = 0
    }

    // remove all children from mesh group
    if (this.meshGroup && this.meshGroup.children.length) {
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

    console.log({ group: this.meshGroup })

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

  generateFlower() {
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

      let flowerGeometry = new THREE.BufferGeometry()
      const positions = new Float32Array(walker.path.length * 3)

      // grab each path point and push it to the flowerGeometry
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
        lineWidth: 0.09,
        sizeAttenuation: 1,
        opacity: 1,
        depthTest: false,
        transparent: true,
      })

      const ribbon = new THREE.Mesh(lineRibbonGeometry, lineRibbonMaterial)

      // create meshes for all of the stems/reflections
      for (let k = 0; k < this.stems; k++) {
        let mesh = ribbon.clone()

        mesh.rotation.z = calcMap(k, 0, this.stems, 0, Math.PI * 2)
        mesh.rotation.x = -Math.PI / 2
        mesh.position.y = 0
        mesh.scale.multiplyScalar(0.15)
        mesh.name = `flower-${k}`
        mesh.castShadow = true

        // TODO TWEEN on visibility value
        // mesh.material.uniforms.opacity.value = 1
        mesh.material.uniforms.visibility.value = 0

        this.flowers.push(mesh)

        this.meshes.push(mesh)
        this.meshGroup.add(mesh)
      }
    }
  }

  generateStem() {
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
    const v3 = new THREE.Vector3(0, 4, 0)

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
      transparent: true,
    })
    stemLineMaterial.uniforms.visibility.value = 0

    const stem = new THREE.Mesh(lineStemGeometry, stemLineMaterial)
    stem.castShadow = true
    stem.name = 'stem'

    this.stem = stem

    this.meshGroup.add(stem)
  }

  grow() {
    gsap.to(this.stem.material.uniforms.visibility, {
      value: 1,
      duration: 10,
      ease: 'power3.out',
      onComplete: () => {
        console.log(this.stemLineMaterial.uniforms)
      },
    })

    this.flowers.forEach((f) => {
      gsap.to(f.material.uniforms.visibility, {
        value: 1,
        duration: 15,
        ease: 'power3.out',
      })
      gsap.to(f.position, {
        y: 4,
        duration: 10,
        ease: 'power3.out',
      })
    })
  }

  generate() {
    this.generateFlower()

    this.generateStem()

    this.grow()

    this.isReady = true
  }

  ////////////////////////////////////////////////////////////////////////

  bind() {
    this.randomize = this.randomize.bind(this)
  }

  async init() {
    this.bind()

    this.isReady = false

    this.flowers = []
    this.stem = null

    const { scene } = XR8.Threejs.xrScene()
    this.scene = scene

    this.folderGenerate = DebugTweakpane.addFolder({ title: 'Flower' })

    try {
      await this.setupTexture()

      this.setupLines()

      this.generate()
    } catch (error) {
      console.log({ error })
    }

    const resetBtn = this.folderGenerate.addButton({
      title: 'randomize',
      label: 'generate',
    })
    resetBtn.on('click', this.randomize)

    // test
    // const box = new THREE.Mesh(
    //   new THREE.BoxGeometry(1, 1, 1),
    //   new THREE.MeshNormalMaterial()
    // )
    // box.position.set(0, 0, 0)
    // this.meshGroup.add(box)
  }

  update() {
    const time = performance.now() / 1000

    if (this.meshGroup) {
      this.meshGroup.rotation.y += 0.005
      this.meshGroup.position.y = Math.sin(time) * 0.1
    }
  }
}

const FlowerGeneration = new _FlowerGeneration()
export default FlowerGeneration
