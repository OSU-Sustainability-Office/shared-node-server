var express = require('express');
var router = express.Router();
var db = require('../ddb.js')
db.initialize()


// Log request times.
router.use(function timeLog(req,res,next){
	console.log('Time: ', Date.now());
	next();
})

// Download User Data
router.post('/download', function (req, res) {
	let usr = req.body
	db.getUser(usr.UserID).then(function(data) {
		console.log(data)
	}).catch((rej) => {
		console.log(rej)
	})
})

// Upload User Data
router.post('/upload', function (req, res) {

})

module.exports = router;
