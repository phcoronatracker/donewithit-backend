require('dotenv').config();
const express = require("express");
const auth = require('./routes/auth');
const listings = require('./routes/listings');
const expoToken = require("./routes/expoPushToken");

const app = express();
const port = process.env.PORT || 9000;

app.use('/auth', auth);
app.use('/listings', listings);
app.use('/expo-push-token', expoToken);

app.listen(port, () => console.log(`App is listening on http://localhost:${port}`));
