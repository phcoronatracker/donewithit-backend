require('dotenv').config();
const express = require("express");
const bodyParser = require('body-parser');
const http = require("http");
const SocketIO = require('socket.io');
const SocketSingleton = require("./util/singleton");
const auth = require('./routes/auth');
const listings = require('./routes/listings');
const expoToken = require("./routes/expoPushToken");
const messages = require('./routes/messages');
const upload = require("./routes/upload");

const app = express();
const server = http.createServer(app);
SocketSingleton(server);
const port = process.env.PORT || 9000;

SocketSingleton.io.on('connect', (socket) => {
    socket.emit("hello", "hehehe");
});

app.use(bodyParser.json());

app.use('/auth', auth);
app.use('/messages', messages);
app.use('/listings', listings);
app.use('/expo-push-token', expoToken);
app.use('/upload', upload);

server.listen(port, () => console.log(`App is listening on http://localhost:${port}`));
