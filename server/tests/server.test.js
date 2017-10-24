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
      .set('x-auth', users[0].tokens[0].token)
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text)
      }).end((err) => {
        if (err) {
          return done(err);
        }

        Todo.find().then((todos) => {
          expect(todos.length).toBe(4);
          done();
        }).catch((e) => done(e));
      })
  });

  it('should not create todo with invalid body data', (done) => {
    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
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
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todos.length).toBe(1);
      })
      .end(done);
  });
});

describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
      .get(`/todos/${todos[0]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(todos[0].text);
      })
      .end(done)
  }); 

  it('should not return todo doc created by another user', (done) => {
    request(app)
      .get(`/todos/${todos[1]._id.toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  }); 

  it('should return a 404 if Todo is not found', (done) => {
    request(app)
      .get(`/todos/${new ObjectID().toHexString()}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done)
  });

  it('should return a 404 if Todo does not have a valid ObjectID', (done) => {
    var id = 123; 
    request(app)
      .get(`/todos/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done)
  })
});

describe('DELETE /todos/:id', () => {
  it('should remove a todo based on ID', (done) => {
    var hexId = todos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo._id).toBe(hexId);
      }).end((err, res) => {
        if(err) {
          return done(err);
        }
        Todo.findById(hexId).then((todo) => {
          expect(todo).toNotExist();
          done();
        }).catch((e) => done(e));
      });
  });

  it('shouldn\'t remove a todo based on ID, if created by another user', (done) => {
    var hexId = todos[1]._id.toHexString();

    request(app)
      .delete(`/todos/${hexId}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end((err, res) => {
        if(err) {
          return done(err);
        }
        Todo.findById(hexId).then((todo) => {
          expect(todo).toExist();
          done();
        }).catch((e) => done(e));
      });
  });

  it('should send a 404 if Todo not found', (done) => {
    request(app)
    .delete(`/todos/${new ObjectID().toHexString()}`)
    .set('x-auth', users[1].tokens[0].token)
    .expect(404)
    .end(done)
  });

  it('should return 404 if ObjectID is invalid', (done) => {
    var id = 123; 
    request(app)
      .delete(`/todos/${id}`)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
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
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.body.todo.text).toBe(newOptions.text);
        expect(res.body.todo.completedAt).toBeA('number');
        expect(res.body.todo.completed).toBeA('boolean');
      }).end(done);
  });

  it('shouldn\'t be able to change a value of a property another user has set or owns', (done) => {
    var hexId = todos[0]._id.toHexString();

    var newOptions = {
      completed: true,
      text: 'Doing some cool shit!',
    }

    request(app)
      .patch(`/todos/${hexId}`).send(newOptions)
      .set('x-auth', users[1].tokens[0].token)
      .expect(404)
      .end(done);
  });

  it('should clear completedAt when todo is not completed', (done) => {
    var hexId = todos[1]._id.toHexString();

    var changedStuff = {
      text: 'OMFG, SO COOL!',
      completed: false
    }
    
    request(app)
      .patch(`/todos/${hexId}`).send(changedStuff)
      .set('x-auth', users[1].tokens[0].token)
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
          expect(user.tokens[1]).toInclude({
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
          expect(user.tokens.length).toBe(1);
          done();
        }).catch((e) => done(e));
      })
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logout', (done) => {
    request(app)
      .delete('/users/me/token')
      .set('x-auth', users[0].tokens[0].token)
      .expect(200)
      .expect((res) => {
        expect(res.header['x-auth']).toNotExist();
      })
      .end((err, res) => {
        if (err) {
          done (err);
        }
        User.findById(users[0]._id).then((user) => {
          expect(user.tokens.length).toBe(0);
          done();
        }).catch((e) => done(e));
      })
  });
});