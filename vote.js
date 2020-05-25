const express = require("express");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
var flash = require('connect-flash');
const vote = express();
const Voter = require('./models/user');
const Position = require('./models/position');
const Candidate = require('./models/candidate');
const Time = require('./models/time');
const Svote = require('./models/svote');
var crypto = require("crypto");
var async = require("async");
var session = require('express-session');
var cookieParser = require('cookie-parser');

mongoose.connect("mongodb://localhost/voter", { useNewUrlParser: true });

var db = mongoose.connection;
db.on("error", console.log.bind(console, "connection error"));
db.once("open", function (callback) {
  console.log("connection succeeded");
});

vote.use(bodyParser.json());
vote.use(
  bodyParser.urlencoded({
    extended: true,
  })
); 
db.createCollection("positions");
db.createCollection("candidates");
db.createCollection("times");
db.createCollection("svotes");
vote.use(cookieParser());
vote.use(session({ 
     secret: 'secret123',
     saveUninitialized: true,
     resave: true,
}));
vote.use(flash());    


vote.set("view engine", "ejs");
vote.use('/assets',express.static('assets'));
vote.use('/assets_1',express.static('assets_1'));
vote.use('/assets_2',express.static('assets_2'));
vote.use('/assets_3',express.static('assets_3'));
vote.use('/assets_4', express.static("assets_4"));
vote.use("/assets_5", express.static("assets_5"));
vote.use("/assets_6", express.static("assets_6"));
vote.use("/assets_7", express.static("assets_7"));
vote.use("/assets_8", express.static("assets_8"));

vote.get("/", function (req, res) {
    res.render('index');
});

vote.get("/register",function(req,res){
    res.render('register');
});

vote.post("/register", function (req, res) {
     var data = {
       "name": req.body.name,
       "email": req.body.email,
       "dept": req.body.dept,
       "hall": req.body.hall,
       "password": req.body.password,
     }; 

    db.collection('voters').findOne({ email: req.body.email }, function (err, user) {
      if (err) {
        console.log(err);
      }
      else if (user) {
        var err = new Error(
          "A user with that email has already registered. Please use a different email.."
        );
        err.status = 400;
        return next(err);
        return res.redirect("register");
      } else {
          rand = Math.floor(Math.random() * 100 + 54);
          host = req.get("host");
         let mailTransporter = nodemailer.createTransport({
           service: "Gmail",
           auth: {
             user: "rahul.bharadhwaj9@gmail.com",
             pass: "Rahul@9999",
           },
         });
        link = "http://" + req.get("host") + "/verify?id=" + rand;
        let mailDetails = {
          from: "rahul.bharadhwaj9@gmail.com",
          to: req.body.email,
          subject: "Registration for Online Voting",
          html:
            "Hello,<br> Please Click on the link to verify your email.<br><a href=" +
            link +
            ">Click here to verify</a>",
        };

        mailTransporter.sendMail(mailDetails, function (err, data) {
          if (err) {
            console.log("Error Occurs");
          } else {
            console.log("Email sent successfully");
          }
        }); 
        db.collection("voters").insertOne(data, function (err, collection) {
          if (err) throw err;
          console.log("Record inserted Successfully");
        });
        return res.redirect("/");
      }
    }); 
}); 

vote.get("/verify", function (req, res) {
  console.log(req.protocol + ":/" + req.get("host"));
  if (req.protocol + "://" + req.get("host") == "http://" + host) {
    console.log("Domain is matched. Information is from Authentic email");
    if (req.query.id == rand) {
      console.log("email is verified");
      res.end("<h1>Email " + mailDetails.to + " is been Successfully verified");
    } else {
      console.log("email is not verified");
      res.end("<h1>Bad Request</h1>");
    }
  } else {
    res.end("<h1>Request is from unknown source");
  }
});

vote.get("/admin", function (req, res) {
  res.render('admin');
});

vote.post("/admin",function(req,res){
     if(req.body.key === '123456789')
     return res.render("adminpage");
     else 
     return res.redirect("/");
});

vote.get("/forgotpassword",function(req,res){
    res.render('forgotpassword');
});

vote.post("/forgotpassword", function (req, res, next) {
  async.waterfall(
    [
      function (done) {
        crypto.randomBytes(20, function (err, buf) {
          var token = buf.toString("hex");
          done(err, token);
        });
      },
      function (token, done) {
        Voter.findOne({ email: req.body.email }, function (err, user) {
          if (!user) {
            req.flash("error", "No account with that email address exists.");
            return res.redirect("/forgotpassword");
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function (err) {
            done(err, token, user);
          });
        });
      },
      function (token, user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "rahul.bharadhwaj9@gmail.com",
            pass: "Rahul@9999",
          },
        });
        var mailOptions = {
          to: user.email,
          from: "rahul.bharadhwaj9@gmail.com",
          subject: "Password Reset",
          text:
            "You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n" +
            "Please click on the following link, or paste this into your browser to complete the process:\n\n" +
            "http://" +
            req.headers.host +
            "/reset/" +
            token +
            "\n\n" +
            "If you did not request this, please ignore this email and your password will remain unchanged.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          console.log("mail sent");
          req.flash(
            "success",
            "An e-mail has been sent to " +
              user.email +
              " with further instructions."
          );
          done(err, "done");
        });
      },
    ],
    function (err) {
      if (err) return next(err);
      res.redirect("/forgotpassword");
    }
  );
});

vote.get("/reset/:token", function (req, res) {
  db.collection('voters').findOne(
    {
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    },
    function (err, user) {
      if (!user) {
        req.flash("error", "Password reset token is invalid or has expired.");
        return res.redirect("/forgotpassword");
      }
      res.render("reset", { token: req.params.token });
    }
  );
});

vote.post("/reset/:token", function (req, res) {
  async.waterfall(
    [
      function (done) {
        db.collection('voters').findOne(
          {
            resetPasswordToken: req.params.token,
            resetPasswordExpires: { $gt: Date.now() },
          },
          function (err, user) {
            if (!user) {
              req.flash(
                "error",
                "Password reset token is invalid or has expired."
              );
              return res.redirect("/forgotpassword"); //----------------------------------------------------------------------
            }
            if (req.body.password === req.body.confirm) {
              user.setPassword(req.body.password, function (err) {
                user.resetPasswordToken = undefined;
                user.resetPasswordExpires = undefined;

                user.save(function (err) {
                  req.logIn(user, function (err) {
                    done(err, user);
                  });
                });
              });
            } else {
              req.flash("error", "Passwords do not match.");
              return res.redirect("/forgotpassword"); //---------------------------------------------------------------------
            }
          }
        );
      },
      function (user, done) {
        var smtpTransport = nodemailer.createTransport({
          service: "Gmail",
          auth: {
            user: "rahul.bharadhwaj9@gmail.com",
            pass: 'Rahul@9999',
          },
        });
        var mailOptions = {
          to: user.email,
          from: "rahul.bharadhwaj9@mail.com",
          subject: "Your password has been changed",
          text:
            "Hello,\n\n" +
            "This is a confirmation that the password for your account " +
            user.email +
            " has just been changed.\n",
        };
        smtpTransport.sendMail(mailOptions, function (err) {
          req.flash("success", "Success! Your password has been changed.");
          done(err);
        });
      },
    ],
    function (err) {
      res.redirect("/"); //----------------------------------------------------------------------------
    }
  );
});

vote.post("/login",function(req,res){
    db.collection('voters').findOne({ email: req.body.email }, function (err, user){
        if (err) {
          console.log(err);
        }
        else if(user){
            if(user.password == req.body.password){
            return res.render("voterpage",{record: user});
            }
            else
            return res.send('Invalid password');
        }
        else
        return res.send('User not registered');
    });
});

vote.get("/Home1",function(req,res){
   res.render("adminpage");
});

vote.get("/managePositions",function(req,res){
   var records = Position.find({}, function (err, data){
     res.render("managePositions", { record: data });
   }); 
});

vote.post("/managePositions",function(req,res){
    var data={"name": req.body.position};
   db.collection('positions').findOne({ name: req.body.position}, function(err,position){
       if(err){
       console.log(err);
       }
       else if (position) {
        //  alert(req.body.name +  "already exists!");
         res.send("Position already exists");
       }
       else{
           db.collection('positions').insertOne(data, function(err, collection){
               if(err) throw err;
               console.log("Position Inserted Successfully");
           });
           var records = Position.find({},function(err,data){
               res.render("managePositions", { record: data });
           }); 
       }
   });
});

vote.get("/delete/:id",function(req,res){
    db.collection('positions').deleteOne({name: req.params.id},function(err,obj){
        if(err) throw err;
        console.log('1 Item deleted');
    });
    res.redirect("/managePositions");
});

vote.get("/manageCandidates", function (req, res) {
  var records = Position.find({}, function (err, data) {
      var candidates = Candidate.find({}, function(err, data2){
          res.render("manageCandidates", { record: data , candidates: data2});
      });
  });
});

vote.post("/manageCandidates",function(req,res){
     var data = { "name": req.body.name, "position": req.body.position };
     db.collection("candidates").findOne({ name: req.body.name, position: req.body.position }, function(err,candidate) {
       if (err) {
         console.log(err);
       } 
       else if (candidate) {
         //  alert(req.body.name +  "already exists!");
         res.send("Candidate already exists");
       } else {
         db.collection('candidates').insertOne(data, function (err, collection) {
           if (err) throw err;
           console.log("Candidate Inserted Successfully");
         });
         var records = Position.find({}, function (err, data) {
           var candidates = Candidate.find({}, function (err, data2) {
             res.render("manageCandidates", { record: data,candidates: data2,});
           });
         });
       }
     });
});

vote.get("/dismiss/:id&:id2", function (req, res) {
  db.collection("candidates").deleteOne({ name: req.params.id,position: req.params.id2}, function (err,obj) {
    if (err) throw err;
    console.log("1 Item deleted");
  });
  res.redirect("/manageCandidates");
});

vote.get("/setTime",function(req,res){
  var doc = Time.find({}, function(err, data){
    if(err) throw err;
    res.render("setTime", { record: data });
  });
});

vote.post("/setTime",function(req,res){
  var d1 = new Date(req.body.ropentime);
  var d2 = new Date(req.body.rclosetime);
  var d3 = new Date(req.body.votestarttime);
  var d4 = new Date(req.body.voteclosetime);
  var data = {
    "name1": d1,
    "name2": d2,
    "name3": d3,
    "name4": d4,
  };
  if(db.collection("times").find({}) != null){
    db.collection("times").deleteOne({});
  }
  if((d1 < d2)&&(d3 <d4)&&(d2 < d3)){
    db.collection("times").insertOne(data, function (err, collection) {
      if (err) throw err;
      console.log("Time inserted Successfully");
    });
    res.redirect("setTime");
  }
  else 
    res.send("Timing is not proper");
});

vote.get("/viewapplicants",function(req,res){
  var doc = Voter.find({}, function (err, data) {
    if (err) throw err;
    res.render("viewapplicants", { record: data });
  });
});

vote.get("/disapprove/:id&:id2", function (req, res) {
  var myquery = { "name": req.params.id };
  var newvalues = { $set: { isapplicant: false } };
  dbo.collection("voters").updateOne(myquery, newvalues, function (err, res) {
    if (err) throw err;
    console.log("1 document updated");
  });
  res.redirect("/viewapplicants");
});

vote.get("/Home2/:id", function (req, res) {
  db.collection("voters").findOne({email: req.params.id},function(err,user){
    if (err) throw err;
    else
      res.render("voterpage",{record: user});
  });
});

vote.get("/currentPolls/:id",function(req,res){
     var currentdate = new Date();
    var t1,t2;
    db.collection("times").findOne({}, function(err, data){
      if (err) throw err;
       t1 = new Date(data.name3);
       t2 = new Date(data.name4);

      if ((t1 == undefined) || (t2 == undefined)) {
        res.send("No polls right now.Check again later");
      }

      if ((currentdate > t1) && (currentdate < t2)) {
        db.collection("voters").findOne({ email: req.params.id }, function (err, user) {
          if (err) throw err;
          else
          var abc = Position.find({},function(err,data){
            var ab = Candidate.find({},function(err1,data1){
              res.render("currentPolls", { record: user, record1: data, record2 : data1 });
            });
          });   
        });
      }
      else 
        res.send("No polls right now.Check again later");
    });
 });

 vote.post("/currentPolls/:id",function(req,res){

       var abc = Position.find({}, function (err, record) {

         record.forEach(function(data){
           var Name = req.body.data.name;
           var myquery = { "name": Name  };
           var ab = Candidate.find({"name": Name,"position": data.name}, function(err,obj){
             var count = obj.votecount + 1;
             var newvalues = { $set: { "votecount": count } };
             db.collection("candidates").updateOne(myquery, newvalues, function (err, res) {
               if (err) throw err;
             });
             db.collection("voters").findOne({ email: req.params.id }, function (err, user) {
               if (err) throw err;
               var dept = user.dept;
               var hall = user.hall;
               var voter_name = user.name;
               var myobj = { "position": data.name, "candidate": Name,"dept": dept,"hall": hall,"voter_name": voter_name };
               dbo.collection("svotes").insertOne(myobj, function (err, res) {
                 if (err) throw err;
                 console.log("1 document inserted");
                 res.render("voterpage", { record: user });
               });
             });       
           });
         });
       });
 });

vote.get("/manageProfile/:id", function (req, res) {
  db.collection("voters").findOne({ email: req.params.id }, function (err, user) {
    if (err) throw err;
    else
      res.render("manageProfile", { record: user });
  });
});

vote.post("/manageProfile/:id",function(req,res){
  var myquery = { "email": req.params.id };
  var newvalues = { $set: { "name": req.body.name, "dept": req.body.dept, "hall": req.body.hall, "password": req.body.password } };
  db.collection("voters").updateOne(myquery, newvalues, function (err, res) {
    if (err) throw err;
    else res.send("Profile Updated");
  });
});

vote.get("/apply/:id",function(req,res){
  var t1, t2;
  var currentdate = new Date();
  db.collection("times").findOne({}, function (err, data) {
    if (err) throw err;
    t1 = new Date(data.name1);
    t2 = new Date(data.name2);

    if ((t1 == undefined) || (t2 == undefined)) {
      res.send("Cant apply now");
    }

    if ((currentdate > t1) && (currentdate < t2)) {
      db.collection("voters").findOne({ email: req.params.id }, function (err, user) {
        if (err) throw err;
        var abc = Position.find({},function(err,obj){
          res.render("apply",{record: user, record1: obj});
        });
      });
    }
    else
      res.send("Cant apply now");
  });
});

vote.post("/apply/:id",function(req,res){
  db.collection("voters").findOne({ email: req.params.id }, function (err, user) {
    if (err) throw err;
    if(user.isapplicant == true){
      res.send("Already applied for a position");
    }
      db.collection("candidates").findOne({"name": user.name, "position":req.body.position},function (err, obj) {
      if(obj!= null)
      res.send("Already applied for that position");
      db.collection("times").findOne({},function(err,data){
        if(err) throw err;
        var t1 = new Date(data.name1);
        var t2 = new Date(data.name2);
        var currentdate = new Date();

        if ((t1 == undefined) || (t2 == undefined)) {
          res.send("Cant apply now");
        }
        if((currentdate>t1)&&(currentdate<t2)){
          var myquery = { "email": req.params.id };
          var newvalues = { $set: { "isapplicant": true } };
          db.collection("voters").updateOne(myquery, newvalues, function (err, res) {
            if (err) throw err;
            else res.send("Applied Succesfully");
          });
        }
      });
    });
  });
});

vote.get("/viewResults/:id",function(req,res){
  var t1, t2;
  var currentdate = new Date();
  db.collection("times").findOne({}, function (err, data) 
  {
    if (err) throw err;
    t1 = new Date(data.name1);
    t2 = new Date(data.name4);
    var totalwin = [];
    if ((t1 == undefined) || (t2 == undefined)) {
      res.send("Cant view now");
    }
    if(currentdate > t2) 
    {
      db.collection("voters").findOne({ email: req.params.id }, function (err, user) 
      {
        var abc = Position.find({},function(err,record2)
        {
          record2.forEach(function(data)
          {
            var max_count = 0;
            var win = [];
            var ab = Candidate.find({},function(err,record1)
            {  
              record1.forEach(function(data1)
              {
                if(data1.position == data.name)
                {
                    if(data1.vote_count >= max_count)
                    {
                      max_count = data1.vote_count;
                      win.push(data1.name);
                    }
                }
              });
              totalwin.push(win);
            });
          });
           res.render("viewResults",{record: user, record1: totalwin, record2: record2});
        });
      });
    }
    else
      res.send("Cant view now");
  });
});


vote.listen(process.env.port || 5000, function () {
   console.log("now listeing for requests");
});







