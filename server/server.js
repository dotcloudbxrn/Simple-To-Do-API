require('./config/config');

const express = require('express');
const bodyParser = require('body-parser');
const _ = require('lodash');

const {ObjectID} = require('mongodb');
const {mongoose} = require('./db/mongoose')
const {Todo} = require('./models/todo')
const {User} = require('./models/user')

var app = express();
const port = process.env.PORT;

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
  var todo = new Todo({
    text: req.body.text
  });
  todo.save().then((data) => {
    res.send(data);
  }, (err) => {
    res.status(400).send(err);
  })
});

app.get('/todos', (req, res) => {
  Todo.find().then((todos) => {
    // better sending an object, than an array
    res.send({todos});
  }, (e) => {
    //handle error
    res.status(400).send(e);
  })
});

app.get('/todos/:id', (req, res)=> {
  var id = req.params.id;
  if(!ObjectID.isValid(id)) {
    res.status(404).send();
  }

  Todo.findById(id).then((todo) => {
    if(!todo) {
      res.status(404).send();
    }
    res.status(200).send({todo});
  }).catch((e) => {
    res.status(400).send();
  });
})

app.delete('/todos/:id', (req, res) => {
  var id = req.params.id;
  if(!ObjectID.isValid(id)){
    return res.status(404).send();
  }

  Todo.findByIdAndRemove(id).then((todo) => {
    if(!todo) {
      return res.status(404).send();
    }
    res.send({todo});
  }).catch((e) => {
    // catch any potential errors in all of them
    res.status(400).send();
  })
});

app.patch('/todos/:id', (req, res) => {
  var id = req.params.id;
  // where updates are going to be stored. - if you wanna set the todo's text to something else 
  // I would make a patch request, set the text property = whatever the todo text to be
  // problem is, you can send ANY property along - as in add random stuff 
  // or they can send properties we don't want them to update 
  // completedAt for example


  // for that, we use the pick method - it takes an object, then an array of properties
  // you wanna pick off if they exist -> for example -> if the text prop exists, pick it off the req body, 
  // adding it to body, this is something the should be able to update 
  var body = _.pick(req.body, ['text', 'completed']);
  
  if(!ObjectID.isValid(id)) {
    return res.status(404).send();
  }

  // checking the completed value and using that value to set completedAt.
  // if this is a boolean and is true 
  if(_.isBoolean(body.completed) && body.completed) {
    // returns a javascript timestamp -> amount of seconds since jan 1 1970 -> called unix epic?
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }

  //takes three arguments, id, 
  //then MONGODB OPERATORS
  Todo.findByIdAndUpdate(id,
     {
       // set the values on our OBJECT
       // set takes a set of key-value pairs and these are going to be set.
       // we already have generated this object, and it happens to be called body - look above
       $set: body
     },
     // now it's time for OPTIONS
    {
      // similar to returnOriginal : false. Look up the mongodb-update
      new: true
    })
    //now we can tack on the then callback and the catch callback for success / error code
    .then(
      // if things go well -> we'll get our todo doc back, if not -> we'll get an error argument, 
      (todo) => {
        // check if todo object exists
        if (!todo) {
          return res.status(404).send();
        }
        // we were able to find the object and it was updated
        res.send({todo});
      }
    ).catch((e) => {
      res.status(400).send();
    });
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
});

module.exports = {app};