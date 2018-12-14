/**
 * @Author: Brogan Miner <Brogan>
 * @Date:   2018-09-24T12:16:44-07:00
 * @Email:  brogan.miner@oregonstate.edu
 * @Last modified by:   Brogan
 * @Last modified time: 2018-12-14T13:26:29-08:00
 */

const express = require('express')
const router = express.Router()
const db = require('../db.js')
const AWS = require('aws-sdk')
require('dotenv').config()
const multer = require('multer')
const upload = multer()
const zlib = require('zlib')
const meterdefinitions = require('../data/meterdefinitions/all.js')
AWS.config.update({region: 'us-west-2'})

// Get a meters ID or create a meter object
async function getMeter (serial, device, name, deviceClass) {
  // Get the id of the meter
  let q = await db.query('SELECT id FROM meters WHERE address = ?', [serial + '_' + device])
  let r
  if (q.length === 0) {
    // No id was gathered so no device exists and we must register it in the DB
    let i = await db.query('INSERT INTO meters (name, address, class) VALUES (?, ?, ?)', [name, serial + '_' + device, deviceClass])
    // Get the inserted ID for return value
    r = i.insertId
  } else {
    // Meter was found so return the first query result
    r = q[0].id
  }
  return r
}

// Make sure uploaded time is in 15 minute interval data
function checkTimeInterval (time) {
  // time is a UTC string w/single quatations wrapped around it
  // Can expect index 15-17 to return the minutes
  if (parseInt(time.substring(15, 17)) % 15 === 0) {
    return true
  } else {
    return false
  }
}

// Function to check if emails need to be sent upon data submission
async function checkAlerts (points, meterID) {
  // Get the alerts associated with the meter that uploaded the data
  let alerts = await db.query('SELECT * FROM alerts WHERE meter_id = ?', [meterID])
  // Cycle through each alert returned from above query
  for (let alert of alerts) {
    // Alert point must exist for the following conditional
    if (!points[alert.point]) {
      continue
    }

    // See if the alert should be triggered
    if (points[alert.point] >= alert.threshold) {
      // email user
      // Get the name of the meter
      let metername = await db.query('SELECT name FROM meters WHERE id = ?', [meterID])
      // Get the name of the building
      let buildingname = await db.query('SELECT meter_groups.name FROM meter_group_relation LEFT JOIN meter_groups ON meter_group_relation.group_id = meter_groups.id WHERE meter_group_relation.meter_id = ?', [meterID])
      // Get the ONID name of the user
      let username = await db.query('SELECT name FROM users WHERE id = ?', [alert.user_id])

      // Construct the email for use with AWS SES
      // See extra/email_template.html for the current template config
      let params = {
        Source: 'dashboardalerts@sustainability.oregonstate.edu',
        Template: 'Alert_Template',
        Destination: {
          ToAddresses: [ username[0].name + '@oregonstate.edu' ]
        },
        TemplateData: '{ "building_name" : "' + buildingname[0].name + '", "meter_name" : "' + metername[0].name + '", "meter_point" : "' + alert.point + '", "threshold_value" : "' + alert.threshold + '", "current_value" : "' + points[alert.point] + '"}'
      }
      // Send the email
      new AWS.SES({apiVersion: '2010-12-01'}).sendTemplatedEmail(params).promise().catch(e => {
        console.log(e)
      })
    }
  }
}

async function populateDB (meterID, cols, deviceClass) {
  // Shave off any second values that are present on the time string
  const timestamp = cols[0].toString().substring(1, 17) + ':00'

  // Construct the object that gets mapped to the database
  // This used to make checking alert points easier, and for mapping
  // values of different meters
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

  // Get the object w/indexes mapped to the point object above
  const map = meterdefinitions[deviceClass]

  if (!map) throw new Error('Device is not defined')

  // This keeps A8812 InternalI/O from populating blank lines in the data
  if (Object.keys(map).length === 0) return Promise.resolve()

  // Map each value to the point Object
  // Map keys are the index of the col array parameter on which the
  // associated key-value point lives
  // EX: 4: 'accumulated_real' -> index 4 of col is the accumulated_real of that
  // dataset
  for (let key of Object.keys(map)) {
    pointMap[map[key]] = cols[parseInt(key)]
  }

  // Once the points are mapped we can check if we should email any users
  checkAlerts(pointMap, meterID)

  // Insert the mapped points into the data DB table
  return db.query('INSERT INTO data (meter_id, time, accumulated_real, real_power, reactive_power, apparent_power, real_a, real_b, real_c, reactive_a, reactive_b, reactive_c, apparent_a, apparent_b, apparent_c, pf_a, pf_b, pf_c, vphase_ab, vphase_bc, vphase_ac, vphase_an, vphase_bn, vphase_cn, cphase_a, cphase_b, cphase_c, total, input, minimum, maximum, cubic_feet, instant, rate) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [meterID, timestamp, pointMap.accumulated_real, pointMap.real_power, pointMap.reactive_power, pointMap.apparent_power, pointMap.real_a, pointMap.real_b, pointMap.real_c, pointMap.reactive_a, pointMap.reactive_b, pointMap.reactive_c, pointMap.apparent_a, pointMap.apparent_b, pointMap.apparent_c, pointMap.pf_a, pointMap.pf_b, pointMap.pf_c, pointMap.vphase_ab, pointMap.vphase_bc, pointMap.vphase_ac, pointMap.vphase_an, pointMap.vphase_bn, pointMap.vphase_cn, pointMap.cphase_a, pointMap.cphase_b, pointMap.cphase_c, pointMap.total, pointMap.input, pointMap.minimum, pointMap.maximum, pointMap.cubic_feet, pointMap.instant, pointMap.rate])
}

// This route expects multipart form data to be submitted from an acquisuite
// multer is used to parse the multipart data. The data consists of a body and
// one gzip file, zlib is used to unpack this file.
// On completition of this route the data will be inserted into the DB along
// with alerting users and creating a meter instance if necessary
router.post('/upload', upload.single('LOGFILE'), async function (req, res) {
  // In this route we only want to handle data submissions. But, we would also
  // like to not have errors when running network tests. Sending a default success
  // message works for this.
  if (req.body.MODE !== 'LOGFILEUPLOAD') {
    res.status('200')
    res.send(
      '<pre>\n' +
      'SUCCESS\n' +
      '</pre>'
    )
    return
  }
  // Begin trying to upload the file into the DB
  try {
    // Make sure this requests has the GZIP file and that the password matches
    // from the aqcuisuite
    if (req.file && req.body.PASSWORD === process.env.ACQUISUITE_PASS) {
      // Get a meter ID or create a meter entry and get the ID
      let meterID = await getMeter(req.body.SERIALNUMBER, req.body.MODBUSDEVICE, req.body.MODBUSDEVICENAME, req.body.MODBUSDEVICECLASS)
      // Unpack the GZIP file sent in the form data
      zlib.unzip(req.file.buffer, async (error, result) => {
        if (error) throw error
        // Acquisuite data has 7bit (ASCII) encoding
        // The string is in typical CSV style
        const table = result.toString('ascii').split('\n')
        let promises = []
        // Loop through each of the rows
        for (let entry of table) {
          // Split the row into columns
          let cols = entry.split(',')
          // Make sure this is 15 minute interval data
          if (!checkTimeInterval(cols[0].toString())) {
            continue
          } else {
            // The cols object needs to be copied because JS will release it after this apparently
            // Insert the data into the DB
            promises.push(populateDB(meterID, JSON.parse(JSON.stringify(cols)), req.body.MODBUSDEVICECLASS))
          }
        }
        await Promise.all(promises)
        // Send success after all insertions are handled
        res.status('200')
        res.send(
          '<pre>\n' +
          'SUCCESS\n' +
          '</pre>'
        )
      })
    } else {
      throw new Error('File not contained')
    }
  } catch (error) {
    // Send error status
    res.status('406')
    res.send('<pre>\n' +
        'FAILURE: ' + error.message + '\n' +
        '</pre>')
  }
})

module.exports = router
