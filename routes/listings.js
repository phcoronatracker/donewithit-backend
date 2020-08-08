const express = require('express');
const router = express.Router();
const createThumbnail = require('../util/thumbnail');
const { Listing, Image, User } = require('../database/model');
const auth = require('../middleware/auth');

router.get('/', (req, res) => {
    const io = req.io;
    io.of('/listings').on("connection", (socket) => {
        console.log("User connected:", socket.id);
        socket.emit("listings", "henlo po");
    });

    Listing.find({}, (err, docs) => {
        if(err) throw err;
        res.json(docs);
    });
});

router.post('/', auth, async (req, res) => {
    const data = req.body;

    const images = await Promise.all(data.images.map(async url => {
        const thumbnail = await createThumbnail(url);
        const image =  new Image({
            url: url,
            thumbnail: thumbnail
        });

        return image;
    }));

    const listing = new Listing({
        title: data.title,
        images: images,
        price: data.price,
        categoryId: data.categoryId,
        userId: req.user.userId,
        description: data.description,
        location: data.location
    });

    listing.save(err => {
        if(err) throw err;
        console.log("Successfully added listing", listing._id);
        return res.end("Successfully added listing");
    });
});

router.post('/lister-info', auth, (req, res) => {
    User.findById(req.body.id, (err, doc) => {
        if(err) throw err;
        if(!doc) return res.status(422).send({ error: "User does not exist" });

        Listing.find({ userId: req.body.id }, (err, docs) => {
            if(err) throw err;

            const length = docs.length;
            if(length === 0) return res.status(400).send({ error: "User has no listing" });

            return res.send({ name: doc.name, image: doc.profileImage, count: length });
        });
    });
});

module.exports = router;