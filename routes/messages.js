const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const sendNotification = require('../util/pushNotification');
const { Message } = require("../database/model");

router.get('/', auth, (req, res) => {
    Message.find({ to: req.user.userId }, (err, docs) => {
        if(err) throw err;
        if(!docs) return res.send("No Messages");

        res.json(docs);
    });
});

router.post('/', auth, (req, res) => {
    const data = req.body;
    const message = new Message({
        from: req.user.userId,
        to: data.to,
        listing: data.listing,
        content: data.content
    });

    message.save((err, doc) => {
        if(err) throw err;
        
        sendNotification(req.user.token, doc.content);
        return res.end("Successfully sent the message");
    });
});

module.exports = router;