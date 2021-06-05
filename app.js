const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
// const myFn = require("./public/jscript/index.js");
const app = express();


app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));

////////////////////////////////////Warning texts and others///////////////////////////
const emailExistWarn = "The entered Email ID is already linked to an existing account please try to  login or register with another Email ID";
const passwordNotMatch = "Two password do not match please make sure you have entered the same password";
const errorMessage = "There was an error in the process please try again later"
const userNotExist = "User with the given email does not exist";
const loginError = "Entered email or password do not match please try again";
const uploadWarning="This action could not happen due to technical problems please try again later"
const uploadSuccess="";
////////////////////////mongoDB connection and reltated///////////////////////////

mongoose.connect("mongodb://localhost:27017/mediafileDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//////////////////////////////media upload///////////////////////

// const mediaSchema = new mongoose.Schema({
//
// });

//////////////////////userSchema//////////////////////////
const usersSchema = new mongoose.Schema({
    userName: String,
    password: String
});

const User = new mongoose.model("Users", usersSchema);

/////////////////////////// app.get() methods ////////////////////////////////

app.get("/", (req, res) =>{
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
    res.render("media", {
        "title": "welcome"
    });
});

app.get("/upload",(req,res)=>{
    res.render("upload",{title:"upload",uploWarning:""});
});
//////////////////////////////app/post() methods/////////////////////////////
app.post("/register", (req, res) => {
    const userName_one = req.body.username;
    const password_one = req.body.password;
    const password_re_one = req.body.password_re;

    User.findOne({
        userName: userName_one
    }, (err, user) => {
        if (!err) {
            if (user) {
                res.render("register", {
                    title: "Register-MediaFile",
                    regaction: "register",
                    reghead: "Sign Up",
                    regWarning: emailExistWarn
                });
            } else if (password_one != password_re_one) {
                res.render("register", {
                    title: "Register-MediaFile",
                    regaction: "register",
                    reghead: "Sign Up",
                    regWarning: passwordNotMatch
                });
            } else if (!user) {
                const user = new User({
                    userName: userName_one,
                    password: password_one
                });
                user.save((err) => {
                    if (!err) {
                        res.redirect("/media");
                    } else {
                        res.render("register", {
                            title: "Register-MediaFile",
                            regaction: "register",
                            reghead: "Sign Up",
                            regWarning: errorMessage
                        });
                    }
                });
            }
        } else {
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
    const userName = req.body.username;
    const password = req.body.password;
    User.findOne({
        userName: userName
    }, (err, foundUser) => {
        if (!err) {
            if (foundUser) {
                if (foundUser.password === password) {
                    res.redirect("/media");
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

app.post("/upload",(req,res)=>{
    console.log(req.body);
    res.redirect("media");
});
//////////////////////////////server set up//////////////////////////////////
app.listen(process.env.PORT || 3000, () => {
    console.log("up and running on port 3000");
});
