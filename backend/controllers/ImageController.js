const { Terminal } = require('../utilities/terminal')
const { lightImageDetail } = require('../utilities/lightImageDetail')

exports.fetch = async (req, res) => {
  const images = await Terminal(
    `docker image ls -a --format '{"ID": "{{.ID}}", "CreatedSince": "{{.CreatedSince}}", "Size": "{{.Size}}", "VirtualSize": "{{.VirtualSize}}", "Repository": "{{.Repository}}"}'`
  )
  const imagesArray = images
    .split("\n")
    .filter(image => image !== '')
    .map(image => JSON.parse(image))
  res.json(imagesArray)


  // const rawImages = await Terminal('docker image ls -a')
  // const images = rawImages
  //   .split("\n")
  //   .filter(image => image.ID !== 'IMAGE ID')
    
  // let results = []
  // await Promise.all(images.map(async image => {
  //   const singleImage = await Terminal('docker image inspect '+image.ID)
  //   const singleImageData = JSON.parse(singleImage)[0]
  //   results.push(lightImageDetail(image, singleImageData))
  // }))
  // res.json(results)
}

exports.command = async (req, res, next) => {
  const imageID = req.query.image
  const command = req.query.command
  const cmd = `docker image ${command} ${imageID}`
  
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