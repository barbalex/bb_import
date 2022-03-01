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

// // 1. import event
// const events = rows
//   .filter((r) => r.type === 'events')
//   .map((e) => {
//     // events_
//     const dat = e._id.substr(7, 17)

//     return {
//       datum: `${dat.substr(0, 4)}-${dat.substr(5, 2)}-${dat.substr(8, 2)}`,
//       title: e.title,
//       links: e.links.filter((l) => !!l.url),
//       event_type: e.eventType,
//       tags: e.tags,
//     }
//   })
// //console.log('events:', events)

// events.forEach((e) => {
//   pgClient.query(
//     `insert into event(datum, title, links, event_type, tags) values($1, $2, $3, $4, $5)`,
//     [
//       e.datum,
//       e.title,
//       e.links?.length ? JSON.stringify(e.links) : null,
//       e.event_type,
//       e.tags?.length ? JSON.stringify(e.tags) : null,
//     ],
//   )
// })

// // 2. import article
// const articles = rows
//   .filter((r) => r.type === 'articles')
//   .map((e) => {
//     // commentaries_
//     const dat = e._id.substr(13, 23)

//     return {
//       datum: `${dat.substr(0, 4)}-${dat.substr(5, 2)}-${dat.substr(8, 2)}`,
//       title: e.title,
//       content: e.article,
//     }
//   })
// //console.log('articles:', articles)

// articles.forEach((e) => {
//   pgClient.query(
//     `insert into article(datum, title, content) values($1, $2, $3)`,
//     [e.datum, e.title, e.content],
//   )
// })

// // 3. import monthly_event
// const monthlyEvents = rows
//   .filter((r) => r.type === 'monthlyEvents')
//   .map((e) => {
//     // monthlyEvents_
//     const dat = e._id.substr(14, 24)

//     return {
//       datum: `${dat.substr(0, 4)}-${dat.substr(5, 2)}-28`,
//       content: e.article,
//     }
//   })
// //console.log('monthlyEvents:', monthlyEvents)

// monthlyEvents.forEach((e) => {
//   pgClient.query(`insert into monthly_event(datum, content) values($1, $2)`, [
//     e.datum,
//     e.content,
//   ])
// })

// 4. import page
const pages = rows
  .filter((r) => r.type === 'pages')
  .map((e) => {
    return {
      name: e._id.replace('pages_', ''),
      content: e.article,
    }
  })

pages.forEach((e) => {
  pgClient.query(`insert into page (name, content) values($1, $2)`, [
    e.name,
    e.content,
  ])
})

// 4. import publication
