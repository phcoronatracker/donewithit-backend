const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const sendNotification = require('../util/pushNotification');
const { Message, User } = require("../database/model");

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
        content: data.content,
        senderImage: req.user.profileImage
    });

    Message.create(message, (err, message) => {
        if(err) throw err;

        User.findById(data.to, (error, docs) => {
            if(error) throw error;

            sendNotification(docs.expoPushToken, docs.eventNames, message.content);
            return res.end("Successfully sent the message");
        });
    });
});

module.exports = router;