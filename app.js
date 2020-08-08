require('dotenv').config();
const express = require("express");
const bodyParser = require('body-parser');
const { Server } = require("http");
const SocketIO = require('socket.io');
const auth = require('./routes/auth');
const listings = require('./routes/listings');
const expoToken = require("./routes/expoPushToken");
const messages = require('./routes/messages');
const upload = require("./routes/upload");

const app = express();
const server = Server(app);
const io = SocketIO(server);
const port = process.env.PORT || 9000;

io.on('connect', (socket) => {
    socket.emit("hello", "hehehe");
});
io.of('/messages').on("connection", (socket) => {
    console.log("User connected:", socket.id)
    socket.emit("messages", "henlo po");
});
app.use(function(req, res, next) {
    req.io = io;
    next();
});
app.use(bodyParser.json());

app.use('/auth', auth);
app.use('/listings', listings);
app.use('/expo-push-token', expoToken);
app.use('/messages', messages);
app.use('/upload', upload);

server.listen(port, () => console.log(`App is listening on http://localhost:${port}`));
