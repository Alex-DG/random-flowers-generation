class _Butterfly {
  async loadGLTF(source = '/models/Butterfly_ex02-v1.glb') {
    try {
      const gltfLoader = new GLTFLoader()
      const model = await gltfLoader.loadAsync(source)
      console.log({ model })
    } catch (error) {
      console.log('load-glb-error', { error })
    }
  }

  bind() {}

  init() {
    this.loadGLTF()
  }

  update() {}
}
const Butterfly = new _Butterfly()
export default Butterfly
