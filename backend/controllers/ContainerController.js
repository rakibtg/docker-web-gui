const { Terminal } = require('../utilities/terminal')
const { lightContainerDetail } = require('../utilities/lightContainerDetail')

exports.fetch = async (req, res) => {
  const rawContainersFromCmd = await Terminal('docker ps -q -a')
  const containers = rawContainersFromCmd
    .split("\n")
    .map(container => container.trim())
    .filter(container => container !== '')
  let results = {}
  await Promise.all(containers.map(async container => {
    const weAreTheFortunateOne = await Terminal('docker container inspect '+container)
    const tintContainer = JSON.parse(weAreTheFortunateOne)[0]
    if(status === 'active') {
      if(tintContainer.State.Running === true) results[container] = lightContainerDetail(container, tintContainer)
    } else if(status === 'all') {
      results[container] = lightContainerDetail(container, tintContainer)
    } else if(status === 'stopped') {
      if(tintContainer.State.Running !== true) results[container] = lightContainerDetail(container, tintContainer)
    }
  }))
}

exports.fetchById = (req, res) => {
  
}

exports.command = (req, res) => {
  
}

exports.logs = (req, res) => {
  
}

exports.stats = (req, res) => {
  
}