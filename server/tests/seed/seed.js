const {ObjectID} = require('mongodb');
const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');
const jwt = require('jsonwebtoken');


const userOneID =  new ObjectID();
const userTwoID = new ObjectID();
const userThreeID = new ObjectID();

const todos = [
  {
    text: 'first',
    completed: true,
    completedAt: 333,
    _id: new ObjectID(),
    _creator: userOneID
  },
  {
    text: 'second',
    completed: false,
    _id: new ObjectID(),
    _creator: userTwoID
  },
  {
    text: 'third',
    _id: new ObjectID(),
    _creator: userThreeID
  }];

const users = [
  {
    _id: userOneID,
    email: 'ato@example.com',
    password: 'user1pass',
    tokens: [{
      access: 'auth',
      token: jwt.sign({_id: userOneID, access: 'auth'}, 'ato').toString()
    }]
  },
  {
    _id: userTwoID,
    email: 'neAto@example.com',
    password: 'plaintextyo',
    tokens: [{
      access: 'auth',
      token: jwt.sign({_id: userTwoID, access: 'auth'}, 'ato').toString()
    }]
  }
]


const populateTodos = (done) => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
};


const populateUsers = (done) => {
  User.remove({}).then(() => {
    var userOne = new User(users[0]).save();
    var userTwo = new User(users[1]).save();

    return Promise.all([userOne, userTwo])
  }).then(() => done());
}


module.exports = {
  todos,
  populateTodos,
  users,
  populateUsers
}