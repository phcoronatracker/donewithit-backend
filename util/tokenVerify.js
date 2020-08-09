require('dotenv').config();
const jwt = require("jsonwebtoken");

module.exports = (token) => {
    if(!token) return null;

    try {
        const payload = jwt.verify(token, process.env.SECRET);
        return payload;
    }
    catch (error) {
        console.log("Token is invalid for socket:", error);
        return null;
    }
}   