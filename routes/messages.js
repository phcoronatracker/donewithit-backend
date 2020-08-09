const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const sendNotification = require('../util/pushNotification');
const SocketSingleton = require("../util/singleton");
const { Message, User } = require("../database/model");
const verify = require("../util/tokenVerify");

router.get('/real-time', (req, res) => {
    const nsp = SocketSingleton.io.of('/messages/real-time');

    nsp.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        const token = socket.handshake.headers["x-clientid"];
        console.log("Token:", token);
        const data = verify(token);

        if(!data) return res.status(400).send({ error: "Bad request" });

        console.log("Data:", data);
        const length = socket.handshake.headers["x-message-len"];
        console.log("Length:", length);
        const clientID = data.userId;

        Message.find({ to: clientID }, (err, docs) => {
            if(err) throw err;
            if(!docs) return;

            const message = docs.slice(docs.length, length);
            if(!message) return;

            socket.emit("new-message", message);
        });
    });

    nsp.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    nsp.on("error", (error) => console.log("Error connecting to messages:", error));

});

router.get('/', auth, (req, res) => {
    Message.find({ to: req.user.userId }, (err, docs) => {
        if(err) throw err;
        if(!docs) return res.send("No Messages");

        return res.json(docs);
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