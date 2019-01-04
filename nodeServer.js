/**
 * @Author: Brogan Miner <Brogan>
 * @Date:   2018-09-28T10:43:29-07:00
 * @Email:  brogan.miner@oregonstate.edu
 * @Last modified by:   Brogan
 * @Last modified time: 2019-01-04T09:08:57-08:00
 */

// Load Amazon RDS credentials from .env file
require('dotenv').config()

const express = require('express')
const session = require('express-session')
const cors = require('cors')
const app = express()
const morgan = require('morgan')
const port = process.env.PORT ? process.env.PORT : 3000 // NOTE: Port 80 can be forwarded to 3000 on our ec2 instance
const db = require('./db') // Database                  // this command: sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
const bodyParser = require('body-parser')
const DynamoDBStore = require('dynamodb-store')

let server = null

exports.start = function (cb) {
  // Allow cross-origin resource sharing
  app.use(cors({origin: true, credentials: true}))

  // log every request to the console
  app.use(morgan('dev'))

  // Initialize body parser to parse post bodies into useful JSON
  app.use(bodyParser.urlencoded({
    extended: true
  }))

  // Parse post bodies
  app.use(bodyParser.json({limit: '50mb'})) // get information from JSON POST bodies

  // Set up session store
  var storeOptions = {
    'dynamoConfig': {
      'accessKeyId': process.env.AWS_ACCESS_KEY_ID,
      'secretAccessKey': process.env.AWS_SECRET_ACCESS_KEY,
      'region': 'us-west-2',
      'endpoint': 'http://dynamodb.us-west-2.amazonaws.com',
      'dynamodb_store_debug': true
    },
    'keepExpired': false,
    'touchInterval': 30000,
    'ttl': 600000
  }

  // Set up user sessions
  app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    store: new DynamoDBStore(storeOptions)
  }))

  // User Authentication
  app.use('/auth', require('./controllers/auth.js'))

  // Carbon-Calculator Application
  app.use('/carbon', require('./controllers/carbon.js'))

  // Energy dashboard data uploads
  app.use('/devices', require('./controllers/devices.js'))

  // Energy Dashboard API
  app.use('/energy', require('./controllers/energy.js'))

  // Connect to DB
  db.connect(function (err, connection) {
    if (err) {
      throw err
    }
    // Start the server
    server = app.listen(port, function () {
      console.log('Server listening on port:', port)
      if (cb) { cb() }
    })
  })
}

exports.close = function (cb) {
  if (server) {
    if (cb) {
      server.close(() => { cb() })
    } else {
      server.close()
    }
  }
}

if (module.id === require.main.id) {
  exports.start()
}

process.on('uncaughtException', function (exception) {
  console.log(exception)
  // Server crashes after about a day, need to see why.
})
