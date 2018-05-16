var mongoose = require('mongoose'),
    config = require('./config.js');

var state = {
  map: null,
  carbon: null
}

exports.connect = function(done) {
  if (state.db) return done()
    state.carbon = mongoose.createConnection(config.db.carbonData);
    state.map = mongoose.createConnection(config.db.mapData);
    done();
}

exports.get = function(s) {
  if (s === "map") {
    return state.map;
  }
  else if (s === "carbon") {
    return state.carbon;
  }
}

exports.close = function(done) {
  if (state.map) {
    state.map.close(function(err, result) {
      state.map = null
      done(err)
    })
  }
  if (state.carbon) {
    state.carbon.close(function(err, result) {
      state.carbon = null
      done(err)
    })
  }
}