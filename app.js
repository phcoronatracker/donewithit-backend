require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const createThumbnail = require('./src/thumbnail');
const { Listing, Image } = require('./database/model');
const auth = require('./routes/auth');

const app = express();
const port = process.env.PORT || 9000;

app.use(bodyParser.json());
app.use('/auth', auth);

app.get('/', (req, res) => {
    res.send("Hello");
});

app.get('/listings', (req, res) => {
    Listing.find({}, (err, docs) => {
        if(err) throw err;
        res.json(docs);
    });
});

app.post('/listings', async (req, res) => {
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
        userId: data.userId,
        description: data.description,
        location: data.location
    });

    listing.save(err => {
        if(err) throw err;
        console.log("Successfully added listing", listing._id);
        return res.end("Successfully added listing");
    });
});

app.listen(port, () => console.log(`App is listening on http://localhost:${port}`));
