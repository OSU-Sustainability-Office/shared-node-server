var express = require('express');
var router = express.Router();
var db = require('../db');

router.use(function timeLog(req,res,next){
	console.log('Time: ', Date.now());
	next();
})

// Download User Data
router.post('/carbonCalculator/download', function (req, res) {
  // Get user data from client
  let dataObject = req.body;

  // Search for user in users table
  db.query('SELECT * FROM users WHERE name=\'' + dataObject.UserID+'\'').then(function (rows) {
    // If the user is found (and is unique), query the database for Carbon Calc Results
    if (rows.length == 1) {
      db.query('SELECT * FROM carbon_calc_results WHERE user_id=\'' + rows[0].id + '\'').then(function(rows) {
        console.log(rows)
        res.status(200).send(JSON.stringify(rows))

        // If no data is found, return an empty user data object.
        if (rows.length == 0) res.status(404).send(JSON.stringify(dataObject))
        else {
          // Clear data array
          dataObject.data = []

          // Iterate over each record, and convert into CC compatible JSON format
          rows.forEach(function(row) {
            let data = {
              "date": row.time,
              "totals": [
                row.transportation,
                row.consumption,
                row.energy,
                row.food,
                row.water
              ],
              "location": {
                "ip": row.ip,
                "continent_code": row.continent_code,
                "continent_name": row.continent_name,
                "country_code": row.country_code,
                "country_name": row.country_name,
                "region_code": row.region_code,
                "region_name": row.region_name,
                "city": row.city,
                "zip": row.zip
              }
            }
            dataObject.data.push(data)
          })
        }
      }).catch(err => {
        res.status(400).send('400: ' + err.message)
      })

      // If the user is not found...
    } else {
      // ... return a user JSON object with no historical data.
      res.status(404).send(JSON.stringify(dataObject))
    }
  }).catch(err => {
    res.status(400).send('400: ' + err.message)
  })
})

// Upload User Data
router.post('/carbonCalculator/upload', function (req, res) {
  // Get user data from client
  let dataObject = req.body;

  // Search for user in users table
  db.query('SELECT * FROM users WHERE name=\'' + dataObject.UserID+'\'').then(function (rows) {
    // If the user is found (and is unique), query the database for Carbon Calc Results
    if (rows.length == 1) {
      // Insert data into database
      db.query('INSERT INTO carbon_calc_results (time, user_id, transportation, consumption, energy, food, waste, water, ip, continent_code, continent_name, country_code, country_name, region_code, region_name, city, zip) VALUES (' + dataObject.data[0].date + ', ' + rows[0].id + ', ' + dataObject.data[0].totals[0] + ', ' + dataObject.data[0].totals[1] + ', ' + dataObject.data[0].totals[2] + ', ' + dataObject.data[0].totals[3] + ', 0, ' + dataObject.data[0].totals[4] + ', ' + dataObject.data[0].location.ip + ', ' + dataObject.data[0].location.continent_code + ', ' + dataObject.data[0].location.continent_name + ', ' + dataObject.data[0].location.country_code + ', ' + dataObject.data[0].location.country_name + ', ' + dataObject.data[0].location.region_code + ', ' + dataObject.data[0].location.region_name + ', ' + dataObject.data[0].location.city + ', ' + dataObject.data[0].location.zip + ')').catch(err => {
        res.status(400).send('400: ' + err.message)
      })
      // Record entered successfully.
      res.status(200).send("Added new data to user.");

      // If the user is not found...
    } else {
      // ... return a user JSON object with no historical data.
      res.status(404).send(JSON.stringify(dataObject))
    }
  }).catch(err => {
    res.status(400).send('400: ' + err.message)
  })
})

module.exports = router;
