var express = require('express');
var router = express.Router();
var db = require('../db');
var ObjectId = require('mongodb').ObjectId;

router.use(function timeLog(req,res,next){
	console.log('Time: ', Date.now());
	next();
})

/*======================================
			DATA COLLECTION
========================================
Collects POST data from users in JSON format.
Then queries the database to prevent duplicates
and stores data
*/
router.post('/upload',function(req, res){
	console.log(req.body);
	var dataObject = req.body;

	res.status("200");

	var col = db.get("carbon").collection('userData');

	col.find({"UserID" : dataObject.UserID}).limit(1).toArray(
		function(err,rslt) {

			// Search the user's data for today's date.
      		// The user can only upload a maximum of 1 carbon footprint per day.
			if (rslt.length > 0) {
				var userObject = rslt[0];
				var update = false;
				console.log(dataObject);

				for (var i = 0; i < userObject.data.length; i++) {
					//if date exists in the users list
					if (userObject.data[i].date === dataObject.data[0].date) {
						update = true;
						userObject.data[i] = dataObject.data[0]; //replace it
						console.log("Replace data.")
					}
				}

				//if the date didnt exist, push the new data
				if (!update) {
					userObject.data.push(dataObject.data[0]);
					console.log("Push new data.");
				}
				console.log(userObject.data);

				//update database with new data.var 
				col.update({"_id":userObject._id},{$set:{"data" : userObject.data}});
				//send a result message for debugging
				res.send("Added new data to user.");
			}
			else {
				//insert user object into database
				col.insert(dataObject);
				//send result message for debugging
				res.send("User inserted into database.")
			}
		}
	);
});

/*======================================
			DATA RETRIEVAL
========================================
Retrieves user data in JSON form
*/
router.post('/download',function(req, res) {
	var dataObject = req.body;

	//Get userData collection
	var col = db.get("carbon").collection("userData");

	col.find({"UserID" : dataObject.UserID}).limit(1).toArray(
		function(err,rslt) {
			//if the user exists in the DB
			if (rslt.length > 0) { 
				var userObject = rslt[0];

				//send success status
				res.status("200");

				//send users object
				res.send(JSON.stringify(userObject));
			}
			//user doesnt exist
			else {
				//send error status and message
				res.status("500");
				res.send("Error: No such user.")
			}
		}
	);

});

module.exports = router;