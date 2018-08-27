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
    state.ddb = new AWS.DynamoDB()
}

exports.getUser = function(onid) {
	// AWS SDK DDB Query Parameters - https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_GetItem.html
	const params = {
		'ConsistentRead': true, // Ensures that the latest data is being downloaded
		'Key': {
			 'onid' : { S: onid }
		},
		'ReturnConsumedCapacity': 'NONE',
		'TableName': 'users'
	}
  return new Promise((resolve, reject) => {
    state.ddb.getItem(params, function (err, data) {
      if (err) { return reject(err) }
      resolve(data)
    })
  })
}
