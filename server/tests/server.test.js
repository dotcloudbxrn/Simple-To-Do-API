const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');
const {Todo} = require('./../models/todo'); 

beforeEach((done) => {
  Todo.remove({}).then(() => done())
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
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
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
        expect(todos.length).toBe(0);
        done();
      }).catch((e) => done(e));
  });
});