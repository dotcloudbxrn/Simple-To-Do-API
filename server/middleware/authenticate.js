var {User} = require('./../models/user');

// this is going to be the middleware function on our
// routes to make them private - we get 3 args
// the actual route is not going to run until next
// gets called in the middleware 
var authenticate = (req, res, next) => {
  var token = req.header('x-auth');
  
    User.findByToken(token)
      .then((user) => {
        // there is a valid token, but the 
        // query could not find a document
        // that matched the parameters we specified
        if(!user) {
          // stops the function execution,
          // sends an error to the catch block and 
          // it sends the 401 status + rejection
          // instead of doing it again here.
          return Promise.reject();
        }
  // modify the request Object inside the call
        req.user = user;
        req.token = token;
        // authentication took place
        next();
      }).catch((e) => {
        // authentication err
        res.status(401).send();
      });
      // TO ADD THE MIDDLEWARE, YOU SIMPLY
      // REFERENCE THE FUNCTION HERE
      // =------------------V--------------
}
//app.get('/users/me', authenticate ,(req, res) => {


module.exports = {authenticate};