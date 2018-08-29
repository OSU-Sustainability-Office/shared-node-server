var express = require('express');
var router = express.Router();
var db = require('../ddb.js')
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
	let usr = req.body
	usr.onid = usr.UserID
	delete usr['UserID']
	db.updateUser(usr)
	res.status(200).send('SCV good to go, sir.')
})
