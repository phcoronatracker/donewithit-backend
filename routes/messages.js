require("dotenv").config();
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");
const sendNotification = require('../util/pushNotification');
const SocketSingleton = require("../util/singleton");
const { Message, User, Listing } = require("../database/model");

SocketSingleton.io.use((socket, next) => {
    const token = socket.handshake.headers['x-client-token'];
    console.log(token);
    next();

    // try {
    //     const payload = jwt.verify(token, process.env.SECRET);
    //     next();
    // } catch (err) {
    //     next(new Error({ error: 'Invalid token' }));
    // }
});

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