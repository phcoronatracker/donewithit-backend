const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const sendNotification = require('../util/pushNotification');
const SocketSingleton = require("../util/singleton");
const { Message, User } = require("../database/model");

router.get('/', (req, res) => {
    const nsp = SocketSingleton.io.of('/messages');
    nsp.on("connection", (socket) => {
        console.log("Message connected:", socket.id);
        console.log(socket.handshake.headers["x-auth-token"]);
    });
    
    Message.find({ to: "5f2aed44a4480900045c0614" }, (err, docs) => {
        if(err) throw err;
        if(!docs) return res.send("No Messages");

        nsp.emit("messages", docs);
    });
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