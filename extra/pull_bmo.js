/*
 * @Author: you@you.you
 * @Date:   Wednesday February 12th 2020
 * @Last Modified By:  Brogan Miner
 * @Last Modified Time:  Wednesday February 12th 2020
 * @Copyright:  (c) Oregon State University 2020
 */
require('dotenv').config()
const CSV = require('csv-parser')
const Parse = require('csv-parse/lib/sync')
const https = require('https')
const FS = require('fs')
const Axios = require('axios')
const FormData = require('form-data')
const token = process.env.TOKEN_BMO
Axios.defaults.headers.common['Cookie'] = 'XSRF-TOKEN=' + token;
const httpsAgent = new https.Agent({ keepAlive: true })
const db = require('../db.js')
const meterdefinitions = require('../data/meterdefinitions/all.js')

async function download (mac, port, to, from) {
  // let mac = '001EC6051F67'
  // let port = '1'
  // let to = '2020-02-12T20:00:00.000Z'
  // let from = '2020-02-12T19:00:00.000Z'
  console.log('Download: ' + mac + ' ' + port + ' ' + to + ' ' + from)

  let url = `https://www.levitonbmo.com/app/device/${mac}/${port}/export`
  let formData = new FormData()
  formData.append('from', encodeURI(from))
  formData.append('to', encodeURI(to))
  formData.append('delimiter', 'comma')
  formData.append('tz', 'UTC')
  formData.append('headers', 'Y')
  formData.append('_token', process.env._TOKEN_BMO)
  let data = await Axios({
    httpsAgent: httpsAgent,
    url: url,
    method: 'post',
    data: `from=${encodeURI(from)}&to=${encodeURI(to)}&_token=stuNdgCZG1c3ZeHcwCLodX7lmYk0Nia2gZORqJ4b&tz=UTC&delimiter=comma&headers=Y`,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cookie': 'XSRF-TOKEN=' + token,
      'Connection': 'keep-alive',
      'Host': 'www.levitonbmo.com',
      'Referer': 'https://www.levitonbmo.com/app/home',
      'Upgrade-Insecure-Requests': 1,
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:65.0) Gecko/20100101 Firefox/65.0'
    }
  })
  return { data: data.data, address: mac + '_' + port }
}

async function populateDB (meterID, cols, deviceClass) {
  // console.log(cols)
  // Shave off any second values that are present on the time string
  const timestamp = cols[0].toString().substring(1, 17) + ':00'
  const timeseconds = ((new Date(timestamp)).getTime() / 1000) - ((new Date()).getTimezoneOffset() * 60)

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
  // checkAlerts(pointMap, meterID)
  if (!pointMap.accumulated_real && !pointMap.total && !pointMap.cubic_feet) {
    console.log(cols)
    Promise.reject(new Error('No data'))
  }
  // Insert the mapped points into the data DB table
  try {
    await db.query('INSERT INTO data (meter_id, time, accumulated_real, real_power, reactive_power, apparent_power, real_a, real_b, real_c, reactive_a, reactive_b, reactive_c, apparent_a, apparent_b, apparent_c, pf_a, pf_b, pf_c, vphase_ab, vphase_bc, vphase_ac, vphase_an, vphase_bn, vphase_cn, cphase_a, cphase_b, cphase_c, total, input, minimum, maximum, cubic_feet, instant, rate, time_seconds) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [meterID, timestamp, pointMap.accumulated_real, pointMap.real_power, pointMap.reactive_power, pointMap.apparent_power, pointMap.real_a, pointMap.real_b, pointMap.real_c, pointMap.reactive_a, pointMap.reactive_b, pointMap.reactive_c, pointMap.apparent_a, pointMap.apparent_b, pointMap.apparent_c, pointMap.pf_a, pointMap.pf_b, pointMap.pf_c, pointMap.vphase_ab, pointMap.vphase_bc, pointMap.vphase_ac, pointMap.vphase_an, pointMap.vphase_bn, pointMap.vphase_cn, pointMap.cphase_a, pointMap.cphase_b, pointMap.cphase_c, pointMap.total, pointMap.input, pointMap.minimum, pointMap.maximum, pointMap.cubic_feet, pointMap.instant, pointMap.rate, timeseconds])
    Promise.resolve()
  } catch (error) {
    Promise.resolve()
  }
}

db.connect(async () => {
  // Main
  let dlPromises = []
  FS.createReadStream('extra/reads.csv').pipe(CSV()).on('data', row => {
    if (row.address !== 'NULL' && row.meter_id === '71') {
      let from = new Date(row.time_2)
      from.setMinutes(-from.getTimezoneOffset())
      let to = new Date(row.time_1)
      to.setMinutes(-to.getTimezoneOffset())
      while (1) {
        let int = new Date(from)
        // One week at a time?
        int.setDate(from.getDate() + 1)
        if (int >= to) {
          dlPromises.push(download(
            row.address.split('_')[0],
            row.address.split('_')[1],
            to.toISOString(),
            from.toISOString()
          ))
          break
        } else {
          dlPromises.push(download(
            row.address.split('_')[0],
            row.address.split('_')[1],
            int.toISOString(),
            from.toISOString()
          ))
          from = int
        }
      }
    }
  }).on('end', async () => {
    let qPromises = []
    let d = await Promise.all(dlPromises)
    for (let entry of d) {
      let data = Parse(entry.data, { columns: false })
      let mq = await db.query('SELECT id, class FROM meters WHERE address = ?', [entry.address])
      let meterId = mq[0].id
      let meterClass = mq[0].class
      if (!meterId) {
        console.log('Cant find meter ' + entry.address)
      }
      for (let row in data) {
        if (row > 0) {
          qPromises.push(populateDB(meterId, data[row], meterClass))
        }
      }
    }
    await Promise.all(qPromises)
    console.log('done')
    db.close()
  })
})
// POST /app/device/001EC6051F67/1/export HTTP/1.1
// Host: www.levitonbmo.com
// User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:65.0) Gecko/20100101 Firefox/65.0
// Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
// Accept-Language: en-US,en;q=0.5
// Accept-Encoding: gzip, deflate, br
// Referer: https://www.levitonbmo.com/app/home
// Content-Type: application/x-www-form-urlencoded
// Content-Length: 136
// Connection: keep-alive
// Cookie: XSRF-TOKEN=eyJpdiI6ImRPV1RDQnFUc1VIdzE1ell3aURRbGc9PSIsInZhbHVlIjoiMU1ZbldVUVlMMU5tOGdiWk9cL0NOUUp1cWptM1h2ZWE3U05MN1lXT0RyeTJsRU5QbVdCbldXSDZpVDR4ZzV5VnExTFJXZjBZOUYxaHRCSlwvQkhwSUM1QT09IiwibWFjIjoiMmZmMzA5Nzk3OWMwYzIyOTNmMzk5ZjI5ZTMyN2RlM2VmYmZiZjUzMzAzNWRkNmYzNWM1ZGEzNGYwNzZkN2Y1ZSJ9; laravel_session=eyJpdiI6IkpVRjl3Y0Fld2dPcDNYMks4MUdVQ3c9PSIsInZhbHVlIjoibVVFWHhBTnhiRWFRd0NTQlhtbUJGQkZiYUMrR1hnaUdOUkgwUDRHMUxmZU44aXVUVXJcL3F2RmJJTVd0czVaOEJ6MkdQOTZ0a0tDSlwvTXVuUm1VcHdSQT09IiwibWFjIjoiZjRmNjlkODkwMTI5MGZhOTVmNjQ4YzU0ZWNlMmJlMTVhZGNhNGQ3Mzg0NjA4ZGNkYzBhZGU4ZTZlNzhlOGY2NyJ9; bmo_auth=eyJpdiI6InhUMk9kQjdhaWNRbmhoXC9WYk5IbXRnPT0iLCJ2YWx1ZSI6Ik9WdzRBVnRmdTJlME9NMGFuS2QzU3dhM0o5dUtXSU9nSkE1Zk9LMGZUcDlXRHFaMXVVTTRncDFONVcyNEtcL0Nabk9mM2NBUWlhdFJEQmhQc21OeFJwRlwvdGNOalwvUTBobkdCYjdIaHpEOVhwZFhpNkpHTjduaktDd0c2TUxHd3h6IiwibWFjIjoiYmRmNWI4MjYxNDE1NDVhMDA1YmU4YTdlMGQ0MDliNThhY2UzZWUxNTdjMTkxNTQxNTM5OTU5NGM1YmU5ZjQ5OCJ9; _pk_id.7.c4d1=f5f2c5ee396eb886.1581542574.1.1581542953.1581542574.; _pk_ref.7.c4d1=%5B%22%22%2C%22%22%2C1581542574%2C%22https%3A%2F%2Flogin.microsoftonline.com%2Flevitonb2c.onmicrosoft.com%2FB2C_1_sign-in-up-policy%2Fapi%2FCombinedSigninAndSignup%2Fconfirmed%3Fcsrf_token%3DSVNsTlJYVDNPN2MwYWlqcDAwWmQxclNKa0Jzdkl1UW9GMVFhVlJtZUpPeTRQZDJFOStyQkV2QnZFaDlPY1ZTZ3kyUk4yYWJad2N2blRkRC9Tcm5hSUE9PTsyMDIwLTAyLTEyVDIxOjIyOjA1Ljk4ODQzNTNaO3o2UEpVcDF4NEkwMnhaZlZyaHUzakE9PTt7Ik9yY2hlc3RyYXRpb25TdGVwIjoxfQ%3D%3D%26tx%3DStateProperties%3DeyJUSUQiOiJkZDM4ODdlYi1iMmJmLTRlMjQtOTcxMi04MWY0OWIzODcyMzIifQ%26p%3DB2C_1_sign-in-up-policy%26diags%3D%7B%5C%22pageViewId%5C%22%3A%5C%22081fb9ba-9858-4fa9-a272-9100dfdf81c8%5C%22%2C%5C%22pageId%5C%22%3A%5C%22CombinedSigninAndSignup%5C%22%2C%5C%22trace%5C%22%3A%5B%7B%5C%22ac%5C%22%3A%5C%22T005%5C%22%2C%5C%22acST%5C%22%3A1581542526%2C%5C%22acD%5C%22%3A2%7D%2C%7B%5C%22ac%5C%22%3A%5C%22T021%20-%20URL%3Ahttps%3A%2F%2Fapps.leviton.com%2Fazure%2Flogin.html%5C%22%2C%5C%22acST%5C%22%3A1581542526%2C%5C%22acD%5C%22%3A348%7D%2C%7B%5C%22ac%5C%22%3A%5C%22T029%5C%22%2C%5C%22acST%5C%22%3A1581542526%2C%5C%22acD%5C%22%3A10%7D%2C%7B%5C%22ac%5C%22%3A%5C%22T004%5C%22%2C%5C%22acST%5C%22%3A1581542526%2C%5C%22acD%5C%22%3A3%7D%2C%7B%5C%22ac%5C%22%3A%5C%22T019%5C%22%2C%5C%22acST%5C%22%3A1581542526%2C%5C%22acD%5C%22%3A23%7D%2C%7B%5C%22ac%5C%22%3A%5C%22T003%5C%22%2C%5C%22acST%5C%22%3A1581542526%2C%5C%22acD%5C%22%3A13%7D%2C%7B%5C%22ac%5C%22%3A%5C%22T018We%20can't%20seem%20to%20find%20your%20account%5C%22%2C%5C%22acST%5C%22%3A1581542547%2C%5C%22acD%5C%22%3A419%7D%2C%7B%5C%22ac%5C%22%3A%5C%22T002%5C%22%2C%5C%22acST%5C%22%3A0%2C%5C%22acD%5C%22%3A0%7D%5D%7D%22%5D; _pk_ses.7.c4d1=*
// Upgrade-Insecure-Requests: 1
// _token=scNOzs9pSEkiogPZ6TV6zXGJsjAkSkjINXQnR4r5
// from=2020-02-12T20:00:00.000Z
// to=2020-02-12T21:00:00.000Z
// tz=UTC
// delimiter=comma