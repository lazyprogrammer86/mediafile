require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const uuid = require("uuid");
var MongoDBStore = require('connect-mongodb-session')(session);
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
//////////////////////////////////Trial code/////////////////////////////////////////////

////////////////////////////////////Warning texts and others///////////////////////////
const emailExist = "The entered Email ID is already linked to an existing account please try to  login or register with another Email ID";
const passwordNotMatch = "Two password do not match please make sure you have entered the same password";
const errorMessage = "There was an error in the process please try again later"
const userNotExist = "User with the given email does not exist";
const loginError = "Entered email or password do not match please try again";
const uploadWarning = "This action could not happen due to technical problems please try again later"
const loginFirst = "Log into the website to access this path";
const uploadSuccess = "";
////////////////////////mongoDB connection and reltated///////////////////////////

mongoose.connect("mongodb://localhost:27017/mediafileDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
const store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/mediafileDB',
    collection: 'Sessions'
});
//////////////////////////////media upload///////////////////////

// const mediaSchema = new mongoose.Schema({
//
// });


app.use(session({
    genid: function(req) {
        return uuid.v4()
    },
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: true,
    store: store,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 30
    }
}));
//////////////////////userSchema//////////////////////////
const usersSchema = new mongoose.Schema({
    username: String,
    password: String,
    name:String
});

const User = new mongoose.model("Users", usersSchema);
app.use(passport.initialize());
app.use(passport.session());



const strategy = new LocalStrategy(verifyCallback);

function verifyCallback(username, password, done) {
    User.findOne({
        username: username
    }, (err, foundUser) => {
        if (!err) {
            if (foundUser) {
                if (foundUser.password === md5(password)) {
                    return done(null, foundUser);
                } else {
                    return done(null, false);
                }
            } else {
                return done(null, false);
            }
        } else {
            return done(null, false);
        }
    });
}

passport.use(strategy);

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

/////////////////////// app.get() methods ////////////////////////////////

app.get("/", (req, res) => {
    res.render("Preview", {
        title: "Media-File"
    });
});

app.get("/register", (req, res) => {
    res.render("register", {
        title: "Register-MediaFile",
        regaction: "register",
        reghead: "Sign Up",
        regWarning: ""
    });
});

app.get("/login", (req, res) => {
    res.render("login", {
        title: "login-MediaFile",
        logWarning: ""
    });
});

app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/");
});

app.get("/everify", (req, res) => {
    res.render("everify", {
        title: "Verification"
    })
});

app.get("/cverify", (req, res) => {
    res.render("cverify", {
        title: "verification",
        mailId: "media@file.com"
    });
});

app.get("/media", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("media", {
            title: "hello " + req.user.name
        })
    } else {
        res.render("login", {
            title: "login-MediaFile",
            logWarning: loginFirst
        });
    }
});

app.get("/upload", (req, res) => {});


//////////////////////////////app/post() methods/////////////////////////////


app.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const name = req.body.name;
    const user = new User({
        username: username,
        password: md5(password),
        name:name
    });
    User.findOne({
        username: username
    }, (err, foundUser) => {
        if (!err) {
            if (foundUser) {
                res.render("register", {
                    title: "Register-MediaFile",
                    regaction: "register",
                    reghead: "Sign Up",
                    regWarning: emailExist
                });
            } else {
                user.save((err) => {
                    if (err) {
                        res.render("register", {
                            title: "Register-MediaFile",
                            regaction: "register",
                            reghead: "Sign Up",
                            regWarning: errorMessage
                        });
                    } else {
                        passport.authenticate("local")(req, res, (err) => {
                            if (err) {
                                console.log(err);
                                res.render("login", {
                                    title: "login-MediaFile",
                                    logWarning: errorMessage
                                });
                            } else {
                                res.redirect("/media");
                            }
                        });
                    }
                });
            }
        } else {
            console.log("error from registration : " + err);
            res.render("register", {
                title: "Register-MediaFile",
                regaction: "register",
                reghead: "Sign Up",
                regWarning: errorMessage
            });
        }
    });
});


app.post("/login", (req, res) => {
    const user = {
        username: req.body.username,
        password: req.body.password
    }
    User.findOne({
        username: req.body.username
    }, (err, foundUser) => {
        if (!err) {
            if (foundUser) {
                if (foundUser.password === md5(req.body.password)) {
                    passport.authenticate("local")(req, res, (err) => {
                        if (err) {
                            res.render("login", {
                                title: "login-MediaFile",
                                logWarning: errorMessage
                            });
                        } else {
                            res.redirect("/media");
                        }
                    });
                } else {
                    res.render("login", {
                        title: "login-MediaFile",
                        logWarning: loginError
                    });
                }
            } else {
                res.render("login", {
                    title: "login-MediaFile",
                    logWarning: userNotExist
                });
            }
        } else {
            res.render("login", {
                title: "login-MediaFile",
                logWarning: errorMessage
            });
        }
    });
});

app.post("/upload", (req, res) => {

});

app.post("/everify", (req, res) => {
    res.redirect("/cverify");
});

app.post("/cverify", (req, res) => {
    res.render("register", {
        title: "Chnage-PassWord",
        regaction: "changepassword",
        reghead: "Change of Password",
        regWarning: "Enter new Password"
    });

});

function errorHandler(err, req, res, next) {
    if (err) {
        console.log(err);
        res.render("login", {
            title: "login-MediaFile",
            logWarning: errorMessage
        });
    }
}
app.use(errorHandler);
//////////////////////////////server set up//////////////////////////////////
app.listen(process.env.PORT || 3000, () => {
    console.log("up and running on port 3000");
});
