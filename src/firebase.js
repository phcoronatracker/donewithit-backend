const firebase = require('firebase');

const firebaseConfig = {
    apiKey: "AIzaSyBrlwy_Eyb_YM5c6DnOD280p2VykDZg17k",
    authDomain: "done-with-it-photos.firebaseapp.com",
    databaseURL: "https://done-with-it-photos.firebaseio.com",
    projectId: "done-with-it-photos",
    storageBucket: "done-with-it-photos.appspot.com",
    messagingSenderId: "656429860407",
    appId: "1:656429860407:web:975c72358400bd1ff621b2",
    measurementId: "G-B5WXYHJRYT"
}

firebase.initializeApp(firebaseConfig);

const storage = firebase.app().storage("gs://done-with-it-photos.appspot.com");
const storageRef = storage.ref();

module.exports = class Firebase {
    constructor(uri) {
        this.uri = uri;
    }

    _getLastSegment () {
        const parts = this.uri.split('/');
        const last = parts.pop() || parts.pop();

        return last;
    }

    async _uploadImage() {
        const res = await fetch(this.uri);
        const blob = await res.blob();

        const last = this._getLastSegment();
        const metadata = {
            contentType: 'image/jpg',
        }

        const imgLocation = `images/${last};`

        const ref = storageRef.child(imgLocation);
        const result = await ref.put(blob, metadata);

        console.log("Uploaded!")
        const download = await ref.getDownloadURL();
        console.log("Link is now available at: ", download);

        return download;
    }
}