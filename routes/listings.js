const express = require('express');
const router = express.Router();
const createThumbnail = require('../util/thumbnail');
const { Listing, Image } = require('../database/model');
const auth = require('../middleware/auth');

router.get('/', auth, (req, res) => {
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
        userImage: req.user.userImage,
        description: data.description,
        location: data.location
    });

    listing.save(err => {
        if(err) throw err;
        console.log("Successfully added listing", listing._id);
        return res.end("Successfully added listing");
    });
});

module.exports = router;