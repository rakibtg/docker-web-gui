const fs = require('fs')
const path = require('path')
const { Terminal } = require('./backend/utilities/terminal')
const port = 3230

async function app () {
  console.clear()
  
  const BACKEND = path.resolve(__dirname + '/backend/')
  const NODE_MODULES = BACKEND + '/node_modules'

  if(!fs.existsSync(NODE_MODULES)) {
    console.log('🚀  Please wait while we install all the dependencies for you...\n')
    opt = await Terminal(`cd ${BACKEND} && npm install`)
    console.log('🎉  All dependencies added successfully!')
  }

  setTimeout(() => {
    console.log(`✨  Visit http://localhost:${port} to use Docker Web GUI`)
  }, 1500)
  await Terminal(`cd ${BACKEND} && node index.js`)

}

app()