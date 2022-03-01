const secrets = require('./secrets.json')

const nano = require('nano')(secrets.conn_string)
const bb = nano.use('bb')

console.log('bb:', bb)
