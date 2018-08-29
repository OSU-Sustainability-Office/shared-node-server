var express  = require('express')
var session  = require('express-session')
var cors     = require('cors')
var app      = express()
var morgan   = require('morgan')
var port     = process.env.PORT ? process.env.PORT : 3000   // NOTE: Port 80 can be forwarded to 3000 on our ec2 instance
var db       = require('./db') // Database                   // this command: sudo iptables -t nat -A PREROUTING -i eth0 -p tcp --dport 80 -j REDIRECT --to-port 3000
var bodyParser        = require('body-parser')
var CASAuthentication = require('cas-authentication');

// Load Amazon RDS credentials from .env file
require('dotenv').config()

// Allow cross-origin resource sharing
app.use(cors())

// log every request to the console
app.use(morgan('dev'))

// Parse post bodies
app.use(bodyParser.json()) // get information from JSON POST bodies

// User Authentication
app.use('/auth',require('./controllers/auth.js'))

// Carbon-Calculator Application
app.use('/carbon',require('./controllers/carbon.js'))

// Connect to DB
db.connect(function (err, connection) {
  if (err) {
    throw err
  }
  //Start the server
  app.listen(port, function () {
    console.log('Server listening on port:', port)
  })
})
