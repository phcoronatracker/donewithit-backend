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

const app = express();
const server = Server(app);
const io = socketIO(server);
const port = process.env.PORT || 9000;

app.io = io;

io.on("connect", (socket) => {
    console.log("User conencted:", socket.id);
});

app.use(bodyParser.json());

app.use('/auth', auth);
app.use('/messages', messages);
app.use('/listings', listings);
app.use('/expo-push-token', expoToken);
app.use('/upload', upload);

server.listen(port, () => console.log(`App is listening on http://localhost:${port}`));
