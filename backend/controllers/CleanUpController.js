const { Terminal } = require('../utilities/terminal')


exports.command = async (req, res, next) => {
  const pruneType = req.query.type
  let cmd = `docker ${pruneType} prune -f`
  try{
    const cmdData = await Terminal(cmd)
    res.json(cmdData)
  } catch (error){
    next(error)
  }
}