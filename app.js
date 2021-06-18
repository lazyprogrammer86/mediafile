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
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
//////////////////////////////////Trial code/////////////////////////////////////////////

////////////////////////////////send mail //////////////////////////////////////////////
function sendMail(username, otp) {
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
        to: username, // Change to your recipient
        from: process.env.SENDER_ID, // Change to your verified sender
        subject: 'OTP from mediafile',
        text: 'This is one time password sent to your registered email id to authorize it is the right owner of the account at media file and chage password of your Media file account',
        html: '<p> your OTP is : <h1>' + otp + '</h1> and it is valid for next three minutes</p>',
    }
    sgMail
        .send(msg)
        .then(() => {
            console.log('Email sent')
        })
        .catch((error) => {
            console.log(error.response.body.errors);
        });
}

function otpGenerator() {
    let otp = Math.floor((Math.random()) * 1000000);
    console.log(otp);
    return otp;
}
////////////////////////////////////Warning texts and others///////////////////////////
const emailExist = "The entered Email ID is already linked to an existing account please try to  login or register with another Email ID";
const passwordNotMatch = "Two password do not match please make sure you have entered the same password";
const errorMessage = "There was an error in the process please try again later"
const userNotExist = "User with the given email does not exist entered email is : ";
const loginError = "Entered email or password do not match please try again";
const uploadWarning = "This action could not happen due to technical problems please try again later"
const loginFirst = "Log into the website to access this path";
const everWarn = "entered email id is not registered with us to change password and the entered email id is : ";
const otpWarn = "entered code isnt matching with the one time password sent to you on your registered email";
const passChnaged = "successfully changed the password";
const noImages = "there are no images in your media file account uploa one to start using our service";
const uploadSuccess = "successfully uploaded the images";
const defalutDesc = "This is the default image and you can delete it by pressing on the expand button which is in the center and then scrolling all the way down and pressing on the delete button , but before that you need upload a photo."
////////////////////////mongoDB connection and reltated///////////////////////////
mongoose.connect(process.env.DATABASE_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
});
const store = new MongoDBStore({
    uri: process.env.DATABASE_URL,
    collection: 'Sessions',
});
////////////////////////// cookie and session ///////////////////
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
//////////////////////////////media upload///////////////////////
const mediaSchema = new mongoose.Schema({
    name: String,
    desc: String,
    img: {
        data: Buffer,
        contentType: String
    }
});

const Media = new mongoose.model("Media", mediaSchema);
//////////////////////userSchema//////////////////////////
const usersSchema = new mongoose.Schema({
    username: String,
    password: String,
    name: String,
    otp: String,
    otpVerified: Boolean,
    media: [mediaSchema]
});

const User = new mongoose.model("Users", usersSchema);

////////////////////////////passport stuff//////////////////////
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

/////////////////////////multer and filesystem////////////////////////////
var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, __dirname + '/public/uploadedImages')
    },
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now());
    }
});

const upload = multer({
    storage: storage
});
/////////////////////// app.get() methods ////////////////////////////////

app.get("/", (req, res) => {
    res.render("Preview", {
        title: "Media-File"
    });

});
app.get("/about", (req, res) => {
    res.redirect("/");
});

app.get("/register", (req, res) => {
    res.render("register", {
        title: "Register-MediaFile",
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
        title: "Verification",
        everWarn: ""
    })
});


app.get("/media", (req, res) => {
    if (req.isAuthenticated()) {
        User.findOne({
            username: req.user.username
        }, (err, foundUser) => {
            if (err) {
                res.redirect("/login");
            } else {
                if (!foundUser.media.length) {
                    const media = {
                        name: "Default Image",
                        desc: defalutDesc,
                        img: {
                            data: fs.readFileSync(path.join(__dirname + '/public/uploadedImages/fileName-1623960693517')),
                            contentType: 'image/png'
                        }
                    }
                    foundUser.media.push(media);
                    foundUser.save(err => {
                        if (err) {
                            res.redirect("/");
                        } else {
                            res.redirect("/media");
                        }
                    })
                } else {
                    res.render("media", {
                        title: "Hello " + req.user.name,
                        mediaWarn: "",
                        media: foundUser.media
                    });
                }
            }
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
            title: "Upload files",
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
    const name = req.body.name;
    const user = new User({
        username: username,
        password: md5(password),
        name: name
    });
    User.findOne({
        username: username
    }, (err, foundUser) => {
        if (!err) {
            if (foundUser) {
                res.render("register", {
                    title: "Register-MediaFile",
                    regWarning: emailExist
                });
            } else {
                user.save((err) => {
                    if (err) {
                        res.render("register", {
                            title: "Register-MediaFile",
                            regWarning: errorMessage
                        });
                    } else {
                        console.log("registerd successfully");
                        passport.authenticate("local")(req, res, (err) => {
                            if (err) {
                                console.log(err);
                                res.render("login", {
                                    title: "login-MediaFile",
                                    logWarning: errorMessage
                                });
                            } else {
                                const otp = otpGenerator();
                                sendMail(username, otp);
                                console.log("otp sent successfully");
                                User.findOneAndUpdate({
                                    username: username
                                }, {
                                    $set: {
                                        otp: md5(otp)
                                    }
                                }, {
                                    new: true
                                }, (err, foundUser) => {
                                    if (err) {
                                        res.render("register", {
                                            title: "login-MediaFile",
                                            logWarning: errorMessage
                                        });
                                    } else {
                                        res.render("cverify", {
                                            title: "verification",
                                            mailId: username,
                                            verifyAction: "regsverify",
                                            cverWarn: ""
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        } else {
            console.log("error from registration : " + err);
            res.render("register", {
                title: "Register-MediaFile",
                regWarning: errorMessage
            });
        }
    });
});

app.post("/regsverify", (req, res) => {
    const otpRecived = Number(req.body.pfcode);
    const username = req.body.button;
    User.findOne({
        username: username
    }, (err, foundUser) => {
        if (!err) {
            if (!foundUser) {
                res.redirect("/register");
            } else {
                if (foundUser.otp === md5(otpRecived)) {
                    User.findOneAndUpdate({
                        username: username
                    }, {
                        $set: {
                            otp: "otp"
                        }
                    }, {
                        new: true
                    }, (err, user) => {
                        if (err) {
                            console.log("err");
                        } else {
                            console.log("success");
                        }
                    });
                    res.redirect("/media");
                } else {
                    res.render("cverify", {
                        title: "verification",
                        mailId: username,
                        verifyAction: "regsverify",
                        cverWarn: otpWarn
                    });
                }
            }
        } else {
            res.render("register", {
                title: "Register-MediaFile",
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
                    passport.authenticate("local")(req, res, () => {
                        if (err) {
                            res.render("login", {
                                title: "login-MediaFile",
                                logWarning: errorMessage
                            });
                        } else {
                            console.log("logged in successfully");
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
                    logWarning: userNotExist + req.body.username
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

app.post("/everify", (req, res) => {
    const userMail = req.body.fpemail;
    const otp = otpGenerator();
    User.findOneAndUpdate({
        username: userMail
    }, {
        $set: {
            otp: md5(otp)
        }
    }, {
        new: true
    }, (err, foundUser) => {
        if (!err) {
            if (foundUser) {
                res.render("cverify", {
                    title: "verification",
                    mailId: userMail,
                    verifyAction: "cverify",
                    cverWarn: ""
                });
                sendMail(userMail, otp);
                console.log("otp sent successfully");
            } else {
                res.render("everify", {
                    title: "failed to verify",
                    everWarn: everWarn + userMail
                });
            }
        } else {
            res.render("everify", {
                title: "failed to verify",
                everWarn: errorMessage
            });
        }
    });
});

app.post("/cverify", (req, res) => {
    const userMail = req.body.button;
    const recivedOtp = Number(req.body.pfcode);
    User.findOne({
        username: userMail
    }, (err, foundUser) => {
        if (!err) {
            if ((foundUser.otp) === md5(recivedOtp)) {
                res.render("repassword", {
                    title: "reset password",
                    pasWarning: "",
                    userMail: userMail
                });
            } else {
                res.render("cverify", {
                    title: "verification-failed",
                    cverWarn: otpWarn,
                    verifyAction: "cverify",
                    mailId: userMail
                });
            }
        } else {
            res.render("cverify", {
                title: "verification-failed",
                cverWarn: errorMessage,
                verifyAction: "cverify",
                mailId: userMail
            });
        }
    });
});

app.post("/passwordChange", (req, res) => {
    userMail = req.body.button;
    password = md5(req.body.password);
    password_re = md5(req.body.password_re);
    if (password != password_re) {
        res.render("repassword", {
            title: "reset password",
            pasWarning: passwordNotMatch,
            userMail: userMail
        });
    } else {
        User.findOneAndUpdate({
            username: userMail
        }, {
            $set: {
                password: password
            }
        }, (err, doc) => {
            if (!err) {
                console.log("password changed successfully");
                res.render("login", {
                    title: "login-MediaFile",
                    logWarning: passChnaged
                });
                User.findOneAndUpdate({
                    username: doc.username
                }, {
                    $set: {
                        otp: "otp"
                    }
                }, (err, doc) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("otp deleted successfully");
                    }
                });
            } else {
                res.render("repassword", {
                    title: "reset password",
                    logWarning: errorMessage
                });
            }
        });
    }
});

app.post("/upload", upload.single('fileName'), (req, res, next) => {
    const username = req.user.username;
    const media = new Media({
        name: req.body.name,
        desc: req.body.desc,
        img: {
            data: fs.readFileSync(path.join(__dirname + '/public/uploadedImages/' + req.file.filename)),
            contentType: 'image/png'
        }
    });
    if (req.isAuthenticated()) {
        console.log("uploaded successfully");
        User.findOne({
            username: username
        }, (err, foundUser) => {
            if (!err) {
                foundUser.media.push(media);
                foundUser.save((err) => {
                    if (err) {
                        console.log(err);
                        res.render("upload", {
                            title: "Upload files",
                            uploWarning: errorMessage
                        });
                    } else {
                        res.redirect("/media");
                    }
                });
            } else {
                res.render("upload", {
                    title: "Upload files",
                    uploWarning: errorMessage
                });
            }
        });
    } else {
        res.render("login", {
            title: "login-MediaFile",
            logWarning: loginFirst
        });
    }
});

app.post("/deletePhoto", (req, res) => {
    const username = req.user.username;
    const id = req.body.button;
    if (req.isAuthenticated()) {
        User.findOneAndUpdate({
            username: username
        }, {
            $pull: {
                media: {
                    _id: id
                }
            }
        }, function(err) {
            if (err) {
                res.render("media", {
                    title: "Hello " + req.user.name,
                    mediaWarn: errorMessage,
                    media: foundUser.media
                });
            } else {
                console.log("deleted successfully");
                res.redirect("/media");
            }
        });
    }
});

function errorHandler(err, req, res, next) {
    if (err) {
        console.log(err);
        res.send("<h1>" + err + "</h1>");
    } else {
        console.log("error from error handler");
    }
}
app.use(errorHandler);
//////////////////////////////server set up//////////////////////////////////
app.listen(process.env.PORT || 3000, () => {
    console.log("up and running on port 3000");
});
process.on('warning', (warning) => {
    console.log(warning.stack);
});
