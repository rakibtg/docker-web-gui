const express = require('express')
const cors = require('cors')
const app = express()
const port = 3230

app.use(express.json())
app.use(cors())

const { DefaultController } = require('./controllers/DefaultController')
const { GenericCommandController } = require('./controllers/GenericCommandController')
const ContainerController = require('./controllers/ContainerController')

app.get('/', DefaultController)
app.get('/api/generic', GenericCommandController)

app.get('/api/container/fetch', ContainerController.fetch)
app.get('/api/container/fetchById', ContainerController.fetchById)
app.get('/api/container/command', ContainerController.command)
app.get('/api/container/logs', ContainerController.logs)
app.get('/api/container/stats', ContainerController.stats)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))