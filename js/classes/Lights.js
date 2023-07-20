import * as THREE from 'three'

class Lights {
  setDirectionalLight() {
    const directionalLight = new THREE.DirectionalLight('#ffffff', 5.5)
    directionalLight.position.set(4, 3, 10)

    directionalLight.shadow.mapSize.width = 1024 // default
    directionalLight.shadow.mapSize.height = 1024 // default
    directionalLight.shadow.camera.near = 0.5 // default
    directionalLight.shadow.camera.far = 500 // default
    directionalLight.castShadow = true

    const directionalLight2 = new THREE.DirectionalLight('#ffffff', 1)
    directionalLight2.position.set(0, 0, 2)

    // directionalLight2.shadow.mapSize.width = 1024  // default
    // directionalLight2.shadow.mapSize.height = 1024  // default
    // directionalLight2.shadow.camera.near = 0.5  // default
    // directionalLight2.shadow.camera.far = 500  // default
    // directionalLight2.castShadow = true

    this.scene.add(directionalLight)
    this.scene.add(directionalLight2)
  }

  setAmbientLight() {
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.8)

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
