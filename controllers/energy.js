/**
 * @Author: Brogan Miner <Brogan>
 * @Date:   2018-12-13T16:05:05-08:00
 * @Email:  brogan.miner@oregonstate.edu
 * @Last modified by:   Brogan
 * @Last modified time: 2019-02-24T12:43:13-08:00
 */

const express = require('express')
const router = express.Router()
const db = require('../db.js')
const fs = require('fs')
const mapData = require('../data/energydashboard/buildings.json')
const meterdefinitions = require('../data/meterdefinitions/all.js')

router.use(require('sanitize').middleware)

// Begin routes
// ROUTES FOR CHANGING DATA
router.post('/story', function (req, res) {
  if (req.session.user && req.session.user.id) {
    if (req.bodyInt('group_id')) {
      db.query('INSERT INTO stories (user_id, group_id, name, description, media) VALUES (?, ?, ?, ?, ?)', [req.session.user.id, req.bodyInt('group_id'), req.bodyString('name'), req.bodyString('description'), req.bodyString('media')]).then(rows => {
        res.status(201).send(JSON.stringify({ id: rows.insertId }))
      }).catch(e => {
        res.status(400).send('400: ' + e.message)
      })
    } else {
      res.status(400).send('400: NO GROUP')
    }
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})
router.put('/story', function (req, res) {
  if (req.session.user && req.session.user.id) {
    if (req.bodyInt('id')) {
      db.query('UPDATE stories SET name = ?, description = ?, media = ? WHERE id = ? AND user_id = ?', [req.bodyString('name'), req.bodyString('description'), req.bodyString('media'), req.bodyInt('id'), req.session.user.id]).then(() => {
        res.status(204).send()
      }).catch(e => {
        res.status(400).send('400: ' + e.message)
      })
    } else {
      res.status(400).send('400: NO ID')
    }
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})
router.delete('/story', function (req, res) {
  if (req.session.user && req.session.user.id) {
    if (req.bodyInt('id')) {
      db.query('DELETE FROM stories WHERE user_id = ? AND id = ?', [req.session.user.id, req.bodyInt('id')]).then(() => {
        res.status(204).send()
      }).catch(e => {
        res.status(400).send('400: ' + e.message)
      })
    } else {
      res.status(400).send('400: NO ID')
    }
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})

router.get('/story', (req, res) => {
  if (req.queryInt('id')) {
    let promises = []
    const id = req.queryInt('id')
    promises.push(db.query('SELECT * FROM stories WHERE id=?', [id]))
    promises.push(db.query('SELECT DATE_FORMAT(date_start, "%Y-%m-%dT%H:%i:00.000Z") AS date_start, DATE_FORMAT(date_end, "%Y-%m-%dT%H:%i:00.000Z") AS date_end, graph_type, story_id, id, name, date_interval, interval_unit FROM blocks WHERE story_id=?', [id]))
    promises.push(db.query('SELECT block_groups.* FROM (SELECT id FROM blocks WHERE story_id=?) AS block LEFT JOIN block_groups ON block.id = block_groups.block_id', [id]))
    promises.push(db.query('SELECT meter_group_relation.*, chart.chart_id, meters.type AS type, meters.negate AS negate FROM (SELECT block_groups.group_id as id, block_groups.id AS chart_id FROM (SELECT id FROM blocks WHERE story_id=?) AS block LEFT JOIN block_groups ON block.id = block_groups.block_id) AS chart LEFT JOIN meter_group_relation ON meter_group_relation.group_id = chart.id JOIN meters ON meter_group_relation.meter_id = meters.id', [id]))
    Promise.all(promises).then(r => {
      let rObj = r[0][0]
      rObj.blocks = r[1]
      rObj.openCharts = r[2]
      rObj.openMeters = r[3]
      res.send(JSON.stringify(rObj))
    }).catch(e => {
      res.status(400).send('400: ' + e.message)
    })
  } else {
    res.status(400).send('400: NO ID')
  }
})

router.post('/group', function (req, res) {
  if (req.session.user && req.session.user.id) {
    db.query('INSERT INTO story_groups (name, user_id) VALUES (?, ?)', [req.bodyString('name'), req.session.user.id]).then(rows => {
      res.status(201).send(JSON.stringify({ id: rows.insertId }))
    }).catch(e => {
      res.status(400).send('400: ' + e.message)
    })
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})
router.put('/group', function (req, res) {
  if (req.session.user && req.session.user.id) {
    if (req.bodyInt('id')) {
      db.query('UPDATE story_groups SET name = ? WHERE id = ? AND user_id = ?', [req.bodyString('name'), req.bodyInt('id'), req.session.user.id]).then(() => {
        res.status(204).send()
      }).catch(e => {
        res.status(400).send('400: ' + e.message)
      })
    } else {
      res.status(400).send('400: NO ID')
    }
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})
router.delete('/group', function (req, res) {
  if (req.session.user && req.session.user.id) {
    if (req.bodyInt('id')) {
      db.query('DELETE FROM story_groups WHERE user_id = ? AND id = ?', [req.session.user.id, req.bodyInt('id')]).then(() => {
        res.status(204).send()
      })
    } else {
      res.status(400).send('400: NO ID')
    }
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})

router.post('/block', function (req, res) {
  if (req.session.user && req.session.user.id) {
    db.query('INSERT INTO blocks (date_start, date_end, graph_type, story_id, name, date_interval, interval_unit) VALUES (?, ?, ?, (SELECT id FROM stories WHERE user_id = ? AND id = ?), ?, ?, ?)', [req.bodyString('date_start'), req.bodyString('date_end'), req.bodyInt('graph_type'), req.session.user.id, req.bodyInt('story_id'), req.bodyString('name'), req.bodyInt('date_interval'), req.bodyString('interval_unit')]).then(rows => {
      res.status(201).send(JSON.stringify({ id: rows.insertId }))
    }).catch(e => {
      res.status(400).send('400: ' + e.message)
    })
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})
router.put('/block', function (req, res) {
  if (req.session.user && req.session.user.id) {
    if (req.bodyInt('id')) {
      db.query('UPDATE blocks INNER JOIN stories on blocks.story_id = stories.id SET blocks.name = ?, blocks.date_start = ?, blocks.date_end = ?, blocks.graph_type = ?, blocks.date_interval = ?, blocks.interval_unit = ? WHERE blocks.id = ? AND stories.user_id = ?', [req.bodyString('name'), req.bodyString('date_start'), req.bodyString('date_end'), req.bodyInt('graph_type'), req.bodyInt('date_interval'), req.bodyString('interval_unit'), req.bodyInt('id'), req.session.user.id]).then(() => {
        res.status(204).send()
      }).catch(e => {
        res.status(400).send('400: ' + e.message)
      })
    } else {
      res.status(400).send('400: NO ID')
    }
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})
router.delete('/block', function (req, res) {
  if (req.session.user && req.session.user.id) {
    if (req.bodyInt('id')) {
      db.query('DELETE blocks FROM blocks INNER JOIN stories ON blocks.story_id = stories.id WHERE stories.user_id = ? AND blocks.id = ?', [req.session.user.id, req.bodyInt('id')]).then(() => {
        res.status(204).send()
      })
    } else {
      res.status(400).send('400: NO ID')
    }
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})

router.post('/chart', function (req, res) {
  if (req.session.user && req.session.user.id) {
    db.query('INSERT INTO block_groups (block_id, group_id, name, point, meter) VALUES ((SELECT blocks.id FROM stories INNER JOIN blocks ON blocks.story_id = stories.id WHERE stories.user_id = ? AND blocks.id = ?), ?, ?, ?, ?)', [req.session.user.id, req.bodyInt('block_id'), req.bodyInt('group_id'), req.bodyString('name'), req.bodyString('point'), req.bodyInt('meter')]).then(rows => {
      res.status(201).send(JSON.stringify({ id: rows.insertId }))
    }).catch(e => {
      res.status(400).send('400: ' + e.message)
    })
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})
router.put('/chart', function (req, res) {
  if (req.session.user && req.session.user.id) {
    if (req.bodyInt('id')) {
      db.query('UPDATE block_groups INNER JOIN (SELECT stories.user_id, blocks.id FROM stories INNER JOIN blocks ON blocks.story_id = stories.id) AS blocks ON blocks.id = block_groups.block_id SET block_groups.group_id = ?, block_groups.name = ?, block_groups.point = ?, block_groups.meter = ? WHERE block_groups.id = ? AND blocks.user_id = ?', [req.bodyInt('group_id'), req.bodyString('name'), req.bodyString('point'), req.bodyInt('meter'), req.bodyInt('id'), req.session.user.id]).then(() => {
        res.status(204).send()
      }).catch(e => {
        res.status(400).send('400: ' + e.message)
      })
    } else {
      res.status(400).send('400: NO ID')
    }
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})
router.delete('/chart', function (req, res) {
  if (req.session.user && req.session.user.id) {
    if (req.bodyInt('id')) {
      db.query('DELETE block_groups FROM block_groups INNER JOIN (SELECT stories.user_id, blocks.id FROM stories INNER JOIN blocks ON blocks.story_id = stories.id) AS blocks ON blocks.id = block_groups.block_id WHERE block_groups.id = ? AND blocks.user_id = ?', [req.bodyInt('id'), req.session.user.id]).then(() => {
        res.status(204).send()
      })
    } else {
      res.status(400).send('400: NO ID')
    }
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})

// Current user info
router.get('/user', function (req, res) {
  if (req.session.user) {
    res.send(JSON.stringify({ name: req.session.user.name, privilege: req.session.user.privilege, id: req.session.user.id }))
  } else if (req.session.UserID) {
    db.query('SELECT * from users WHERE name=?', [req.session.UserID]).then(r => {
      if (r.length <= 0) {
        db.query('INSERT INTO users (name, privilege) VALUES (?, 1)', [req.session.UserID]).then(r => {
          req.session.user = {
            name: req.session.UserID,
            id: r.insertId,
            privilege: 1
          }
          res.send(JSON.stringify(req.session.user))
        }).catch(e => {
          res.status(400).send('400: ' + e.message)
        })
      } else {
        req.session.user = r[0]
        res.send(JSON.stringify(req.session.user))
      }
    }).catch(e => {
      res.status(400).send('400: ' + e.message)
    })
  } else {
    res.send(JSON.stringify({ name: '', privilige: 0, id: null }))
  }
})

// Map Functions
router.get('/map', function (req, res) {
  res.send(mapData)
})

// BUILDINGS
router.get('/buildings', function (req, res) {
  db.query('SELECT id, name FROM meter_groups WHERE is_building=1 ORDER BY NAME ASC').then(rows => {
    res.send(rows)
  }).catch(err => {
    res.status(400).send('400: ' + err.message)
  })
})

// STORIES
router.get('/stories', (req, res) => {
  let query = 'SELECT stories.id AS id, stories.name AS name, stories.description AS description, stories.public AS public, stories.media AS media, stories.group_id AS group_id, story_groups.name AS group_name, story_groups.public AS group_public FROM stories JOIN story_groups ON stories.group_id = story_groups.id WHERE stories.public = 1'
  if (req.session.user) {
    query = 'SELECT stories.id AS id, stories.name AS name, stories.description AS description, stories.public AS public, stories.media AS media, stories.group_id AS group_id, story_groups.name AS group_name, story_groups.public AS group_public FROM stories JOIN story_groups ON stories.group_id = story_groups.id WHERE stories.public = 1 OR stories.user_id = ' + req.session.user.id
  }
  db.query(query).then(rows => {
    res.status(200).send(JSON.stringify(rows))
  }).catch(e => {
    res.status(400).send('400: ' + e.message)
  })
})
// METERS AND DATA
router.get('/data', (req, res) => {
  if (req.queryString('startDate') && req.queryString('endDate') && req.queryInt('id') && req.queryString('point')) {
    let q = 'SELECT DATE_FORMAT(time, "%Y-%m-%dT%H:%i:00.000Z") AS time, ' + req.queryString('point') + ' FROM data WHERE time >= ? AND time <= ? AND meter_id = ? and (accumulated_real is not null or total is not null or cubic_feet is not null) ORDER BY TIME ASC'
    db.query(q, [req.queryString('startDate'), req.queryString('endDate'), req.queryInt('id')]).then(rows => {
      res.send(JSON.stringify(rows))
    }).catch(e => {
      res.status(400).send('400: ' + e.message)
    })
  } else {
    res.status(400).send('400: BAD PARAMS')
  }
})

router.get('/meters', function (req, res) {
  if (req.queryString('id')) {
    db.query('SELECT meters.id AS meter_id, meters.name, meters.type, meter_group_relation.operation, meter_group_relation.group_id FROM meters LEFT JOIN meter_group_relation ON meters.id=meter_group_relation.meter_id WHERE group_id=?', [req.queryString('id')]).then(rows => {
      res.send(JSON.stringify(rows))
    }).catch(err => {
      res.status(400).send('400: ' + err.message)
    })
  } else {
    res.status(400).send('400: NO ID')
  }
})

router.get('/metersbybuilding', function (req, res) {
  db.query('SELECT Q1.name AS building_name, meters.id AS id, meters.name AS meter_name FROM (SELECT meter_groups.name, meter_group_relation.meter_id FROM meter_groups RIGHT JOIN meter_group_relation ON meter_groups.id = meter_group_relation.group_id) AS Q1 LEFT JOIN meters ON meters.id = Q1.meter_id ORDER BY building_name ASC').then(rows => {
    res.send(JSON.stringify(rows))
  }).catch(err => {
    res.status(400).send('400: ' + err.message)
  })
})

router.get('/meterPoints', function (req, res) {
  if (req.queryInt('id')) {
    db.query('SELECT class FROM meters WHERE id = ?', [req.queryInt('id')]).then(r => {
      res.send(JSON.stringify(Object.values(meterdefinitions[r[0].class])))
    })
  } else {
    res.status(400).send('400: NO ID')
  }
})

router.get('/alerts', function (req, res) {
  if (req.session.user && req.session.user.id) {
    db.query('SELECT Q2.meter_id AS meter_id, Q2.point AS point, Q2.threshold AS threshold, Q2.id AS id, Q2.meter_name AS meter_name, meter_groups.name AS building_name FROM (SELECT Q1.meter_id AS meter_id, Q1.point AS point, Q1.threshold AS threshold, Q1.name AS meter_name, Q1.id AS id, meter_group_relation.group_id as group_id  FROM (SELECT alerts.point AS point, alerts.threshold AS threshold, meters.id AS meter_id, alerts.id AS id, meters.name AS name FROM alerts LEFT JOIN meters ON alerts.meter_id = meters.id WHERE alerts.user_id = ?) AS Q1 LEFT JOIN meter_group_relation ON Q1.meter_id = meter_group_relation.meter_id) AS Q2 LEFT JOIN meter_groups ON Q2.group_id = meter_groups.id', [req.session.user.id]).then(r => {
      res.send(JSON.stringify(r))
    }).catch(e => {
      res.status(400).send('400: ' + e.message)
    })
  } else {
    res.status(403).send('403: NOT LOGGED IN')
  }
})
// ALERTS
router.post('/alert', function (req, res) {
  if (req.session.user && req.session.user.id && req.session.user.privilege >= 2) {
    db.query('INSERT INTO alerts (user_id, meter_id, point, threshold) VALUES (?, ?, ?, ?)', [req.session.user.id, req.bodyString('meter_id'), req.bodyString('point'), req.bodyInt('threshold')]).then(r => {
      res.status(201).send(JSON.stringify({ id: r.insertId }))
    }).catch(e => {
      res.status(400).send('400: ' + e.message)
    })
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})

router.put('/alert', function (req, res) {
  if (req.session.user && req.session.user.id && req.bodyInt('id')) {
    db.query('UPDATE alerts SET point = ?, threshold = ? WHERE id = ? AND user_id = ?', [req.bodyString('point'), req.bodyInt('threshold'), req.bodyInt('id'), req.session.user.id]).then(r => {
      res.status(204).send()
    }).catch(e => {
      res.status(400).send('400: ' + e.message)
    })
  } else {
    res.status(400).send('400: NO ID OR NOT LOGGED IN')
  }
})

router.delete('/alert', function (req, res) {
  if (req.session.user && req.session.user.id) {
    db.query('DELETE alerts FROM alerts WHERE user_id = ? AND id = ?', [req.session.user.id, req.bodyInt('id')]).then(r => {
      res.status(204).send()
    }).catch(e => {
      res.status(400).send('400: ' + e.message)
    })
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})

// CAMPAIGNS
router.get('/campaign', function (req, res) {
  if (req.queryInt('id')) {
    let concurrentQuery = []
    concurrentQuery.push(db.query('SELECT DATE_FORMAT(date_start, "%Y-%m-%dT%H:%i:00.000Z") AS date_start, DATE_FORMAT(date_end, "%Y-%m-%dT%H:%i:00.000Z") AS date_end, DATE_FORMAT(compare_start, "%Y-%m-%dT%H:%i:00.000Z") AS compare_start, DATE_FORMAT(compare_end, "%Y-%m-%dT%H:%i:00.000Z") AS compare_end, name, id, media FROM campaigns WHERE id = ?', [req.queryInt('id')]))
    concurrentQuery.push(db.query('SELECT campaign_groups.group_id AS id, campaign_groups.goal AS goal, meter_groups.name AS name FROM campaign_groups JOIN meter_groups ON campaign_groups.group_id = meter_groups.id WHERE campaign_groups.campaign_id = ?', [req.queryInt('id')]))
    Promise.all(concurrentQuery).then(r => {
      const returnedCampaign = { ...r[0][0], groups: r[1] }
      res.send(JSON.stringify(returnedCampaign))
    }).catch(e => {
      res.status(400).send('400: ' + e.message)
    })
  } else {
    res.status(400).send('400: NO ID')
  }
})

router.get('/campaigns', function (req, res) {
  db.query('SELECT * FROM campaigns').then(r => {
    res.send(JSON.stringify(r))
  }).catch(e => {
    res.status(400).send('400: ' + e.message)
  })
})

// Photos
router.get('/media', function (req, res) {
  fs.readdir('data/energydashboard/images/', (e, files) => {
    if (!e) {
      res.send(JSON.stringify(files.filter(file => {
        return file.toLowerCase().indexOf('.png') !== -1 || file.toLowerCase().indexOf('.jpg') !== -1
      })))
    } else { res.status(400).send('400: ' + e.message) }
  })
})

router.use('/images', express.static('data/energydashboard/uploads/'))
router.use('/images', express.static('data/energydashboard/images/'))

// ADMIN TOOLS
router.get('/allusers', function (req, res) {
  if (req.session.user.privilege >= 5) {
    db.query('SELECT * FROM users').then(r => {
      res.send(JSON.stringify(r))
    }).catch(e => {
      res.status(400).send('400: ' + e.message)
    })
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})
router.put('/user', function (req, res) {
  if (req.session.user.privilege >= 5) {
    db.query('UPDATE users SET privilege = ? WHERE id = ?', [req.bodyInt('privilege'), req.bodyInt('id')]).then(() => {
      res.status(204).send()
    }).catch(e => {
      res.status(400).send('400: ' + e.message)
    })
  } else {
    res.status(403).send('403: NOT AUTHORIZED')
  }
})

module.exports = router
