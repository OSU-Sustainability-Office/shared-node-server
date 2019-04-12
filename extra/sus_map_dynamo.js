/**
 * @Author: Brogan Miner <Brogan>
 * @Date:   2019-04-09T10:11:35-07:00
 * @Email:  brogan.miner@oregonstate.edu
 * @Last modified by:   Brogan
 * @Last modified time: 2019-04-09T14:36:44-07:00
 */
require('dotenv').config()
const ddb = require('../ddb.js')
const APIToken = require('../controllers/api.js')
const SMBuilding = require('./SMBuilding.js')
const axios = require('axios')
const L = require('leaflet-headless')
const fs = require('fs')

ddb.initialize()

let categoryForSub = (name, sub) => {
  const map = {
    'Bike Lockers': 'Transportation',
    'Bike Fix-it Station': 'Transportation',
    'Electric Vehicle Chargers': 'Transportation',
    'Bioswale': 'Water Management',
    'Sewer Access Structure': 'Water Management',
    'Bottle Refill': 'Bottle Refill Station',
    'Eco2Go Return': 'Eco2Go Return'
  }
  if (sub !== 'Tour POI') {
    return (map[sub]) ? map[sub] : 'Food'
  } else {
    return (map[name]) ? map[name] : 'error_no_cat'
  }
}

let main = async () => {
  let featureGroups = await (await ddb.query('sus_map').scan({
    'Select': 'ALL_ATTRIBUTES'
  })).Items[0].features
  const token = await APIToken()
  let buildings = await (await axios('https://api.oregonstate.edu/v1/locations?type=building&page[size]=10000', { method: 'get', headers: { Authorization: 'Bearer ' + token } })).data.data
  let correctedBuildings = []
  let leftOverFeatures = []
  for (let featureGroup of featureGroups) {
    let featuresCopy = Array.from(featureGroup.items)
    let index = 0
    for (let feature of featureGroup.items) {
      try {
        let featureLL = L.geoJSON(feature).getBounds().getCenter()
        for (let building of buildings) {
          building = new SMBuilding(building)
          try {
            let buildingBounds = L.geoJSON(building).getBounds()
            if (buildingBounds.contains(featureLL)) {
              let category = categoryForSub(feature.properties.Name, featureGroup.name)
              console.log(featureGroup.name)
              if (category !== 'Bottle Refill Station' && category !== 'Eco2Go Return') {
                console.log(category)
                building.properties.sustainableFeatures.find(e => { return e.name === category }).items.find(e => { return e.name === feature.properties.Name }).items.push(feature)
              } else {
                building.properties.sustainableFeatures.find(e => { return e.name === category }).items.push(feature)
              }
              correctedBuildings.push(building)
              featuresCopy.splice(index, 1)
              index++
              break
            }
          } catch (e) {
            // console.log(e.message)
          }
        }
      } catch (e) {
        // console.log(e.message)
      }
    }
    leftOverFeatures = leftOverFeatures.concat(featuresCopy)
  }
  fs.writeFileSync('./sus_map_data.json', JSON.stringify(correctedBuildings))
  fs.writeFileSync('./sus_map_data_bad.json', JSON.stringify(leftOverFeatures))
}
main()
