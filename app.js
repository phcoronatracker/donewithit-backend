require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const findOrCreate = require("mongoose-findorcreate");
const argon2 = require("./src/password");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const app = express();
const port = process.env.PORT || 9000;

app.set('trust proxy', 1);
app.use(bodyParser.json());
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false },
}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.DB_URL, { dbName: "donewithit", useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true }).then(() => {
    console.log("Connected to Atlas Cluster successfully!");
}).catch((err) => console.log(err));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: {
        type: String,
        minlength: 8
    },
}, { versionKey: false });

const encKey = process.env.ENC_KEY; //32-byte length 64-bit characters
const sigKey = process.env.SIG_KEY; //64-byte length 64-bit characters

userSchema.plugin(encrypt, { encryptionKey: encKey, signingKey: sigKey, encryptedFields:['password'] });
//userSchema.plugin(findOrCreate);

const User = mongoose.model('User', userSchema);

// use static serialize and deserialize of model for passport session support
passport.serializeUser((user, done) => {
    done(null, user._id);
});
passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});

// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({ email: username }, function (err, user) {
            if(err) { 
                console.log("Error:", err);
                return done(err); 
            }
            else if(!user) { 
                console.log("No user");
                return done(null, false); 
            }
            else {
                argon2.password_verify(user.password, password).then(match => {
                    if(!match) { 
                        console.log("Password not match")
                        return done(null, false);  
                    }
                    console.log("Password match");
                    return done(null, user);
                });
            }
        });
    }
));

app.get('/auth', (req, res) => {
    if(req.isAuthenticated())
        res.json({ auth: true });
    else
        res.json({ auth: false });
})

app.post('/', (req, res) => {
    console.log(req.body);
    const user = new User({
        email: req.body.email,
        password: req.body.password
    })

    req.login(user, err => {
        if(err) throw err;
        console.log("No error");
        //Creates a local cookie
        passport.authenticate('local')(req, res, () => {
            console.log("Auth Success!");
            res.redirect('/auth');
        });
    });
})

app.post('/register', (req, res) => {
    console.log(req.body);
    argon2.password_hash(req.body.password).then(hashed => {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashed
        });

        user.save(err => {
            if(err) throw err;
            console.log(`Successfully created user ${user._id}`);
            res.redirect('/');
        });
    });
});

app.listen(port, () => console.log(`App is listening on http://localhost:${port}`));
