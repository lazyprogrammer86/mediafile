const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose =require("mongoose");
const session = require("express-session");
const passport= require("passport");
const passportLocalMongoose =require("passport-local-mongoose");
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

const user = "user"

app.get("/",(req,res)=>{
    res.render("Preview",{title:"Media-File"});
});

app.get("/register",(req,res)=>{
    res.render("register",{title:"Register-MediaFile",regaction:"register",reghead:"Sign Up",regWarning:""});
});

app.get("/login",(req,res)=>{
    res.render("login",{title:"login-MediaFile",logWarning:""});
});
app.get("/everify",(req,res)=>{
    res.render("everify",{title:"Verification"})});

app.get("/cverify",(req,res)=>{
    res.render("cverify",{title:"verification",mailId:"media@file.com"});
});

app.get("/media",(req,res)=>{
    res.render("media",{"title":user});
});

app.listen(process.env.PORT || 3000, () => {
    console.log("up and running on port 3000");
});
