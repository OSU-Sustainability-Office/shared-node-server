var express = require('express');
var router = express.Router();
var db = require('../db');
var ObjectId = require('mongodb').ObjectId;

router.use(function timeLog(req,res,next){
	console.log('Time: ', Date.now());
	next();
});


/*===========================================
				GET Requests
 ============================================
*/
//Params: callback, buildingId
//returns: JSON wrapped in callback
//Gets full featureObject with associated id
router.get('/buildingId',function (req,res) {
	var features = db.get("map").collection('featureCollection');
	features.find(ObjectId(req.query.buildingId)).toArray(
		function (err,rslt) {
			res.send(req.query.callback+"("+JSON.stringify(rslt)+")");
		}
	)
});
//params: callback
//returns: JSON wrapped in callback
//Gets all building names in database, excludes parking lots
router.get('/buildingNames',function (req, res) {
	var features = db.get("map").collection('featureCollection');
	features.find({"attributes.name":{$exists:true},"attributes.type":{$ne : "parking"}},{"attributes.name":1}).toArray(
		function (err,rslt) {
			res.send(req.query.callback+"("+JSON.stringify(rslt)+")");
	});
	
});

module.exports = router;