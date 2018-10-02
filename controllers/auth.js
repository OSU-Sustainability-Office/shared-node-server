require('dotenv').config()

const express = require('express')
const router = express.Router()
const httpreq = require('httpreq')
const db = require('../ddb.js')
const DomParser = require('dom-parser')
db.initialize()

// How CAS login works:
//  1. User clicks login button and is redirected to /login route with return URI
//  2. Node server initiates a user session and redirects the user to the CAS login page
//  3. User logs in using ONID credentials
//  4. CAS redirects user back to /login/verify
//  5. Node server verifies login token with CAS and receives user information
//  6. Session is fully initialized, and the user is redirected back to the return URI

// User initiates login
router.get('/login', function (req, res) {

  // Re initialize session object
  req.session.regenerate(err => {
    res.status(404).send('Error 3: Could not regenerate session.')
  })

  // HTTP GET requests will use URI parameters
  if (req.query.returnURI) {
    req.session.returnURI = req.query.returnURI
  } else {
    req.session.returnURI = 'http://carbon.campusops.oregonstate.edu/'
  }
  if (process.env.CAS_DEV === 'true') {
    req.session.firstName = process.env.CAS_DEV_NAME
    req.session.primaryAffiliation = process.env.CAS_DEV_AFFILIATION
    req.session.UserID = process.env.CAS_DEV_USER
    db.getUser(req.session.UserID).catch((rej) => {
      console.log('Adding ' + req.session.UserID + ' to db.')
      db.updateUser({
        onid: req.session.UserID,
        firstName: req.session.firstName,
        primaryAffiliation: req.session.primaryAffiliation
      })
      console.log('User added.')
      res.redirect(req.session.returnURI)
    }).then((data) => {
      res.redirect(req.session.returnURI)
    })
  } else {
    res.redirect('https://login.oregonstate.edu/cas-dev/login?service=' + process.env.CAS_APPLICATION_URL)
  }
})

// User logs in successfully and is redirected back to this route
router.get('/session', function (req, res) {
  // Complete login handshake
  httpreq.get('https://login.oregonstate.edu/idp-dev/profile/cas/serviceValidate?ticket=' + req.query.ticket + '&service=' + process.env.CAS_APPLICATION_URL, (err, r) => {
    if (err) return console.log(err)
    if (r.body.includes('Success')) {
      // Parse xml into user variables
      let parser = new DomParser()
      let doc = parser.parseFromString(r.body)

      // Set session variables
      req.session.firstName = doc.getElementsByTagName('cas:firstname')[0].childNodes[0].textContent
      req.session.primaryAffiliation = doc.getElementsByTagName('cas:eduPersonPrimaryAffiliation')[0].childNodes[0].textContent
      req.session.UserID = doc.getElementsByTagName('cas:uid')[0].childNodes[0].textContent

      // If this user has not been added to the database, add them.
      db.getUser(req.session.UserID).catch((rej) => {
        console.log('Adding ' + req.session.UserID + ' to db.')
        db.updateUser({
          onid: req.session.UserID,
          firstName: req.session.firstName,
          primaryAffiliation: req.session.primaryAffiliation
        })
        console.log('User added.')
        res.redirect(req.session.returnURI)
      }).then((data) => {
        res.redirect(req.session.returnURI)
      })
    } else {
      res.status(404).send('Error 1: Login failed. Please try again.')
    }
  })
})

router.get('/userData/:dataToGet', function (req, res) {
  // I was going to cache all user data in the user's session to prevent duplicate database queries; however, the session itself is stored in the database. Therefore, retrieving the user's session requires a database query, negating any benefits that can be derived from caching the user's data in the session. -JW

  // Retrieve the user's data from the database
  db.getUser(req.session.UserID).then(function (data) {

    // Respond to the HTTP request with the data requested.
    res.status(200)
    if (req.params.dataToGet === 'allData') {
      res.send(data)
    } else {
      res.send(data[req.params.dataToGet])
    }
  }).catch((rej) => {
    res.status(404).send('Error 0: ' + req.params.dataToGet + ' did not match any columns in the database for ' + req.session.UserID + '.')
    console.log(rej)
  })
})

router.get('/logout', (req, res) => {
  req.session.destroy(function(err) {
    console.log(err)
    if (err)
      res.status(404).send('Error 2: Logout failed.')
    else
      res.status(200).send('Logged out!')  
  })
})

module.exports = router
