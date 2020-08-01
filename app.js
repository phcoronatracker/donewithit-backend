require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const argon2 = require("./src/password");
const createThumbnail = require('./src/thumbnail');
const model = require('./database/model');

const app = express();
const port = process.env.PORT || 9000;
const { User, Listing, Image } = model;

app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send("Hello");
});

app.get('/listings', (req, res) => {
    Listing.find({}, (err, docs) => {
        if(err) throw err;
        res.json(docs);
    });
});

app.post('/auth', (req, res) => {
    console.log(req.body);
});

app.post('/register', (req, res) => {
    console.log(req.body);
    argon2.password_hash(req.body.password).then(hashed => {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: hashed
        });

        user.save(err => {
            if(err) throw err;
            console.log(`Successfully created user ${user._id}`);
            res.redirect('/');
        });
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
        res.redirect('/');
    });
});

app.listen(port, () => console.log(`App is listening on http://localhost:${port}`));
