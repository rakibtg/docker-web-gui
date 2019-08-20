const express = require('express')
const app = express()
const port = 3230

const { DefaultController } = require('./controllers/DefaultController')
const { GenericCommandController } = require('./controllers/GenericCommandController')

app.get('/', DefaultController)
app.get('/api/generic', GenericCommandController)

app.listen(port, () => console.log(`Example app listening on port ${port}!`))