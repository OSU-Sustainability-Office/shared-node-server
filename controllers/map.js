/**
 * @Author: Brogan Miner <Brogan>
 * @Date:   2019-03-11T13:57:19-07:00
 * @Email:  brogan.miner@oregonstate.edu
 * @Last modified by:   Brogan
 * @Last modified time: 2019-03-20T15:30:31-07:00
 */

require('dotenv').config()
const APIToken = require('./api.js')
const axios = require('axios')
const express = require('express')
const router = express.Router()
const db = require('../ddb.js')
db.initialize()

router.get('/buildings', async function (req, res) {
  try {
    const token = await APIToken()
    const responseData = await axios('https://api.oregonstate.edu/v1/locations?type=building&page[size]=10000', { method: 'get', headers: { Authorization: 'Bearer ' + token } })
    res.send(responseData.data)
  } catch (e) {
    res.send(e.message)
  }
})

router.get('/features', function (req, res) {

})

module.exports = router
