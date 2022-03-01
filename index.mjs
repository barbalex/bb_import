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

// 1. import event
const rawEvents = await bb.list({ type: 'events', include_docs: true })
const events = rawEvents.rows.map((e) => {
  const dat = e.id.substr(7, 17)
  return {
    id: e.id,
    datum: `${dat.substr(0, 4)}-${dat.substr(5, 2)}-${dat.substr(8, 2)}`,
    title: e.doc.title,
    links: e.doc.links,
    event_type: e.doc.eventType,
    tags: e.doc.tags,
  }
})
//console.log('rawEvents:', rawEvents)
console.log('events:', events)

// 2. import article

// 3. import monthly_event

// 4. import page

// 4. import publication
