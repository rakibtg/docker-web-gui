const { Terminal } = require('../utilities/terminal')

exports.GenericCommandController = async (req, res) => {
  const command = `docker container ls --format '{{json .}}'` // Hard-coded for now!
  const output = await Terminal(command)
  const filtered = output.replace(/}\s*{/g, "},{")
  console.log(filtered)
  res.json(filtered)
}