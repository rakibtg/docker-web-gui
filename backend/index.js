const express = require('express')
const app = express()
const port = 3230

const { DefaultController } = require('./controllers/DefaultController')
const { GenericCommandController } = require('./controllers/GenericCommandController')
const ContainerController = require('./controllers/ContainerController')

app.get('/', DefaultController)
app.get('/api/generic', GenericCommandController)

app.get('/api/controller/fetch', ContainerController.fetch)
app.get('/api/controller/fetchById', ContainerController.fetchById)
app.get('/api/controller/command', ContainerController.command)
app.get('/api/controller/logs', ContainerController.logs)
app.get('/api/controller/stats', ContainerController.stats)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))