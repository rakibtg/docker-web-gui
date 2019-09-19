const fs = require('fs')
const resolve = require('path').resolve
const knexLibrary = require('knex')
const write = require('write')
const fileExists = require('file-exists')

exports.dbSource = resolve(__dirname+'/../data.db')

exports.knex = knexLibrary({
  client: 'sqlite3',
  connection: {
    filename: this.dbSource
  },
  useNullAsDefault: true
})

exports.boot = () => {
  fileExists(this.dbSource)
    .then( async exists => {
      if( !exists ) {
        // Create the file.
        await write(this.dbSource, '')
        // Create tables.
        await this.knex.schema.createTable('groups', function (table) {
          table.increments()
          table.string('name')
          table.text('containers_id')
          table.timestamps()
        })
      }
    })
}

exports.newGroup = ({name, containers}) => {
  return this.knex('groups').insert({
    name, 
    containers_id: JSON.stringify(containers),
    created_at: this.knex.fn.now(),
    updated_at: this.knex.fn.now(),
  })
}

exports.deleteGroup = id => {
  return this.knex('groups').where('id', id).del()
}

exports.getGroups = () => {
  return this.knex('groups')
    .select()
    .orderBy('id', 'desc')
}

exports.getGroupById = id => this.knex('groups')
  .select()
  .where('id', id)