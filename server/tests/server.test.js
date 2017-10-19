const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');


const {app} = require('./../server');
const {Todo} = require('./../models/todo');

const todos = [
  {
    text: 'first',
    _id: new ObjectID()
  },
  {
    text: 'second',
    _id: new ObjectID()
  },
  {
    text: 'third',
    _id: new ObjectID()
  }];

beforeEach((done) => {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
});

describe('POST /todos', () => {
  it('should create a new Todo', (done) => {
    var text = 'Testing string for Todo';

    request(app)
      .post('/todos')
      // converted to JSON by supertest
      .send({text})
      .expect(200)
      // custom assertion do get passed to the response 
      .expect((res) => {
        // 
        expect(res.body.text).toBe(text)
      }).end((err) => {
        if (err) {
          return done(err);
        }

        //fetch all todos
        Todo.find().then((todos) => {
          expect(todos.length).toBe(4);
          // expect(todos[0].text).toBe(text);
          done();
        }).catch((e) => done(e));
      })
  });

  it('should not create todo with invalid body data', (done) => {
    
    request(app)
      .post('/todos')
      .send({})
      .expect(400)
      .end((err, res) => {
        if(err) {
          return done(err);
        }
      })

      Todo.find().then((todos) => {
        expect(todos.length).toBe(3);
        done();
      }).catch((e) => done(e));
  });
});

describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
      .get('/todos')
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(3);
      })
      .end(done);
  });
});

console.log(`the string is ${todos[0]._id.toHexString()}`);


describe('GET /todos/:id', () => {
  // it is an async, so we have to provide a callback function
  it('should return todo doc', (done) => {
    request(app)
    // is an objectID - we convert it 
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .expect(200)
      // create a custom EXPECT CALL
      // gets called with the response object
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done)
  }); 

  it('should return a 404 if Todo is not found', (done) => {
    request(app)
      .get(`/todos/${new ObjectID().toHexString()}`)
      .expect(404)
      .end(done)
  });

  it('should return a 404 if Todo does not have a valid ObjectID', (done) => {
    var id = 123; 
    request(app)
      .get(`/todos/${id}`)
      .expect(404)
      // call the end method and pass done
      .end(done)
  })
});
