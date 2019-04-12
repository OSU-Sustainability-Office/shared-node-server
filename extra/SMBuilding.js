/**
 * @Author: Brogan Miner <Brogan>
 * @Date:   2019-03-27T14:25:30-07:00
 * @Email:  brogan.miner@oregonstate.edu
 * @Last modified by:   Brogan
 * @Last modified time: 2019-04-09T14:28:14-07:00
 */

class SMBuilding {
  constructor (buildingJSON) {
    this.type = 'Feature'
    this.id = buildingJSON.id
    this.properties = {
      name: buildingJSON.attributes.name,
      description: '',
      sustainableFeatures: [
        { name: 'Food',
          items: [
            { name: 'Vegan', items: [] },
            { name: 'Vegetarian', items: [] },
            { name: 'Local', items: [] },
            { name: 'Halal', items: [] },
            { name: 'Gluten-Free', items: [] },
            { name: 'Make Cents', items: [] }
          ]
        },
        { name: 'Transportation',
          items: [
            { name: 'Bike Lockers', items: [] },
            { name: 'Bike Fix-it Station', items: [] },
            { name: 'Electric Vehicle Chargers', items: [] }
          ]
        },
        { name: 'Eco2Go Return',
          items: []
        },
        { name: 'Bottle Refill Station',
          items: []
        },
        { name: 'Water Management',
          items: [
            { name: 'Bioswale', items: [] },
            { name: 'Sewer Access Structure', items: [] },
            { name: 'Rain Garden', items: [] },
            { name: 'Rain Collection', items: [] }
          ]
        }
      ]
    }
    this.geometry = buildingJSON.attributes.geometry
  }

  query (regEx) {
    return this.properties.Name.match(regEx)
  }
}

module.exports = SMBuilding
