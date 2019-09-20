const path = require('path')

exports.DefaultController = (req, res) => {
  res.sendFile(path.join(__dirname + '/../web/index.html'))
}