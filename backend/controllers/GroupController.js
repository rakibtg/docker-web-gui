const db = require('../utilities/db')

exports.create = async (req, res) => {

  const {
    name, containers
  } = req.body

  const response = await db.newGroup({name, containers})
  res.json(response)
}