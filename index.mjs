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

// 1. fetch all docs with valid date
const result = await bb.list({ type: 'events', include_docs: true })
const rows = result.rows
  .map((r) => r.doc)
  .filter((e) => !e._id.includes('Invalid date'))

// 1. import event
const events = rows
  .filter((r) => r.type === 'events')
  .map((e) => {
    const dat = e._id.substr(7, 17)

    return {
      datum: `${dat.substr(0, 4)}-${dat.substr(5, 2)}-${dat.substr(8, 2)}`,
      title: e.title,
      links: e.links.filter((l) => !!l.url),
      event_type: e.eventType,
      tags: e.tags,
    }
  })
//console.log('events:', events)

events.forEach((e) => {
  pgClient.query(
    `insert into event(datum, title, links, event_type, tags) values($1, $2, $3, $4, $5)`,
    [
      e.datum,
      e.title,
      e.links?.length ? JSON.stringify(e.links) : null,
      e.event_type,
      e.tags?.length ? JSON.stringify(e.tags) : null,
    ],
  )
})

// 2. import article

// 3. import monthly_event

// 4. import page

// 4. import publication
