const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const sendNotification = require('../util/pushNotification');
const SocketSingleton = require("../util/singleton");
const { Message, User } = require("../database/model");
const verify = require("../util/tokenVerify");

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

router.get('/socket', (req, res) => {
    const io = SocketSingleton.io;

    io.of('/messages/socket').on("connection", (socket) => {
        console.log("User connected:", socket.id);
        
        io.to(socket.id).emit("Welcome", `Welcome user ${socket.id}`);
    });
});

router.get('/real-time', (req, res) => {
    const nsp = SocketSingleton.io.of("/messages");

    nsp.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        const token = socket.handshake.headers["x-client-token"];
        console.log("Token:", token);

        const data = verify(token);

        if(!data) return res.status(400).send({ error: "Bad request" });

        console.log("Data:", data);
        const messageCount = socket.handshake.headers["x-message-len"];
        console.log("Length:", messageCount);
        const clientID = data.userId;

        Message.find({ to: clientID }, (err, docs) => {
            if(err) throw err;
            if(!docs) return;

            const message = docs.slice(docs.length, messageCount);
            if(message) {
                socket.emit("new-message", message);
            }
        });
    });

    nsp.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    nsp.on("error", (error) => console.log("Error connecting to messages:", error));

    res.send({ error: "Bad request" });
});

module.exports = router;