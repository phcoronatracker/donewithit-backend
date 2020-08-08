const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const sendNotification = require('../util/pushNotification');
const { Message, User } = require("../database/model");

router.get('/', (req, res) => {
    const io = req.io;

    io.of('/messages').on("connection", (socket) => {
        console.log("Getting messages:", socket.id);
        socket.emit("messages", "nooo");
    });
    // Message.find({ to: req.user.userId }, (err, docs) => {
    //     if(err) throw err;
    //     if(!docs) return res.send("No Messages");
        
        
    // });
    res.send("YEY");
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