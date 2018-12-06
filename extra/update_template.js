const fs = require('fs')
require('dotenv').config({path: '../.env'})
const AWS = require('aws-sdk')
AWS.config.update({region: 'us-west-2'})

fs.readFile('./email_template.html', 'utf-8', (err, data) => {
  if (err) {
    console.error(err, err.stack)
  }
  let params = {
    Template: {
      TemplateName: 'Alert_Template', /* required */
      HtmlPart: data,
      SubjectPart: 'Alert - {{ building_name }} {{ meter_name }}',
      TextPart: 'Your alert for {{ building_name }} was triggered. The {{ meter_point }} of {{ meter_name }} exceded your threshold value of {{ threshold_value }} with a value of {{ current_value }}'
    }
  }
  let templatePromise = new AWS.SES({apiVersion: '2010-12-01'}).updateTemplate(params).promise()

  templatePromise.then(
    function (data) {
      console.log(data)
    }).catch(
    function (err) {
      console.error(err, err.stack)
    })
})
