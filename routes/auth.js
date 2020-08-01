const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const argon2 = require('../src/password');

const { User } = require('../database/model');

router.use(bodyParser.json());

router.post('/', (req, res) => {
    console.log(req.body);
});

router.post('/register', async (req, res) => {
    console.log(req.body);
    const hashedPassword = await argon2.password_hash(req.body.password);
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword
    });

    User.findOne({ email: req.body.email }, (err, docs) => {
        if(err) throw err;
        if(docs) res.status(409).send({ error: "User already exists" });

        user.save(err => {
            if(err) throw err;
            console.log(`Successfully created user ${user._id}`);
            res.end("Successful registration");
        });
    });
});

module.exports = router;
