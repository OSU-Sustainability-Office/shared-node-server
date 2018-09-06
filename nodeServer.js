// Load Amazon RDS credentials from .env file
require('dotenv').config()

var express  = require('express')
var session  = require('express-session')
var cors     = require('cors')
var app      = express()
var morgan   = require('morgan')
var port     = process.env.PORT ? process.env.PORT : 3000   // NOTE: Port 80 can be forwarded to 3000 on our ec2 instance
var db       = require('./db') // Database                   // this command: sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
var bodyParser = require('body-parser')
var DynamoDBStore     = require('dynamodb-store')

// Allow cross-origin resource sharing
app.use(cors())

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
  'ttl': 600000,
}

// Set up user sessions
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false,
  store: new DynamoDBStore(storeOptions)
}))

// User Authentication
app.use('/auth',require('./controllers/auth.js'))

// Carbon-Calculator Application
app.use('/carbon',require('./controllers/carbon.js'))

// Energy dashboard data uploads
app.use('/devices',require('./controllers/devices.js'))


// Connect to DB
db.connect(function (err, connection) {
  if (err) {
    throw err
  }
  // Start the server
  app.listen(port, function () {
    console.log('Server listening on port:', port)
  })
})
