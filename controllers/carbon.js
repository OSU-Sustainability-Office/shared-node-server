/**
 * @Author: Jack Woods
 * @Date:   2018-12-14T13:18:19-08:00
 * @Filename: carbon.js
 * @Last modified by:   Jack Woods
 * @Last modified time: 2018-12-18T09:55:41-08:00
 * @Copyright: 2018 Oregon State University
 */

var express = require('express')
var router = express.Router()
var db = require('../ddb.js')
db.initialize()

// Log request times.
router.use(function timeLog(req,res,next){
	console.log('Time: ', Date.now());
	next()
})

// Carbon Calculator User Routes
// Download User Data
router.get('/download', function(req, res) {
	let usr = {
		onid = req.session.UserID
	}
	db.getUser(usr).then(data => {
		res.status(200).send(data.data)
	}).catch((rej) => {
		res.status(404).send(rej)
		console.log(rej)
	})
})

// Upload User Data
router.post('/upload', function (req, res) {
	let usr = req.body
	if (usr.UserID) {
		usr.onid = usr.UserID // For compatibility with the old CC
		delete usr['UserID']
	}
	db.updateUser(usr)
	res.status(200).send('SCV good to go, sir.')
})

// Carbon Calculator Question Retrieval
// This variable caches the questions in between requests
var questionsCache = {
	categories: null,
	timestamp: null
}
router.get('/questions/download', function (req, res) {
	// This route caches the questions on the nodeJS server, and makes a DB call
	// once every 15 minutes at most. If multiple requests are made within a 15
	// minute interval, the cached questions are served to the client.

	if (questionsCache.categories === null || questionsCache.timestamp - 900000 > 0) {
		// The question cache is not populated, or more than 15 minutes has elapsed
		// Update the questions cache.
		db.getQuestions().then(categories => {
			questionsCache.categories = JSON.stringify(categories)
			questionsCache.timestamp = new Date()
			res.status(200).send(questionsCache.categories) // We store a stringified version
		}).catch(e => {
			console.log(e)
			res.status(404).send(e)
		})
	} else {
		// Less than 15 minutes has elapsed since the last request. Serve the cached version.
		res.status(200).send(questionsCache.categories) // We store a stringified version
	}
})

// Carbon Calculator Administration Routes

module.exports = router;
