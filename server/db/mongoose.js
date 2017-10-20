var mongoose = require('mongoose');

// Configure mongoose 
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI);

module.exports = {mongoose}

