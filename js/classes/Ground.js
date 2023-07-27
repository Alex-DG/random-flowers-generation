import * as THREE from 'three'
import FlowerGeneration from './FlowerGeneration'

class _Ground {
  setSurface() {
    const shadowMaterial = new THREE.ShadowMaterial({
      opacity: 0.5,
    })
    // const testMaterial = new THREE.MeshNormalMaterial({ wireframe: true })

    const surface = new THREE.Mesh(
      new THREE.PlaneGeometry(32, 32, 8, 8),
      shadowMaterial
    )
    surface.rotateX(-Math.PI / 2)
    surface.position.set(0, 0, 0)
    // surface.receiveShadow = true

    this.scene.add(surface)
    this.surface = surface
  }

  setTouchEvent() {
    const { renderer } = XR8.Threejs.xrScene()
    const canvas = renderer.domElement

    canvas.addEventListener('touchstart', this.onTouchStart)
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  placeObject(event) {
    const { camera } = XR8.Threejs.xrScene()

    this.tapPosition.x = (event.touches[0].clientX / window.innerWidth) * 2 - 1
    this.tapPosition.y =
      -(event.touches[0].clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.tapPosition, camera)

    const intersects = this.raycaster.intersectObject(this.surface)

    if (intersects.length === 1 && intersects[0].object === this.surface) {
      const { point } = intersects[0]
      FlowerGeneration.add(point)
    } else {
      console.log('No surface found!')
    }
  }

  onTouchStart(event) {
    if (event.touches.length === 1) {
      this.placeObject(event)
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  bind() {
    this.onTouchStart = this.onTouchStart.bind(this)
  }

  init() {
    this.bind()

    this.raycaster = new THREE.Raycaster()
    this.tapPosition = new THREE.Vector2()

    const { scene } = XR8.Threejs.xrScene()
    this.scene = scene

    this.setTouchEvent()
    this.setSurface()
  }
}
const Ground = new _Ground()
export default Ground
