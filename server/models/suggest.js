// user model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;


var Suggest = new Schema({
  suggest: String,
  Key_signed_for_server : String,
  HashSigned : String
});


module.exports = mongoose.model('suggests', Suggest);