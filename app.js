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

const users = [];

io.on("connect", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("send-id", id => {
        if(!id) return;

        return users.unshift({ id, socketID: socket.id });
    });

    socket.on("get-connections", id => {
        if(!id) return;
        console.log("Getting connections for:", id);

        User.findById(id, (err, docs) => {
            if(err) throw err;
            if(!docs) return;

            if(!docs.connections || docs.connections.length === 0) 
                return io.to(socket.id).emit("get-connections", []);

            return io.to(socket.id).emit("get-connections", docs.connections);
        }); 
    });

    socket.on("new-connection", ({ id, receiverID }) => {
        if(!id) return;
        console.log("New Connection:", id);
        
        // Checking if connection already exists in current user
        User.findById(id, (err, docs) => {
            if(err) throw err;
            if(!docs) return;

            if(!docs.connections || docs.connections.length === 0) 
                return io.to(socket.id).emit("new-connection", []);

            for(let i = 0; i < docs.connections.length; i++) {
                // Connection exists. Loading previous chats
                if(docs.connection[i].senderID === receiverID)  
                    return io.to(socket.id).emit("new-connection", connection.messages);
            }
            // Connection is new. No messages return
            return io.to(socket.id).emit("new-connection", []);
        });
    });

    socket.on("new-message", message => {
        if(!message) return;

        const sender = message.user, receiver = message.receiver;
        
        io.to(socket.id).emit("new-message", [message]);
        for(let i = 0; i < users.length; i++) {
            if(users[i].id === receiver._id) {
                io.to(users[i].socketID).emit("new-message", [message]);
                break;
            }
        }

        // Finding with the id of the current user
        User.findById(sender._id, async (err, docs) => {
            if(err) throw err;
            if(!docs) return;

            var match = true;
            var conn = docs.connections;

            for(let i = 0; i < conn.length; i++) {
                if(conn[i].senderID === receiver._id) {
                    // Connection exists on user side
                    // Update the connection timestamp
                    match = true;
                    conn[i].timestamp = message.createdAt;
                    conn[i].messages.push({
                        $each: [message],
                        $position: 0
                    });
                    await docs.save();
                    break;
                } else {
                    match = false;
                }
            }

            if(match === false) {
                // Connection does not exist. Create a new one
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
                await docs.save();
            }

        });

        User.findById(receiver._id, async (err, docs) => {
            if(err) throw err;
            if(!docs) return;

            var match = true;
            var conn = docs.connections;

            for(let i = 0; i < conn.length; i++) {
                if(conn[i].senderID === sender._id) {
                    // Connection exists on receiver side
                    // Update the connection timestamp
                    match = true;
                    conn[i].timestamp = message.createdAt;
                    conn[i].messages.push({
                        $each: [message],
                        $position: 0
                    });
                    await docs.save();
                    break;
                } else {
                    match = false;
                }
            }

            if(match === false) {
                // Connection does not exist. Creating a new one
                const connection = new Connection({
                    senderID: sender._id,
                    senderName: sender.name,
                    senderImage: sender.avatar,
                    timestamp: message.createdAt,
                    messages: [message]
                });
                
                docs.connections.push({
                    $each: [connection],
                    $position: 0
                });
                await docs.save();
            }


            sendNotification(docs.expoPushToken, sender.name, message.text);
        });
    });
    
    socket.on("disconnect", (reason) => {
        var userIndex;
        for(let i = 0; i < users.length; i++) {
            if(users[i].socketID === socket.id) {
                userIndex = i;
                console.log("Remove ID:", users[i].id);
                break;
            }
        }
        users.splice(userIndex, 1);

        console.log("User disconnected:", socket.id);
        console.log("Reason:", reason);
    });
});

app.use(bodyParser.json());

app.use('/auth', auth);
app.use('/messages', messages);
app.use('/listings', listings);
app.use('/expo-push-token', expoToken);
app.use('/upload', upload);

server.listen(port, () => console.log(`App is listening on http://localhost:${port}`));
