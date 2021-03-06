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

await pgClient.query('truncate event')
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
// set tags_sort
await pgClient.query(`UPDATE event SET tags_sort = 1 WHERE tags ? 'statistics'`)
await pgClient.query(
  `UPDATE event SET tags_sort = 2 WHERE tags ? 'monthlyStatistics'`,
)
await pgClient.query(`UPDATE event SET tags_sort = 3 WHERE tags ? 'victims'`)
await pgClient.query(
  `UPDATE event SET tags_sort = 4 WHERE tags ? 'highlighted'`,
)
await pgClient.query(`UPDATE event SET tags_sort = 5 WHERE tags ? 'weather'`)

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

await pgClient.query('truncate article')
for (const e of articles) {
  await pgClient.query(
    `insert into article(datum, title, content, draft) values($1, $2, $3, $4)`,
    [e.datum, e.title, e.content, e.draft],
  )
}

// 3. import page
const pages = rows
  // TODO: import only needed pages > check if more than aboutUs is needed
  .filter((r) => r.type === 'pages')
  .map((e) => ({
    id: null,
    name: e._id.replace('pages_', ''),
    content: e.article ? Base64.decode(e.article) : null,
  }))
  .filter((p) => p.name === 'aboutUs')

await pgClient.query('truncate page')
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

await pgClient.query('truncate publication')
for (const e of publications) {
  await pgClient.query(
    `insert into publication(title, category, sort, draft, content) values($1, $2, $3, $4, $5)`,
    [e.title, e.category, e.sort, e.draft, e.content],
  )
}

process.exit()
