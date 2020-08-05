const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const auth = require("../middleware/auth");
const { User } = require("../database/model");

router.use(bodyParser.json());

router.post('/', auth, (req, res) => {
    console.log(req.user);
    User.findById(req.user.userId, (err, docs) => {
        if(err) throw err;
        if(!docs) return res.status(422).send({ error: "User does not exist" });

        console.log(req.body.token);
        docs.expoPushToken = req.body.token;
        console.log(docs);
        res.status(201).send("Sucessfully added push token");
    });
});

module.exports = router;