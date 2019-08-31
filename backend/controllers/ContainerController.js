const { Terminal } = require('../utilities/terminal')
const { lightContainerDetail } = require('../utilities/lightContainerDetail')

exports.fetch = async (req, res) => {
  const status = req.query.status
    ? req.query.status
    : 'active'
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
  res.json(results)
}

exports.fetchById = async (req, res) => {
  const containerID = req.query.container
  const containerInspect = await Terminal('docker container inspect ' + containerID)
  const container = lightContainerDetail(containerID, JSON.parse(containerInspect)[0])
  res.json(container)
}

exports.command = async (req, res) => {
  const containerID = req.query.container
  const command = req.query.command
  const cmd = `docker container ${command} ${containerID}`
  const cmdData = await Terminal(cmd)
  res.json(
    cmdData
      .replace("\n", "")
  )
}

exports.logs = (req, res) => {
  
}

exports.stats = (req, res) => {
  
}