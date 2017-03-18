var mongoose = require('mongoose');
var config = { autoIndex: true };

mongoose.Promise = require('bluebird');
// if(process.env.enviornment === 'production') config.autoIndex = false;

mongoose.connect(process.env['DB_'+process.env.enviornment], { config: config });

module.exports = mongoose;