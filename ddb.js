/**
 * @Author: Jack Woods <jackrwoods>
 * @Date:   2018-12-14T13:18:19-08:00
 * @Filename: ddb.js
 * @Last modified by:   Jack Woods
 * @Last modified time: 2019-01-15T11:34:53-08:00
 * @Copyright: 2018 Oregon State University
 */

// Initialize AWS SDK
// On Linux, AWS loads user credentials from ~/.aws/credentials.
// For more information, take a look at https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html
var AWS = require('aws-sdk')
AWS.config.update({region: 'us-west-2'})

var state = {
  ddb: null
}

exports.initialize = function () {
  if (!state.ddb) {
    state.ddb = new AWS.DynamoDB.DocumentClient()
  }
}

// This function querys the DynamoDB for the specified user's data.
exports.getUser = function (onid) {
  // AWS SDK DDB Query Parameters - https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB/DocumentClient.html#query-property
  const params = {
    'TableName': 'users',
    'Select': 'ALL_ATTRIBUTES',
    'Limit': 1,
    'ConsistentRead': true,
    'KeyConditionExpression': 'onid = :onid',
    'ExpressionAttributeValues': {
      ':onid': onid
    }
  }
  // Using a promise allows for promise chains.
  return new Promise((resolve, reject) => {
    state.ddb.query(params, function (err, data) {
      if (err || data.Items.length === 0) { return reject(err) }
      resolve(data.Items[0])
    })
  })
}

// Uploads a user to the db.
var putUser = function (usr) {
  // AWS SDK DDB Query Parameters - https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html
  const params = {
    'TableName': 'users',
    'Item': usr
  }

  return new Promise((resolve, reject) => {
    state.ddb.put(params, function (err, data) {
      if (err) { return reject(err) }
      resolve(data)
    })
  })
}

// This function compares the user object specified to the corresponding user item
// in the DynamoDB.
//      - if the user does not exist, a new user is created with the given data.
//      - if the user exists, then the function compares the user's data and
//        updates data objects as necessary. Data objects in the database with
//        the same date as new data objects will be updated.
exports.updateUser = function (usr) {
  // Determine if the user exists.
  this.getUser(usr.onid).then(function (dbUsr) {
    // User exists.

    // Map data elements to their dates
    const dataMap = dbUsr.data.map(d => d.date)

    // Iterate over the new data
    usr.data.forEach(function (data, index, dataArr) {
      // Search dataMap for the current data's date
      let i = dataMap.indexOf(data.date)
      // If the date is found, replace the data object with the most recent
      if (i > -1) dbUsr.data.splice(i, 1, dataArr[index])
      // Otherwise, add the data to the list
      else dbUsr.data.push(dataArr[index])

      // Upload the new user ddb item
      putUser(dbUsr).catch((rej) => {
        console.log(rej)
      })
    })
  }).catch((rej) => {
    // User does not exist.
    // The user's ddb item will be created
    putUser(usr).catch((rej) => {
      console.log(rej)
    })
  })
}

exports.removeData = function (UserID, qid) {
  // AWS SDK DDB Query Parameters - https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_UpdateItem.html
  const params = {
    'TableName': 'users',
    'Key': {
      'onid': UserID
    },
    'KeyConditionExpression': 'onid = :onid',
    'ExpressionAttributeValues': {
      ':onid': UserID
    },
    'UpdateExpression': 'REMOVE data[' + qid + ']'
  }

  // Run query
  return new Promise((resolve, reject) => {
    state.ddb.query(params, function (err, data) {
      if (err) { return reject(err) }
      resolve(data)
    })
  })
}

// This function querys the DynamoDB for the CC questions.
exports.getQuestions = function () {
  // AWS SDK DDB Scan Parameters - https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_Scan.html
  const params = {
    'TableName': 'carbon-calculator-questions',
    'Limit': 10,
    'Select': 'ALL_ATTRIBUTES'
  }
  // Using a promise allows for promise chains.
  return new Promise((resolve, reject) => {
    state.ddb.scan(params, function (err, data) {
      if (err || data.Items.length === 0) { return reject(err) }
      resolve(data.Items)
    })
  })
}
