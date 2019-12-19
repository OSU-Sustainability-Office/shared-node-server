/**
 * @Author: Brogan Miner <Brogan>
 * @Date:   2019-04-08T13:42:35-07:00
 * @Email:  brogan.miner@oregonstate.edu
 * @Last modified by:   Brogan
 * @Last modified time: 2019-04-29T20:06:39-07:00
 */

const db = require('../db.js')
const uploadData = [
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00,
  3500.00
]
let accumulator = 0
db.connect(async () => {
  let start = (new Date('2019-02-18T08:00:00.000Z')).getTime()
  console.log((new Date(start)).toISOString())
  for (let data of uploadData) {
    data /= 96
    for (let i = 0; i < 96; i++) {
      await db.query('INSERT INTO data (time, meter_id, accumulated_real) VALUES (?, 68, ?)', [
        (new Date(start)).toISOString(),
        accumulator
      ])
      accumulator += data
      start += 900000
    }
  }
  await db.close()
})
