const appURL = 'http://ec2-52-39-141-177.us-west-2.compute.amazonaws.com/'

var express = require('express');
var router = express.Router();
var db = require('../ddb.js')
const https = require('https');
db.initialize()

// How CAS login works:
//  1. User clicks login button and is redirected to /login route with return URI
//  2. Node server initiates a user session and redirects the user to the CAS login page
//  3. User logs in using ONID credentials
//  4. CAS redirects user back to /login/verify
//  5. Node server verifies login token with CAS and receives user information
//  6. Session is fully initialized, and the user is redirected back to the return URI

// User initiates login
router.get('/login/:returnURI', function (req, res) {
  // Update session
  req.session.returnURI = req.params.returnURI

  // Redirect user to login url with application url
	//res.redirect('https://login.oregonstate.edu/idp/profile/cas/login?service=' + appURL)
})

// // User logs in successfully and is redirected back to this route
// router.get('/session', function (req, res) {
//   //res.send(req.params)
//   res.send('yes')
//   // Complete login handshake
//   //https.get('https://login.oregonstate.edu/idp/profile/cas/serviceValidate?ticket=' + req.params.ticket + '&service=' + appURL)
// })

module.exports = router
