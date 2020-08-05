const express = require("express");
const router = express.Router();
const bodyParser = require("body-parser");
const auth = require("../middleware/auth");
const { User } = require("../database/model");

router.use(bodyParser.json());

router.post('/', auth, (req, res) => {
    User.findById(req.user._id, (err, docs) => {
        if(err) throw err;
        if(!docs) return res.status(422).send({ error: "User does not exist" });

        console.log(req.body.token);
    });
});

module.exports = router;