/**
 * @Author: Brogan Miner <Brogan>
 * @Date:   2018-12-19T13:48:13-08:00
 * @Email:  brogan.miner@oregonstate.edu
 * @Last modified by:   Brogan
 * @Last modified time: 2019-04-12T13:00:59-07:00
 */

const assert = require('assert')
const app = require('../nodeServer.js')
const axios = require('axios')
const fs = require('fs')

function isEqual (A, B) {
  if (typeof A === typeof B) {
    if (typeof A === 'string' || typeof A === 'number' || typeof A === 'boolean' || typeof A === 'symbol') {
      return A === B
    } else if (typeof A === 'object') {
      if (Array.isArray(A) && Array.isArray(B)) {
        // Both Arrays
        if (A.length === B.length) {
          for (let i = 0; i < A.length; i++) {
            if (!isEqual(A[i], B[i])) {
              return false
            }
          }
          return true
        } else {
          return false
        }
      } else if (!Array.isArray(A) && !Array.isArray(B)) {
        // Both Objects
        let Akeys = Object.keys(A)
        let Bkeys = Object.keys(B)

        if (Akeys.length === Bkeys.length) {
          for (let key of Akeys) {
            if (!isEqual(A[key], B[key])) {
              return false
            }
          }
          return true
        } else {
          return false
        }
      } else {
        return false
      }
    } else if (typeof A === 'function') {
      // I dont know why this would be a thing
      return false
    } else {
      // Pretty much undefined === undefined
      return true
    }
  } else {
    return false
  }
}

describe('Begin Testing', function () {
  this.timeout(4000)

  describe('Server', function () {
    it('Can start', (done) => {
      app.start(done)
    })
  })

  let testModules = []

  describe('Load Tests', () => {
    it('Can Load Tests', done => {
      fs.readdir('tests/modules', (e, files) => {
        if (e) { done(e) }
        for (let fileName of files) {
          testModules.push(require('./modules/' + fileName))
        }
        done()
      })
    })
  })

  after(() => {
    for (let testModule of testModules) {
      describe(testModule.name, () => {
        for (let test of testModule.tests) {
          it(test.name, done => {
            axios(test.request).then(res => {
              assert(isEqual(res.data, test.assertedData))
              done()
            }).catch(e => {
              done(e)
            })
          })
        }
      })
    }
  })
})
after((done) => {
  app.close(done)
})
