var mongoose = require('mongoose')

// create a new model, takes two args - name and properties
var Todo = mongoose.model('Todo', {
  text: {
    // those are all "validators"
    type: String,
    required: true,
    minlength: 1
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Number,
    default: null
  }
});

module.exports = {Todo};