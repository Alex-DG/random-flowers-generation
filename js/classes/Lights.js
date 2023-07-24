import * as THREE from 'three'

class Lights {
  setDirectionalLight() {
    const directionalLight = new THREE.DirectionalLight('#ffffff', 1)
    directionalLight.position.set(4, 3, 10)

    directionalLight.shadow.mapSize.width = 1024 // default
    directionalLight.shadow.mapSize.height = 1024 // default
    directionalLight.shadow.camera.near = 0.5 // default
    directionalLight.shadow.camera.far = 500 // default
    directionalLight.castShadow = true

    this.scene.add(directionalLight)
  }

  setAmbientLight() {
    const ambientLight = new THREE.AmbientLight('#ffffff', 1)

    this.scene.add(ambientLight)
  }

  init() {
    const { scene } = XR8.Threejs.xrScene()
    this.scene = scene

    this.setDirectionalLight()
    this.setAmbientLight()
  }
}

const instance = new Lights()
export default instance
