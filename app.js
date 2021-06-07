require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const uuid = require("uuid");
// const jsdom = require("jsdom");
// const {JSDOM}=jsdom;
// const myFn = require("./public/jscript/index.js");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
//////////////////////////////////Trial code/////////////////////////////////////////////

// const dom = new JSDOM("register");
// console.log(dom.window.document.querySelector(".reg"));


////////////////////////////////////Warning texts and others///////////////////////////
const emailExistWarn = "The entered Email ID is already linked to an existing account please try to  login or register with another Email ID";
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
mongoose.set('useCreateIndex', true);
//////////////////////////////media upload///////////////////////

// const mediaSchema = new mongoose.Schema({
//
// });

//////////////////////userSchema//////////////////////////
const usersSchema = new mongoose.Schema({
    username: String,
    password: String
});
app.use(require('express-session')({
    genid: function(req) {
        return uuid.v4();
    },
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

usersSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("Users", usersSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());


passport.deserializeUser(User.deserializeUser());
/////////////////////////// app.get() methods ////////////////////////////////

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
        console.log(req.session.passport.user);
        res.render("media", {
            title: "welcome"
        });
    } else {
        res.render("login", {
            title: "login-MediaFile",
            logWarning: loginFirst
        });
    }
});

app.get("/upload", (req, res) => {
    if (req.isAuthenticated()) {
        res.render("upload", {
            title: "upload",
            uploWarning: ""
        });
    } else {
        res.render("login", {
            title: "login-MediaFile",
            logWarning: loginFirst
        });
    }
});
//////////////////////////////app/post() methods/////////////////////////////
app.post("/register", (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const password_re = req.body.password_re;
    User.findOne({
        username: username
    }, (err, user) => {
        if (!err) {
            if (user) {
                res.render("register", {
                    title: "Register-MediaFile",
                    regaction: "register",
                    reghead: "Sign Up",
                    regWarning: emailExistWarn
                });
            } else if (password != password_re) {
                res.render("register", {
                    title: "Register-MediaFile",
                    regaction: "register",
                    reghead: "Sign Up",
                    regWarning: passwordNotMatch
                });
            } else {
                User.register({
                    username: username
                }, password, function(err, user) {
                    if (err) {
                        res.send(err.message);
                    } else {
                        passport.authenticate("local")(req, res, () => {
                            res.redirect("/media");
                            console.log("request from passport" + req + "\nresponse" + respo);
                        });
                    }
                });
            }
        } else {
            console.log(err.message);
            res.redirect("/register");
        }
    });
});



// app.post('/login', passport.authenticate('local', { successRedirect:'/media',
//                                                     failureRedirect: '/login'}));




app.post("/login", (req, res) => {
const user = new User({
    username:req.body.username,
    password:req.body.password
});
User.findOne({username:req.body.username},(err,foundUser)=>{
    if(!err){
        if(foundUser){
            req.login(user,(err)=>{
                if(err){
                    res.render("login", {
                        title: "login-MediaFile",
                        logWarning: errorMessage
                    });
                }else{
                    passport.authenticate("local")(req,res,(err)=>{
                        console.log(err)
                        if(err){
                            console.log(err);
                            res.render("login", {
                                title: "login-MediaFile",
                                logWarning: errorMessage
                            });
                        }else{
                            res.redirect("/media");
                        }
                    });
                }
            });
        }else{
            res.render("login", {
                title: "login-MediaFile",
                logWarning:userNotExist
            });
        }
    }else{
        console.log(err);
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
//////////////////////////////server set up//////////////////////////////////
app.listen(process.env.PORT || 3000, () => {
    console.log("up and running on port 3000");
});
