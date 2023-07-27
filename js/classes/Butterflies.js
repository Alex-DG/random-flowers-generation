import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

import { SkeletonUtils } from '../libs/SkeletonUtils'

import * as THREE from 'three'
import { getRandomSpherePoint } from '../utils/maths'

class _Butterflies {
  async loadGLTF(source = '/models/Butterfly_ex02-v1.glb') {
    try {
      const gltfLoader = new GLTFLoader()
      const dracoLoader = new DRACOLoader()
      dracoLoader.setDecoderPath('/draco/')
      gltfLoader.setDRACOLoader(dracoLoader)

      const model = await gltfLoader.loadAsync(source)
      this.instance = model
    } catch (error) {
      console.log('load-glb-error', { error })
    }
  }

  create(point = new THREE.Vector3(), length = 1) {
    for (let i = 0; i < length; i++) {
      console.log('Add butterfly!')
      const modelCloned = SkeletonUtils.clone(this.instance.scene)

      modelCloned.traverse((child) => {
        if (child?.material) child.material.side = THREE.DoubleSide
      })

      const spherePosition = getRandomSpherePoint(point, 3)
      modelCloned.position.copy(spherePosition)
      modelCloned.scale.multiplyScalar(THREE.MathUtils.randFloat(0.025, 0.08))

      modelCloned.userData.speed = THREE.MathUtils.randFloat(0.3, 0.6)
      modelCloned.userData.spread = THREE.MathUtils.randFloat(0.02, 0.037)

      const mixer = new THREE.AnimationMixer(modelCloned)
      const action = mixer.clipAction(this.instance.animations[0])
      action.play()

      this.mixers.push(mixer)
      this.butterflies.push(modelCloned)
      this.scene.add(modelCloned)
    }

    console.log(this.butterflies)
  }

  clear() {
    this.butterflies.forEach((b) => {
      b.geometry?.dispose()
      b.material?.dispose()
      this.scene.remove(b)
    })
  }

  init() {
    const { scene } = XR8.Threejs.xrScene()

    this.butterflies = []
    this.mixers = []
    this.scene = scene
    this.loadGLTF()
  }

  update(elapsedTime, deltaTime) {
    this.mixers?.forEach((m, index) => {
      const b = this.butterflies[index]

      b.position.y +=
        Math.sin(elapsedTime * b.userData.speed) * b.userData.spread

      b.rotation.y +=
        Math.sin(elapsedTime * b.userData.speed) * b.userData.spread

      m?.update(deltaTime * 0.45)
    })
  }
}
const Butterflies = new _Butterflies()
export default Butterflies
