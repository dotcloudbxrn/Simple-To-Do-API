const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');
const {Todo} = require('./../models/todo'); 

const todos = [{text: 'first'}, {text: 'second'}, {text: 'third'}];

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
      }).end((err, res) => {
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