const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');


const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {todos,populateTodos, users, populateUsers} = require('./seed/seed')
const {User} = require('./../models/user');

beforeEach(populateUsers);
beforeEach(populateTodos);

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

describe('DELETE /todos/:id', () => {
  it('should remove a todo based on ID', (done) => {
    var hexId = todos[1]._id.toHexString();

    request(app)
    //trigger delete request
      .delete(`/todos/${hexId}`)
      // assert status
      .expect(200)
      // assert that the response body's ID is indeed the one we sent by adding a callback
      // function that links itself the response object that supertest got back from it's request
      // ASSERT THAT THE DATA COMES BACK AS THE RESPONSE BODY
      // MAKE A CUSTOM EXPECT CALL, PASSING IN OUR FUNCTION,
      // WHERE WE HAVE OUR RESPONSE OBJECT PASSED IN

      .expect((res) => {
        expect(res.body.todo._id).toBe(hexId);
        // wrap up and query the DB to confirm the ID is not present in the collection
        // CALL END (METHOD), PASSING IN A CALLBACK, SO WE CAN DO ASYNC THINGS BEFORE WE WRAP UP
        // THE TEST CASE 
        // END GETS CALLED WITH AN ERROR AND RESPONSE (IF YOU REMEMBER - NO I DON'T) 
      }).end((err, res) => {
         // IF THERE IS AN ERROR, WE NEED TO HANDLE THAT, OTHERWISE THERE'S NO NEED TO QUERY THE DB
        if(err) {
          // PASSING IN THE ERROR TO THE DONE CALLBACK THAT IS GOING TO TELL MOCHA - 
          // NOW you can determine whether we failed or not
          return done(err);
        }

        // make the query using find by ID. Thing returns a promise, which you can use 
        // the TODO is actually the success HANDLER
        // IF THERE IS AN ERROR - > Add a catch clause, passing in the error through TO DONE
        // passing in a callback -> the todo variable 
        Todo.findById(hexId).then((todo) => {
          // when you do so, it'll not be there, since you already deleted it
          expect(todo).toNotExist();
          // call done so we're telling Mocha the case should be evaluated
          done();
          // use shortcut
        }).catch((e) => done(e));
      })
  });

  it('should send a 404 if Todo not found', (done) => {
    request(app)
    .delete(`/todos/${new ObjectID().toHexString()}`)
    .expect(404)
    .end(done)
  });

  it('should return 404 if ObjectID is invalid', (done) => {
    var id = 123; 
    request(app)
      .delete(`/todos/${id}`)
      .expect(404)
      // call the end method and pass done
      .end(done)
  });
});



describe('PATCH /todos/:id', ()=> {
  it('should be able to change a value of a property', (done) => {
    var hexId = todos[0]._id.toHexString();

    var newOptions = {
      completed: true,
      text: 'Doing some cool shit!',
    }

    request(app)
      .patch(`/todos/${hexId}`).send(newOptions)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(newOptions.text);
        expect(res.body.todo.completedAt).toBeA('number');
        expect(res.body.todo.completed).toBeA('boolean');
      }).end(done);
  });

  it('should clear completedAt when todo is not completed', (done) => {
    var hexId = todos[1]._id.toHexString();

    var changedStuff = {
      text: 'OMFG, SO COOL!',
      completed: false
    }
    
    request(app)
      .patch(`/todos/${hexId}`).send(changedStuff)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(changedStuff.text);
        expect(res.body.todo.completed).toBeA('boolean').toBe(false);
        expect(res.body.todo.completedAt).toNotExist();
        done();
      }).end((err, res) => {
        if(err) {
          done(err);
        }
      });
  });
});


describe('GET /users/me', () => {
  it('should return user if authenticated', (done) => {
    request(app)
      .get('/users/me')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body._id).toBe(users[0]._id.toHexString());
        expect(res.body.email).toBe(users[0].email);
      })
      .end(done);
  });

  it('should return a 401 if not authenticated', (done) => {
    request(app)
      .get('/users/me')
      .expect(401)
      .expect((res) => {
        expect(res.body).toEqual({});
      })
      .end(done);
  });
});

describe('POST /users', () => {
  it('should create a user', (done) => {
    var email = 'example@example.com';
    var password = '123mnb!';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(200)
      .expect((res) => {
        expect(res.headers['x-auth']).toExist();
        expect(res.body._id).toExist();
        expect(res.body.email).toBe(email);
      })
      .end((err) => {
        if(err) {
          return done(err);
        }

        User.findOne({email}).then((user) => {
          expect(user).toExist();
          expect(user.password).toNotBe(password);
          done();
        }).catch((e) => done(e));
      });
  });

  it('should return validation errors if request invalid', (done) => {
    var email = 'notValid';
    var password = '1';

    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .expect((res) => {
        expect(res.body.name).toBe('ValidationError');
      })
      .end(done);
  });

  it('should not create user if email in use', (done) => {
    var email = 'ato@example.com';
    var password = '123312313';
    request(app)
      .post('/users')
      .send({email, password})
      .expect(400)
      .expect((res) => {
        expect(res.body.code).toBe(11000);
      })
      .end(done);
  });
});

describe('POST /users/login', () => {
  it('should login user and return auth token', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: users[1].email,
        password: users[1].password
      })
      .expect(200)
      .expect((res) => {
        expect(res.header['x-auth']).toExist();
      })
      .end((err, res) => {
        if (err) {
          done(err);
        }
        User.findById(users[1]._id).then((user) => {
          expect(user.tokens[0]).toInclude({
            access: 'auth',
            token: res.headers['x-auth']
          });
          done();
        }).catch((e) => done(e));
      });
  });

  it('should reject invalid login', (done) => {
    request(app)
      .post('/users/login')
      .send({
        email: 'nevermind@gmail.nope',
        password: 'nopeitsnothappening'
      })
      .expect(400)
      .expect((res) => {
        expect(res.header['x-auth']).toNotExist();
      })
      .end((err, res) => {
        if (err) {
          done(err)
        }

        User.findById(users[1]._id).then((user) => {
          expect(user.tokens.length).toBe(0);
          done();
        }).catch((e) => done(e));
      })
  });
});