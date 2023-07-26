import * as THREE from 'three'

class _Ground {
  init() {
    const { scene } = XR8.Threejs.xrScene()

    const shadowMaterial = new THREE.ShadowMaterial({
      opacity: 0.5,
    })
    const normalMaterial = new THREE.MeshNormalMaterial()

    const surface = new THREE.Mesh(
      new THREE.PlaneGeometry(16, 16, 34, 34),
      shadowMaterial
    )
    surface.rotateX(-Math.PI / 2)
    surface.position.set(0, 0, 0)
    surface.receiveShadow = true

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshNormalMaterial()
    )
    box.castShadow = true
    box.position.set(0, 0, 0)

    scene.add(surface)
    // scene.add(box)

    this.surface = surface
  }
}
const Ground = new _Ground()
export default Ground
