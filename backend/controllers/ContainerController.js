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
  let results = []
  await Promise.all(containers.map(async container => {
    const weAreTheFortunateOne = await Terminal('docker container inspect '+container)
    const tintContainer = JSON.parse(weAreTheFortunateOne)[0]
    if(status === 'active') {
      if(tintContainer.State.Running === true) results.push(lightContainerDetail(container, tintContainer))
    } else if(status === 'all') {
      results.push(lightContainerDetail(container, tintContainer))
    } else if(status === 'stopped') {
      if(tintContainer.State.Running !== true) results.push(lightContainerDetail(container, tintContainer))
    }
  }))
  res.json(results.sort((a, b) => (a.Name > b.Name) ? 1 : -1))
}

exports.fetchById = async (req, res) => {
  const containerID = req.query.container
  const containerInspect = await Terminal('docker container inspect ' + containerID)
  const container = lightContainerDetail(containerID, JSON.parse(containerInspect)[0])
  res.json(container)
}

exports.command = async (req, res, next) => {
  const containerID = req.query.container
  const command = req.query.command
  const cmd = `docker container ${command} ${containerID}`
  try{
    const cmdData = await Terminal(cmd)
    res.json(
      cmdData
        .replace("\n", "")
    )
  } catch (error){
    next(error)
  }
  
}

exports.logs = async (req, res) => {
  const containerID = req.query.container
  const cmd = `docker container logs ${containerID} --tail 1500`
  const data = await Terminal(cmd)
  res.json(data)
}

exports.stats = async (req, res) => {
  const cmd = `docker container stats --no-stream --format '{"id": "{{.ID}}", "cpu_percentage": "{{.CPUPerc}}", "memory_usage": "{{.MemUsage}}", "network_io": "{{.NetIO}}"}'`
  const cmdStats = await Terminal(cmd)
  const statsArray = cmdStats
    .split("\n")
    .filter(container => container !== '')
    .map(stat => JSON.parse(stat))
  res.json(statsArray)
}