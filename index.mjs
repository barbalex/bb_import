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
const result = await bb.list({ type: 'events', include_docs: true })
const rows = result.rows.map((r) => r.doc)
const events = rows.filter((r) => r.type === 'events')
//console.log('events:', events)
const eventsPrepared = events.map((e) => {
  const dat = e._id.substr(7, 17)

  return {
    datum: `${dat.substr(0, 4)}-${dat.substr(5, 2)}-${dat.substr(8, 2)}`,
    title: e.title,
    links: e.links,
    event_type: e.eventType,
    tags: e.tags,
  }
})
//console.log('rawEvents:', rawEvents)
console.log('eventsPrepared:', eventsPrepared)
// console.log(
//   'event datums:',
//   eventsPrepared.map((e) => e.datum),
// )
// eventsPrepared.forEach((e) => {
//   pgClient.query(
//     `insert into event(datum, title, links, event_type, tags) values($1, $2, $3, $4, $5)`,
//     [e.datum, e.title, e.links, e.event_type, e.tags],
//   )
// })

// 2. import article

// 3. import monthly_event

// 4. import page

// 4. import publication
