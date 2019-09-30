const db = require('../utilities/db')

exports.create = async (req, res) => {

  const {
    name, containers
  } = req.body

  const response = await db.newGroup({name, containers})
  res.json(response)
}

exports.fetch = async (req, res) => {
  const response = await db.getGroups()
  res.json(response)
}

exports.delete = async (req, res) => {
  const { id } = req.body
  await db.deleteGroup(id)
  res.json([])
}