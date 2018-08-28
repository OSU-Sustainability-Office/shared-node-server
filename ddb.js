// Initialize AWS SDK
// On Linux, AWS loads user credentials from ~/.aws/credentials.
// For more information, take a look at https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/loading-node-credentials-shared.html
var AWS = require('aws-sdk')
AWS.config.update({region: 'us-west-2'});

var state = {
  ddb: null
}

exports.initialize = function() {
  if (!state.ddb)
    state.ddb = new AWS.DynamoDB.DocumentClient()
}

exports.getUser = function(onid) {
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
      if (err) { return reject(err) }
      resolve(data.Items[0])
    })
  })
}

exports.updateUser = function(usr) {
	// AWS SDK DDB Query Parameters - https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_PutItem.html
  const params = {
		'TableName': 'users',
    'Item': usr,
	}
  return new Promise((resolve, reject) => {
    state.ddb.put(params, function (err, data) {
      if (err) { return reject(err) }
      resolve(data)
    })
  })
}
