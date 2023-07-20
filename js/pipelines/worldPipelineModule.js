import Box from '../classes/Box'
import Lights from '../classes/Lights'
import FlowerGeneration from '../classes/FlowerGeneration'
import ParticlesSystem from '../classes/ParticlesSystem'

export const initWorldPipelineModule = () => {
  const init = () => {
    // Box.init()
    Lights.init()
    ParticlesSystem.init()
    FlowerGeneration.init()

    console.log('✨', 'World ready')
  }

  const render = () => {
    ParticlesSystem?.update()
    FlowerGeneration.update()
  }

  return {
    name: 'world-content',

    onStart: () => init(),

    onRender: () => render(),
  }
}
