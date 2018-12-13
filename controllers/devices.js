const express = require('express')
const router = express.Router()
const xmlparser = require('express-xml-bodyparser')
const db = require('../db.js')
const fs = require('fs')
const AWS = require('aws-sdk')
require('dotenv').config()
const multer = require('multer')
const upload = multer()
AWS.config.update({region: 'us-west-2'})

// Insert one point
function insertPoint (record, res, deviceType, meterId) {
  // Format timestamp
  const d = new Date(record.time._)
  console.log('Inserting meter data into table from: ' + d)
  const year = d.getFullYear()
  const month = ('0' + (d.getMonth() + 1)).slice(-2) // 2 digit
  const day = ('0' + d.getDate()).slice(-2)
  const hour = ('0' + d.getHours()).slice(-2)
  const min = ('0' + d.getMinutes()).slice(-2)
  const timestamp = year + '-' + month + '-' + day + ' ' + hour + ':' + min + ':00'

  const pointMap = {
    accumulated_real: null,
    real_power: null,
    reactive_power: null,
    apparent_power: null,
    real_a: null,
    real_b: null,
    real_c: null,
    reactive_a: null,
    reactive_b: null,
    reactive_c: null,
    apparent_a: null,
    apparent_b: null,
    apparent_c: null,
    pf_a: null,
    pf_b: null,
    pf_c: null,
    vphase_ab: null,
    vphase_bc: null,
    vphase_ac: null,
    vphase_an: null,
    vphase_bn: null,
    vphase_cn: null,
    cphase_a: null,
    cphase_b: null,
    cphase_c: null,
    total: null,
    input: null,
    minimum: null,
    maximum: null,
    cubic_feet: null,
    instant: null,
    rate: null,
    default: null
  }
  fs.readFile('./data/meterdefinitions/' + deviceType + '.json', (err, data) => {
    if (err) {
      return
    }
    const nameMap = JSON.parse(data)
    for (let point of record.point) {
      pointMap[nameMap[point.$.name] || 'default'] = point.$.value
    }
    db.query('INSERT INTO data (meter_id, time, accumulated_real, real_power, reactive_power, apparent_power, real_a, real_b, real_c, reactive_a, reactive_b, reactive_c, apparent_a, apparent_b, apparent_c, pf_a, pf_b, pf_c, vphase_ab, vphase_bc, vphase_ac, vphase_an, vphase_bn, vphase_cn, cphase_a, cphase_b, cphase_c, total, input, minimum, maximum, cubic_feet, instant, rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [res[0].id, timestamp, pointMap.accumulated_real, pointMap.real_power, pointMap.reactive_power, pointMap.apparent_power, pointMap.real_a, pointMap.real_b, pointMap.real_c, pointMap.reactive_a, pointMap.reactive_b, pointMap.reactive_c, pointMap.apparent_a, pointMap.apparent_b, pointMap.apparent_c, pointMap.pf_a, pointMap.pf_b, pointMap.pf_c, pointMap.vphase_ab, pointMap.vphase_bc, pointMap.vphase_ac, pointMap.vphase_an, pointMap.vphase_bn, pointMap.vphase_cn, pointMap.cphase_a, pointMap.cphase_b, pointMap.cphase_c, pointMap.total, pointMap.input, pointMap.minimum, pointMap.maximum, pointMap.cubic_feet, pointMap.instant, pointMap.rate])
    db.query('SELECT * FROM alerts WHERE meter_id = ?', [res[0].id]).then(async r => {
      for (let alert of r) {
        if (!pointMap[alert.point]) {
          continue
        }
        if (pointMap[alert.point] >= alert.threshold) {
          // email user

          let metername = await db.query('SELECT name FROM meters WHERE id = ?', [res[0].id])
          let buildingname = await db.query('SELECT meter_groups.name FROM meter_group_relation LEFT JOIN meter_groups ON meter_group_relation.group_id = meter_groups.id WHERE meter_group_relation.meter_id = ?', [res[0].id])
          let username = await db.query('SELECT name FROM users WHERE id = ?', [alert.user_id])
          var params = {
            Source: 'dashboardalerts@sustainability.oregonstate.edu',
            Template: 'Alert_Template',
            Destination: {
              ToAddresses: [ username[0].name + '@oregonstate.edu' ]
            },
            TemplateData: '{ "building_name" : "' + buildingname[0].name + '", "meter_name" : "' + metername[0].name + '", "meter_point" : "' + alert.point + '", "threshold_value" : "' + alert.threshold + '", "current_value" : "' + pointMap[alert.point] + '"}'
          }
          new AWS.SES({apiVersion: '2010-12-01'}).sendTemplatedEmail(params).promise().catch(e => {
            console.log(e)
          })
        }
      }
    })
  })
}

// Inserts a record if it is a 15 minute interval point
function insertRecord(record, res, deviceType, meter_id) {
  // Check to see if the point is 15 minute data
  if (record.time._.substring(14, 16) % 15 == 0) {
    // Now, add temp data.
    // In the event that a meter was created, res[0] is null, so we need to query for the meter's id again.

    if (res[0]) {
       insertPoint(record, res, deviceType, meter_id)
    } else {
      // Query again.
      db.query('SELECT id FROM meters WHERE address = "' + meter_id + '"', function(err, res) {
        if (err) throw err
        insertPoint(record, res, deviceType, meter_id)
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
      insertRecord(device.records.record[i], res, device.type, meter_id)
    }
  } else {
    // Insert the only record
    insertRecord(device.records.record, res, device.type, meter_id)
  }
}

// Inserts data into the temporary table in the database.
var insertData = function insertData(device, serial) {
  var meter_id = serial + "_" + device.address

  // Check if the meter exists. If yes, insert the data into temp. If
  // no, then insert the meter into the meters table before adding the
  // temp data.
  db.query('SELECT id, device_type FROM meters WHERE address = "' + meter_id + '"', function(err, res) {
    if (err) throw err
    // if none found, insert
    if (res.length === 0) {
      console.log('Creating new meter: ' + meter_id)
      db.query('INSERT INTO meters (name, address, device_type) VALUES ("' + device.name + '","' + meter_id + '","' + device.type + '")', function (err, res) {
        if (err) throw err
        iterateRecords(device, res, meter_id)
      })
    } else {
      if (!res[0].device_type) {
        db.query('UPDATE meters SET device_type = ? WHERE id = ?', [device.type, res[0].id])
      }
      iterateRecords(device, res, meter_id)
    }
  })
}

router.post('/test', upload.none(), function (req, res) {
  console.log(JSON.stringify(req.body))
  res.send()
})

// Receives acquisuite log file uploads in XML format. Converts to JSON, then
// inserts into the temporary table on our MySQL database.
router.post('/upload', xmlparser({
    trim: false,
    explicitArray: false
}), function (req, res) {
    if (req.body.das && req.body.das.mode == 'LOGFILEUPLOAD') {
        var serial = req.body.das.serial
        console.log(req.body)
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
