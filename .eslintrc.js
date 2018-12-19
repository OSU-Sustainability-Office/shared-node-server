/**
 * @Author: Brogan Miner <Brogan>
 * @Date:   2018-09-24T12:16:44-07:00
 * @Email:  brogan.miner@oregonstate.edu
 * @Last modified by:   Brogan
 * @Last modified time: 2018-12-19T14:08:10-08:00
 */

module.exports = {
    "extends": "standard",
    "overrides" : [
      {
        "files" : ["tests/index.js"],
        "env": {
          "mocha": true
        }
      }
    ]
};
