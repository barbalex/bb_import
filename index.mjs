import { createRequire } from 'module'
import { Base64 } from 'js-base64'

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
    // events_
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

for (const e of events) {
  await pgClient.query(
    `insert into event(datum, title, links, event_type, tags) values($1, $2, $3, $4, $5)`,
    [
      e.datum,
      e.title,
      e.links?.length ? JSON.stringify(e.links) : null,
      e.event_type,
      e.tags?.length ? JSON.stringify(e.tags) : null,
    ],
  )
}

// 2. import article
const articles = rows
  .filter((r) => r.type === 'articles')
  .map((e) => {
    // commentaries_
    const dat = e._id.substr(13, 23)

    return {
      datum: `${dat.substr(0, 4)}-${dat.substr(5, 2)}-${dat.substr(8, 2)}`,
      title: e.title,
      content: e.article ? Base64.decode(e.article) : null,
      draft: e.draft === undefined ? false : e.draft,
    }
  })
//console.log('articles:', articles)

for (const e of articles) {
  await pgClient.query(
    `insert into article(datum, title, content, draft) values($1, $2, $3, $4)`,
    [e.datum, e.title, e.content, e.draft],
  )
}

// 3. import monthly_event
const monthlyEvents = rows
  .filter((r) => r.type === 'monthlyEvents')
  .map((e) => {
    // monthlyEvents_
    const dat = e._id.substr(14, 24)

    return {
      datum: `${dat.substr(0, 4)}-${dat.substr(5, 2)}-28`,
      content: e.article ? Base64.decode(e.article) : null,
    }
  })
//console.log('monthlyEvents:', monthlyEvents)

for (const e of monthlyEvents) {
  await pgClient.query(
    `insert into monthly_event(datum, content) values($1, $2)`,
    [e.datum, e.content],
  )
}

// 4. import page
const pages = rows
  // TODO: import only needed pages > check if more than aboutUs is needed
  .filter((r) => r.type === 'pages')
  .map((e) => ({
    id: null,
    name: e._id.replace('pages_', ''),
    content: e.article ? Base64.decode(e.article) : null,
  }))

for (const e of pages) {
  await pgClient.query(`insert into page (name, content) values($1, $2)`, [
    e.name,
    e.content,
  ])
}
// ensure id of aboutUs is fixed as used elsewhere
await pgClient.query(
  `update page set id = '24c9db53-6d7d-4a97-98b4-666c9aaa85c9' where name = 'aboutUs'`,
)

// 4. import publication
const publications = rows
  .filter((r) => r.type === 'publications')
  .map((e) => {
    return {
      title: e.title,
      category: e.category,
      sort: e.order,
      draft: e.draft === undefined ? false : e.draft,
      content: e.article ? Base64.decode(e.article) : null,
    }
  })
//console.log('publications:', publications)

for (const e of publications) {
  await pgClient.query(
    `insert into publication(title, category, sort, draft, content) values($1, $2, $3, $4, $5, $6)`,
    [e.title, e.category, e.sort, e.draft, e.content],
  )
}

process.exit()
