var mongoose = require('mongoose');
console.log('test: ', process.env['DB_'+process.env.enviornment]);
mongoose.connect(process.env['DB_'+process.env.enviornment]);

module.exports = mongoose;