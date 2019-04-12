/**
 * @Author: Brogan Miner <Brogan>
 * @Date:   2019-04-08T13:42:35-07:00
 * @Email:  brogan.miner@oregonstate.edu
 * @Last modified by:   Brogan
 * @Last modified time: 2019-04-11T17:05:34-07:00
 */

const db = require('../db.js')
let uploadData = 3456
const uploadTime = '2019-04-11T08:00:00.000Z'
let accumulator = uploadData
db.connect(async () => {
  let lastRead = await db.query('SELECT accumulated_real FROM data WHERE meter_id = 68 ORDER BY time DESC LIMIT 1')
  accumulator += lastRead[0].accumulated_real
  let start = (new Date(uploadTime)).getTime()
  uploadData /= 96
  for (let i = 0; i < 96; i++) {
    await db.query('INSERT INTO data (time, meter_id, accumulated_real) VALUES (?, 68, ?)', [
      (new Date(start)).toISOString(),
      accumulator
    ])
    accumulator -= uploadData
    start -= 900000
  }
  await db.close()
})
