require("dotenv").config();
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

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
    expoPushToken: String,
    profileImage: { type: String, default: "https://img.icons8.com/color/96/000000/gender-neutral-user.png" }
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
    userId: mongoose.Types.ObjectId,
    description: String,
    location: {
        latitude: mongoose.Types.Decimal128,
        longitude: mongoose.Types.Decimal128,
    }
}, { versionKey: false });

const messageSchema = new mongoose.Schema({
    from: mongoose.Types.ObjectId,
    to: mongoose.Types.ObjectId,
    listing: mongoose.Types.ObjectId,
    content: String,
    timestamp: { type: Date, default: Date.now() }
});

const encKey = process.env.ENC_KEY; //32-byte length 64-bit characters
const sigKey = process.env.SIG_KEY; //64-byte length 64-bit characters

userSchema.plugin(encrypt, { encryptionKey: encKey, signingKey: sigKey, encryptedFields:['password'] });

const User = mongoose.model('User', userSchema);
const Listing = mongoose.model('Listing', listingSchema);
const Image = mongoose.model('Image', imageSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { User, Listing, Image, Message }