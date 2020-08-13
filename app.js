require('dotenv').config();
const express = require("express");
const bodyParser = require('body-parser');
const socketIO = require("socket.io");
const { Server } = require("http");
const auth = require('./routes/auth');
const listings = require('./routes/listings');
const expoToken = require("./routes/expoPushToken");
const messages = require('./routes/messages');
const upload = require("./routes/upload");
const { Connection, User } = require("./database/model");
const sendNotification = require("./util/pushNotification");

const app = express();
const server = Server(app);
const io = socketIO(server);
const port = process.env.PORT || 9000;

io.on("connect", (socket) => {
    console.log("User conencted:", socket.id);
    socket.on("get-connections", id => {
        if(!id) return;

        User.findById(id, (err, docs) => {
            if(err) throw err;
            if(!docs) return;

            return socket.broadcast.emit("get-connections", docs.connections);
        }); 
    });

    socket.on("new-connection", id => {
        if(!id) return;
        
        // Checking if connection already exists in current user
        User.findById(id, (err, docs) => {
            if(err) throw err;
            if(!docs) return;

            docs.connections.forEach(connection => {
                // Connection exists. Loading previous chats
                if(connection.senderID === data.receiverID) 
                    return socket.emit("new-connection", connection.messages);
            });
        });
    });

    socket.on("new-message", message => {
        if(!message) return;

        const sender = message.user, receiver = message.receiver

        // Finding with the id of the current user
        User.findById(sender._id, (err, docs) => {
            if(err) throw err;
            if(!docs) return;

            const match = false;

            docs.connections.forEach(conn => {
                if(conn.senderID === receiver._id) {
                    // Connection exists on user side
                    // Update the connection timestamp
                    match = true;
                    conn.timestamp = message.createdAt;
                    conn.messages.push({
                        $each: [message],
                        $position: 0
                    });
                    break;
                }
            });

            if(!match) {
                // Connection does not exist
                const connection = new Connection({
                    senderID: receiver._id,
                    senderName: receiver.name,
                    senderImage: receiver.image,
                    timestamp: message.createdAt,
                    messages: [message]
                });
                
                docs.connections.push({
                    $each: [connection],
                    $position: 0
                });
            }

            await docs.save();
        });

        User.findById(receiver._id, (err, docs) => {
            if(err) throw err;
            if(!docs) return;

            const match = false;

            docs.connections.forEach(conn => {
                if(conn.senderID === sender._id) {
                    // Connection exists on receiver side
                    // Update the connection timestamp
                    match = true;
                    conn.timestamp = message.createdAt;
                    conn.messages.push({
                        $each: [message],
                        $position: 0
                    });
                    break;
                }
            });

            if(!match) {
                // Connection does not exist
                const connection = new Connection({
                    senderID: sender._id,
                    senderName: sender.name,
                    senderImage: sender.image,
                    timestamp: message.createdAt,
                    messages: [message]
                });
                
                docs.connections.push({
                    $each: [connection],
                    $position: 0
                });
            }

            await docs.save();

            sendNotification(docs.expoPushToken, sender.name, message.text);
        });
    });
});

app.use(bodyParser.json());

app.use('/auth', auth);
app.use('/messages', messages);
app.use('/listings', listings);
app.use('/expo-push-token', expoToken);
app.use('/upload', upload);

server.listen(port, () => console.log(`App is listening on http://localhost:${port}`));
