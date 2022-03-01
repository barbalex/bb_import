const secrets = require('./secrets.json')

const nano = require('nano')(secrets.conn_string)
const bb = nano.use('bb')
const events = bb
  .list({ type: 'events' })
  .then((val) => console.log('event:', val))
