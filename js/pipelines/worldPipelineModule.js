import { Clock } from 'three'

import Lights from '../classes/Lights'
import FlowerGeneration from '../classes/FlowerGeneration'
import ParticlesSystem from '../classes/ParticlesSystem'
import Ground from '../classes/Ground'
import Butterflies from '../classes/Butterflies'

export const initWorldPipelineModule = () => {
  const clock = new Clock()

  const init = () => {
    Lights.init()

    Butterflies.init()
    Ground.init()
    ParticlesSystem.init()
    FlowerGeneration.init()

    console.log('✨', 'World ready')
  }

  const render = () => {
    const deltaTime = clock.getDelta()
    const elapsedTime = clock.getElapsedTime()

    Butterflies?.update(elapsedTime, deltaTime)
    ParticlesSystem?.update(elapsedTime)
    FlowerGeneration.update(elapsedTime)
  }

  return {
    name: 'world-content',

    onStart: () => init(),

    onRender: () => render(),
  }
}
