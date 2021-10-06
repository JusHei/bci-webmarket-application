const express = require('express')
const app = express()
const passport = require('passport')
const BasicStrategy = require('passport-http').BasicStrategy;
const bodyParser = require('body-parser')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid');
const multer  = require('multer') 
const jwt = require('jsonwebtoken');
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
//const upload = multer({ dest: 'uploads/' })
const jwtSecretKey = "mySecretKey";
const secrets = require('./secrets.json')
const postingsSchema = require('./schemas/postings.schema.json');
const usersSchema = require('./schemas/users.schema.json');
const Ajv = require('ajv');
const ajv = new Ajv();
app.use(bodyParser.json());

const postingsValidator = ajv.compile(postingsSchema);
const usersValidator = ajv.compile(usersSchema);

//for saving users and postings
let userDB = [];
let postingsDB = [];

app.set('port', (process.env.PORT || 80));

var storage = cloudinaryStorage({
  cloudinary: cloudinary,
  folder: '', 
  allowedFormats: ['jpg', 'png'],
});

var parser = multer({ storage: storage });

passport.use(new BasicStrategy(
    (username, password, done) => {
        console.log('Basic strategy params, username ' + username + ' , password ' + password);

        const searchResult = userDB.find(user => {
            if(user.username === username) {
                if(bcrypt.compareSync(password, user.password)) {
                    return true;
                }
            }
            return false;
        })
        if(searchResult != undefined) {
            done(null, searchResult);
        } else {
            done(null, false);
        }
    }
));
  
//users can search postings by id
  app.get('/postings/:postingId', passport.authenticate('jwt', { session: false }), (req, res) => {
    const postingInfo = postingsDB.find(posting => posting.postingId === req.params.postingId);
    if(postingInfo === undefined) {
      res.sendStatus(404);
  } else {
    //checking if the logged username matches to the username in the posting
      if(postingInfo.sellerName == req.user.username) {
        res.json(postingInfo);
      } else {
        res.sendStatus(401);
      }
    }
  })
  // users can modify postings
  app.put('/postings/:postingId', parser.array('photos', 4), passport.authenticate('jwt', { session: false }), (req, res) => {
    const postingInfo = postingsDB.find(posting => posting.postingId === req.params.postingId);
    
    if(postingInfo === undefined) {
      res.sendStatus(404);
  } else {
      if (postingInfo.sellerName == req.user.username){
        postingInfo.title = req.body.title;
        postingInfo.description =  req.body.description,
        postingInfo.category = req.body.category,
        postingInfo.location = req.body.location,
        postingInfo.price = req.body.price,
        postingInfo.images = req.files,
        postingInfo.deliveryType = req.body.deliveryType

        const valid = postingsValidator(postingInfo);

        if(!valid) {res.sendStatus(400)} else {res.json(postingInfo);}
        
      } else {
        res.sendStatus(401);
      }
  } 
      
    

  })
// users can delete postings
  app.delete('/postings/:postingId', passport.authenticate('jwt', { session: false }), (req, res) => {
    
    const postingInfo = postingsDB.find(posting => posting.postingId === req.params.postingId);
    
    if(postingInfo === undefined) {
      res.sendStatus(400);
  } else {
      if (postingInfo.sellerName == req.user.username){
        postingsDB.splice(postingsDB.indexOf(postingInfo), 1);
        res.sendStatus(200)
      } else {
        res.sendStatus(401);
      }
    }
  })

  //users can get all their own postings.  
  app.get('/postings', passport.authenticate('jwt', {session: false}), (req, res) => {
    const result = postingsDB.filter(f => f.sellerName === req.user.username);
    if (result === undefined) {
      res.sendStatus(404)
    } else {
      res.json(result);
    }
    
  })
  
  //everyone can search postings by category
  app.get('/search/category/:category', (req, res) => {
    const result = postingsDB.filter(f => f.category === req.params.category);
    
    if(result === undefined) {
      res.sendStatus(400);
   } else {
      res.json(result)
    }

  })

  //everyone can search postings by city location
  app.get('/search/locationCity/:location', (req, res) => {
    const result = postingsDB.filter(f => f.location.city === req.params.location);
    
    if(result === undefined) {
      res.sendStatus(400);
    } else {
      res.json(result)
    }
  })

  //everyone can search postings by country location
  app.get('/search/locationCountry/:location', (req, res) => {
    const result = postingsDB.filter(f => f.location.country === req.params.location);
    
    if(result === undefined) {
      res.sendStatus(400);
    } else {
      res.json(result)
    }
  })

  //everyone can search postings by postal code
  app.get('/search/locationPostalCode/:location', (req, res) => {
    const result = postingsDB.filter(f => f.location.postalCode === req.params.location);
    
    if(result === undefined) {
      res.sendStatus(400);
    } else {
      res.json(result)
    }
  })

//everyone can search postings by posting date
  app.get('/search/dateOfPosting/:dateOfPosting', (req, res) => {
    const result = postingsDB.filter(f => f.dateOfPosting === req.params.dateOfPosting);
    
    if(result === undefined) {
      res.sendStatus(400);
   } else {
      res.json(result)
    }
  
  })

  //users can make new postings. Not all info to the posting is coming from the body. Ex.id and date-time
  app.post('/postings', parser.array('photos', 4), passport.authenticate('jwt', { session: false }), (req, res) => {
   
    var d = new Date();
    var date = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate()
    var time = d.getHours()+ ':' + d.getMinutes()
    const newPosting = {
        postingId: uuidv4(),  
        title: req.body.title,
        description: req.body.description,
        category: req.body.category,
        location: req.body.location,
        price: req.body.price,
        dateOfPosting: date,
        timeOfPosting : time,
        sellerName: req.user.username,
        sellerEmail: req.user.email,
        images: req.files,
        deliveryType: req.body.deliveryType
      }
      //validatinf data from body
      const valid = postingsValidator(newPosting);

      if(!valid) {
        res.sendStatus(400)
      } else {
        postingsDB.push(newPosting)  
        res.sendStatus(201)
      }

  })
//create new user
  app.post('/user', (req, res) => {
      
      const salt = bcrypt.genSaltSync(6);
      const hashedPassword = bcrypt.hashSync(req.body.password, salt);
      var d = new Date();
      var signUpDate = d.getFullYear() + '-' + (d.getMonth()+1) + '-' + d.getDate()
  
      const newUser = {
          id: uuidv4(),
          username: req.body.username,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          email: req.body.email,
          dateOfBirth: req.body.dateOfBirth,
          signUpDate: signUpDate,
          password: hashedPassword,
      }

      const valid = usersValidator(newUser);

      if(!valid) {
        res.sendStatus(400)
      } else {
        userDB.push(newUser);
        res.sendStatus(201);
      }
  })

//jwt authentication implementation 
const options = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secrets.jwtSignKey,
    passReqToCallback: true
  };

passport.use(new JwtStrategy(options, (req, payload, done) => {
    const currentUser = userDB.find(user => user.username == payload.user)
    console.log('user.username: ',userDB.find(user => user.username));
    console.log('payload: ', payload);
    console.log('current user: ',currentUser);
      if (currentUser) {
        req.user = currentUser;
        done(null, currentUser);
      } else {
        done(null, false);
      }
    }));

//user login, http basic
app.post('/login', passport.authenticate('basic', {session: false}), (req, res) => {

    const token = jwt.sign({user: req.user.username}, secrets.jwtSignKey);
  
    res.json({ token : token})
})

app.listen(app.get('port'), function() {
    console.log(`Node app is running on port`, app.get('port'));
  });