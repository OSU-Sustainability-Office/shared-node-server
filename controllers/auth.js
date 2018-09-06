const appURL = 'http://ec2-52-39-141-177.us-west-2.compute.amazonaws.com/'

var express = require('express')
var router = express.Router()
var httpreq = require('httpreq')
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
router.post('/login', function (req, res) {
  // Update session with new returnURI if one is supplied
  req.session.returnURI = req.body.returnURI.length > 0 ? req.body.returnURI : 'http://carbon.campusops.oregonstate.edu/'

  // Redirect user to login url with application url
	res.redirect('https://login.oregonstate.edu/idp/profile/cas/login?service=' + process.env.CAS_APPLICATION_URL)
})

// User logs in successfully and is redirected back to this route
router.get('/session', function (req, res) {
  // Complete login handshake
  httpreq.get('http://login.oregonstate.edu/idp/profile/cas/serviceValidate?ticket=' + req.query.ticket + '&service=' + process.env.CAS_APPLICATION_URL, (err, r) => {
    if (err) return console.log(err)
    if (r.body.includes("Success")) {

      // Parse xml into user variables
      let parser
      let doc
      if (window.DOMParser) { // For sane people who use quality web browsers
        parser = new DOMParser()
        doc = parser.parseFromString(r.body, "text/xml")
      } else { // For plebs that use IE/ActiveX
        parser = new ActiveXObject("Microsoft.XMLDOM")
        doc.async = false;
        doc.loadXML(r.body);
      }

      // Set session variables
      req.session.firstName = doc.getElementsByTagName("cas:firstname")[0].childNodes[0].nodeValue
      req.session.primaryAffiliation = doc.getElementsByTagName("cas:eduPersonPrimaryAffiliation")[0].childNodes[0].nodeValue
      req.session.onid = doc.getElementsByTagName("cas:uid")[0].childNodes[0].nodeValue
    }
    res.redirect(req.session.returnURI)
  })

})

module.exports = router

// Update user variables, such as UID and name
function updateUserVariables(res) {
  var parser;
  var doc;
  if (window.DOMParser) {
    parser = new DOMParser();
    doc = parser.parseFromString(res, "text/xml");
  } else { // IE uses ActiveX
    parser = new ActiveXObject("Microsoft.XMLDOM");
    doc.async = false;
    doc.loadXML(res);
  }

  // Set global Variables
  firstName = doc.getElementsByTagName("cas:firstname")[0].childNodes[0].nodeValue;

  primaryAffiliation = doc.getElementsByTagName("cas:eduPersonPrimaryAffiliation")[0].childNodes[0].nodeValue;

  uid = doc.getElementsByTagName("cas:uid")[0].childNodes[0].nodeValue;

  // Update header with user's name.
  var header = document.getElementsByClassName("well-md")[0].getElementsByTagName("h1")[0].innerHTML = "Hello, " + firstName + "! Welcome to your Carbon Calculator.";

}
