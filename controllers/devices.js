var express = require('express')
var router = express.Router()
var xmlparser = require('express-xml-bodyparser')
var db = require('../db.js')

// Insert one point
function insertPoint(record, res, meter_id) {

  // Format timestamp
  var d = new Date(record.time._)
  d.setTime(d.getTime() - d.getTimezoneOffset()*60*1000)
  console.log("Inserting meter data into table from: " + d)
  var year = d.getFullYear()
  var month = ("0" + (d.getMonth() + 1)).slice(-2) // 2 digit
  var day = ("0" + d.getDate()).slice(-2)
  var hour = ("0" + d.getHours()).slice(-2)
  var min = ("0" + d.getMinutes()).slice(-2)
  var timestamp = year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':00'

  var point = record.point

  var query = ""
  //H6812
  if (point.length === 72)
    query = 'INSERT INTO data (meter_id, time, accumulated_real, real_power, reactive_power, apparent_power, real_a, real_b, real_c, reactive_a, reactive_b, reactive_c, apparent_a, apparent_b, apparent_c, pf_a, pf_b, pf_c, vphase_ab, vphase_bc, vphase_ac, vphase_an, vphase_bn, vphase_cn, cphase_a, cphase_b, cphase_c) VALUES ("' + res[0].id + '","' + timestamp + '",' + point[0].$.value + ',' + point[21].$.value + ',' + point[22].$.value + ',' + point[23].$.value + ',' + point[51].$.value + ',' + point[52].$.value + ',' + point[53].$.value + ',' + point[54].$.value + ',' + point[55].$.value + ',' + point[56].$.value + ',' + point[57].$.value + ',' + point[58].$.value + ',' + point[59].$.value + ',' + point[60].$.value + ',' + point[61].$.value + ',' + point[62].$.value + ',' + point[63].$.value + ',' + point[64].$.value + ',' + point[65].$.value + ',' + point[66].$.value + ',' + point[67].$.value + ',' + point[68].$.value + ',' + point[69].$.value + ',' + point[70].$.value + ',' + point[71].$.value + ')'
  else if (point.length === 26)
    query = 'INSERT INTO data (meter_id, time, accumulated_real, real_power, reactive_power, apparent_power, real_a, real_b, real_c, pf_a, pf_b, pf_c, vphase_ab, vphase_bc, vphase_ac, vphase_an, vphase_bn, vphase_cn, cphase_a, cphase_b, cphase_c) VALUES ("'+ res[0].id + '","' + timestamp +'",'+ point[0].$.value + ',' + point[1].$.value + ',' + point[2].$.value + ',' + point[3].$.value + ',' + point[8].$.value + ',' + point[9].$.value + ',' + point[10].$.value + ',' + point[11].$.value + ',' + point[12].$.value + ','+ point[13].$.value + ',' + point[14].$.value + ',' + point[15].$.value + ',' + point[16].$.value + ',' + point[17].$.value + ',' + point[18].$.value + ',' + point[19].$.value + ',' + point[20].$.value + ','+ point[21].$.value + ',' + point[22].$.value + ')'
  else if (point.length === 15)
    query = 'INSERT INTO data (meter_id, time, accumulated_real, real_power, vphase_ab, vphase_bc, vphase_ac, vphase_an, vphase_bn, vphase_cn, cphase_a, cphase_b, cphase_c) VALUES ("' + res[0].id + '","' + timestamp + '",' + point[5].$.value + ',' + point[4].$.value + ',' + point[9].$.value + ',' + point[10].$.value + ',' + point[11].$.value + ',' + point[12].$.value + ',' + point[13].$.value + ',' + point[14].$.value + ',' + point[0].$.value + ',' + point[1].$.value + ',' + point[2].$.value + ')'
  //Steam meter
  else if (point.length === 4)
    query = 'INSERT INTO data (meter_id, time, input, total, minimum, maximum) VALUES ("' + res[0].id + '","' + timestamp + '",' + point[0].$.value + "," + point[1].$.value + "," + point[2].$.value + "," + point[3].$.value + ')'
  else if (point.length === 47)
    query = 'INSERT INTO data (meter_id, time, accumulated_real, real_power, reactive_power, apparent_power, real_a, real_b, real_c, reactive_a, reactive_b, reactive_c, apparent_a, apparent_b, apparent_c, pf_a, pf_b, pf_c, vphase_ab, vphase_bc, vphase_ac, vphase_an, vphase_bn, vphase_cn, cphase_a, cphase_b, cphase_c) VALUES ("' + res[0].id + '","' + timestamp + '",' + point[0].$.value + ',' + point[42].$.value + ',' + point[43].$.value + ',' + point[41].$.value+ ',' + point[22].$.value + ',' + point[23].$.value + ',' + point[24].$.value + ',' + point[25].$.value + ',' + point[26].$.value + ',' + point[27].$.value + ',' + point[19].$.value + ',' + point[20].$.value + ',' + point[21].$.value + ',' + point[28].$.value + ',' + point[29].$.value + ',' + point[30].$.value + ',' + point[13].$.value + ',' + point[14].$.value + ',' + point[15].$.value + ',' + point[10].$.value + ',' + point[11].$.value + ',' + point[12].$.value + ',' + point[16].$.value + ',' + point[17].$.value + ',' + point[18].$.value + ')'
  //gas meter
  else if (point.length === 10)
    query = "INSERT INTO data (meter_id, time, cubic_feet, instant, minimum, maximum, rate) VALUES ('"+ res[0].id+"','" + timestamp + "'," + point[0].$.value + ',' + point[2].$.value +','+ point[3].$.value + ',' + point[4].$.value + ',' + point[1].$.value + ')'
  //h8036
  else if (point.length === 13)
    query = 'INSERT INTO data (meter_id, time, accumulated_real, real_power, vphase_ab, vphase_bc, vphase_ac, vphase_an, vphase_bn, vphase_cn, cphase_a, cphase_b, cphase_c) VALUES ("' + res[0].id +'","'+timestamp + '",' + point[11].$.value + ',' + point[10].$.value + ',' + point[4].$.value + ',' + point[6].$.value + ',' + point[8].$.value + ',' + point[5].$.value + ',' + point[7].$.value + ',' + point[9].$.value + ',' + point[0].$.value + ',' + point[1].$.value + ',' + point[2].$.value + ')'
  else if (point.length === 29)
    query = 'INSERT INTO data (meter_id, time, accumulated_real, real_power, reactive_power, apparent_power, real_a, real_b, real_c, pf_a, pf_b, pf_c, vphase_ab, vphase_bc, vphase_ac, vphase_an, vphase_bn, vphase_cn, cphase_a, cphase_b, cphase_c) VALUES ("' + res[0].id + '","' + timestamp + '",' + point[0].$.value + ',' + point[1].$.value + ',' + point[2].$.value + ',' + point[3].$.value+ ',' + point[8].$.value + ',' + point[9].$.value + ',' + point[10].$.value + ',' + point[11].$.value + ',' + point[12].$.value + ',' + point[13].$.value + ',' + point[14].$.value + ',' + point[15].$.value + ',' + point[16].$.value + ',' + point[17].$.value + ',' + point[18].$.value + ',' + point[19].$.value + ',' + point[20].$.value + ',' + point[21].$.value + ',' + point[22].$.value + ')'
  if(query !== "")
    db.query(query)
}

// Inserts a record if it is a 15 minute interval point
function insertRecord(record, res, meter_id) {
  // Check to see if the point is 15 minute data
  if (record.time._.substring(14, 16) % 15 == 0) {
    // Now, add temp data.
    // In the event that a meter was created, res[0] is null, so we need to query for the meter's id again.
    if (record.point.length !== 72 && record.point.length !== 26 && record.point.length !== 15 && record.point.length !== 4 && record.point.length !== 47  && record.point.length !== 10  && record.point.length !== 13  && record.point.length !== 29)
      for (var i  = 0; i < record.point.length; i++)
        console.log(record.point[i])
  //  console.log(record)

    if (res[0]) {
       insertPoint(record, res, meter_id)
    } else {
      // Query again.
      db.query('SELECT id FROM meters WHERE address = "' + meter_id + '"', function(err, res) {
        if (err) throw err
        insertPoint(record, res, meter_id)
      })
    }
  } else {
    console.log("Meter data from: " + record.time._ + " not inserted because it is not 15 minute interval data.")
  }
}

function iterateRecords(device, res, meter_id) {
  // Iterate over each record being uploaded
  // If there is only one record being uploaded, device.records.record is not
  // an array. Before iterating, test if the record is an array.
  if (device.records.record.length != null) {
    // Iterate over each record, and insert it
    for (var i = 0; i < device.records.record.length; i++) {
      insertRecord(device.records.record[i], res, meter_id)
    }
  } else {
    // Insert the only record
    insertRecord(device.records.record, res, meter_id)
  }
}

// Inserts data into the temporary table in the database.
var insertData = function insertData(device, serial) {
  var meter_id = serial + "_" + device.address

  // Check if the meter exists. If yes, insert the data into temp. If
  // no, then insert the meter into the meters table before adding the
  // temp data.
  db.query('SELECT id FROM meters WHERE address = "' + meter_id + '"', function(err, res) {
    if (err) throw err
    // if none found, insert
    if (res.length == 0) {
      console.log("Creating new meter: " + meter_id)
      db.query('INSERT INTO meters (name, address) VALUES ("' + device.name + '","' + meter_id + '")', function (err, res) {
        if (err) throw err
        iterateRecords(device, res, meter_id)
      })
    } else {
      iterateRecords(device, res, meter_id)
    }
  })
}

// Receives acquisuite log file uploads in XML format. Converts to JSON, then
// inserts into the temporary table on our MySQL database.
router.post('/upload', xmlparser({
    trim: false,
    explicitArray: false
}), function (req, res) {
    if (req.body.das && req.body.das.mode == 'LOGFILEUPLOAD') {
        var serial = req.body.das.serial
        console.log('Received XML data from ' + serial + ' on: ' + new Date().toUTCString())

        // If multiple meters are connected, device is an array. Check for
        // multiple meters
        if (req.body.das.devices.device.length != null) {
          console.log("There are multiple devices! Iterating over all of them...")
          // Iterate over each meter that is connected to this acquisuite
          for (var i = 0; i < req.body.das.devices.device.length; i++) {
            insertData(req.body.das.devices.device[i], serial)
          }
        } else {
          console.log("There is only one device! Inserting data...")
          insertData(req.body.das.devices.device, serial)
        }
    } else {
        console.log('Acquisuite STATUS file received. It looks nice, but I\'m not going to do anything with it.')
    }

    // Send a positive response to the acquisuite.
    res.status('200')
    res.set({
        'content-type': 'text/xml',
        'db': 'close'
    })
    res.send('<?xml version="1.0" encoding="UTF-8" ?>\n' +
        '<result>SUCCESS</result>\n' +
        '<DAS></DAS>' +
        '</xml>')
})

module.exports = router