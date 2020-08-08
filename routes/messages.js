const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const sendNotification = require('../util/pushNotification');
const { Message, User, Listing } = require("../database/model");
const SocketSingleton = require("../util/singleton");

router.get('/', (req, res) => {
    SocketSingleton.io.of('/messages').on("connection", (socket) => {
        console.log("Message connected:", socket.id);
        socket.emit("message", "henlo po");
    });

    Listing.find({}, (err, docs) => {
        if(err) throw err;
        res.json(docs);
    });
    // Message.find({ to: req.user.userId }, (err, docs) => {
    //     if(err) throw err;
    //     if(!docs) return res.send("No Messages");

    //     return res.json(docs);
    // });
});

router.post('/', auth, (req, res) => {
    const data = req.body;
    const message = new Message({
        from: req.user.userId,
        to: data.to,
        listing: data.listing,
        content: data.content,
        senderImage: req.user.userImage,
        senderName: req.user.name
    });

    Message.create(message, (err, message) => {
        if(err) throw err;

        User.findById(data.to, (error, docs) => {
            if(error) throw error;

            sendNotification(docs.expoPushToken, req.user.name, message.content);
            return res.end("Successfully sent the message");
        });
    });
});

module.exports = router;