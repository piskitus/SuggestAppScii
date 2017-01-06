// user model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Suggest = new Schema({
  suggest: String
});


module.exports = mongoose.model('suggests', Suggest);