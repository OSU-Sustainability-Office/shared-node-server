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
router.get('/download/:UserID', function(req, res) {
	console.log(req.params.UserID)
	db.getUser(req.params.UserID).then(function(data) {
		res.status(200).send(data.data)
	}).catch((rej) => {
		res.status(404).send('Well, that didn\'t work.')
		console.log(rej)
	})
})

// Upload User Data
router.post('/upload', function (req, res) {
	let usr = req.body
	usr.onid = usr.UserID
	delete usr['UserID']
	console.log(usr)

	db.updateUser(usr).then(function(data) {
		res.status(200).send('I think it worked.')
	}).catch((rej) => {
		res.status(404).send('Well, that didn\'t work.')
		console.log(rej)
	})
})

module.exports = router;
