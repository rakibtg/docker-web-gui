const { Terminal } = require('../utilities/terminal')
const { lightImageDetail } = require('../utilities/lightImageDetail')

exports.fetch = async (req, res) => {
  const images = await Terminal(
    `docker images --format '{"ID": "{{.ID}}", "Tag": "{{.Tag}}", "CreatedSince": "{{.CreatedSince}}", "Size": "{{.Size}}", "VirtualSize": "{{.VirtualSize}}", "Repository": "{{.Repository}}"}'`
  )
  const imagesArray = images
    .split("\n")
    .filter(image => image !== '')
    .map(image => JSON.parse(image))
  res.json(imagesArray)
}

exports.command = async (req, res, next) => {
  const imageID = req.query.image
  const command = req.query.command
  let cmd = `docker image ${command} ${imageID}`
  if(command == 'run') {
    cmd = `docker ${command} ${imageID}`
  }
  
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