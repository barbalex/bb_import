import { createRequire } from 'module'

import nano from 'nano'
const require = createRequire(import.meta.url) // construct the require method
const secrets = require('./secrets.json')
const mynano = nano(secrets.couch_conn)
const bb = mynano.use('bb')

const { Client } = require('pg')
const pgClient = new Client({
  password: secrets.pg_password,
  user: 'postgres',
  host: 'localhost',
  database: 'bb',
})
await pgClient.connect()

const events = await bb.list({ type: 'events' })
console.log('events:', events)
