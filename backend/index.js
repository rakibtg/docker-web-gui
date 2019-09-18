const express = require('express')
const cors = require('cors')
const app = express()
const port = 3230

app.use(express.json())
app.use(cors())

// Boot database.
const db = require('./utilities/db')
db.boot()

const { DefaultController } = require('./controllers/DefaultController')
const { GenericCommandController } = require('./controllers/GenericCommandController')
const ContainerController = require('./controllers/ContainerController')
const ImageController = require('./controllers/ImageController')
const GroupController = require('./controllers/GroupController')

app.get('/', DefaultController)
app.get('/api/generic', GenericCommandController)

app.get('/api/container/fetch', ContainerController.fetch)
app.get('/api/container/fetchById', ContainerController.fetchById)
app.get('/api/container/command', ContainerController.command)
app.get('/api/container/logs', ContainerController.logs)
app.get('/api/container/stats', ContainerController.stats)

app.get('/api/image/fetch', ImageController.fetch)
app.get('/api/image/command', ImageController.command)

app.post('/api/groups', GroupController.create)
app.get('/api/groups', GroupController.fetch)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))