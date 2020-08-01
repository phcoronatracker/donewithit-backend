require("dotenv").config();
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const findOrCreate = require('mongoose-findorcreate');

mongoose.connect(process.env.DB_URL, { dbName: "donewithit", useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: true }).then(() => {
    console.log("Connected to Atlas Cluster successfully!");
}).catch((err) => console.log(err));

const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: {
        type: String,
        minlength: 8
    },
}, { versionKey: false });

const imageSchema = new mongoose.Schema({
    url: String,
    thumbnail: String
}, { versionKey: false, _id: false });

const listingSchema = new mongoose.Schema({
    title: String,
    images: [imageSchema],
    price: Number,
    categoryId: Number,
    userId: Number,
    description: String,
    location: {
        latitude: mongoose.Types.Decimal128,
        longitude: mongoose.Types.Decimal128,
    }
}, { versionKey: false })

const encKey = process.env.ENC_KEY; //32-byte length 64-bit characters
const sigKey = process.env.SIG_KEY; //64-byte length 64-bit characters

userSchema.plugin(encrypt, { encryptionKey: encKey, signingKey: sigKey, encryptedFields:['password'] });

const User = mongoose.model('User', userSchema);
const Listing = mongoose.model('Listing', listingSchema);
const Image = mongoose.model('Image', imageSchema);

module.exports = { User, Listing, Image }