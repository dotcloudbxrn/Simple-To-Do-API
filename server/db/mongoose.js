var mongoose = require('mongoose');

// Configure mongoose 
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/TodoApp');

module.exports = {mongoose}