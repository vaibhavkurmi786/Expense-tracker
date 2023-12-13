var express = require('express');
var router = express.Router();
const upload = require('./multer')
const user = require('../model/userSchema');
const  {sendmail} = require('../model/sendmail')
const passport = require("passport");
const LocalStrategy = require("passport-local");
passport.use(new LocalStrategy(user.authenticate()));
const expenses = require('../model/expenseSchema')


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

//login page
router.post('/',passport.authenticate("local", {
  successRedirect: "/dashboard",
  failureRedirect: "/",
})  , function(req, res, next) {
  console.log(`user logged in`);
});


//signup page
router.get('/signup', function(req, res, next) {
  res.render('signup', { title: 'Express' });
});


router.post('/signup', upload.single('file'),async function(req, res, next) {
  try {
    await user.register(
      {username:req.body.username, email: req.body.email, file:req.body.file},
      req.body.password
      )
      res.redirect('/')
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  });

  
  //dashboard
  router.get('/dashboard', isLoggedIn, async function(req, res, next) {
    try {
      const { expenses } = await req.user.populate("expenses");
      console.log(req.user, expenses);
      res.render("dashboard", { admin: req.user, expenses });
  } catch (error) {
    console.log(error);
      res.send(error);
  }
  
  });

  router.get('/addexpense',  isLoggedIn, async function(req, res, next) {
    try {
      const { expenses } = await req.user.populate("expenses");
      console.log(req.user, expenses);
      res.render("addexpense", { admin: req.user, expenses });
  } catch (error) {
    console.log(error);
      res.send(error);
  }
  });

  router.post("/addexpense", isLoggedIn, async function (req, res, next) {
    try {
        const expense = new expenses(req.body);
        req.user.expenses.push(expense._id);
        expense.user = req.user._id;
        await expense.save();
        await req.user.save();
        res.redirect("/dashboard");
    } catch (error) {
        res.send(error);
    }
});




// logout functionality
router.get('/logout', isLoggedIn ,function(req, res, next) {
    req.logout(()=>{
      res.redirect('/')
      console.log(`user logged out`);
    })
});



router.get('/forgot', function(req, res, next) {
  res.render('forgotpassword', { admin: req.user});
});



router.post("/sendmail", async function (req, res, next) {
  try {
      const User = await user.findOne({ email: req.body.email });
      if (!User)
          return res.send("User Not Found! <a href='/forgot'>Try Again</a>");

      sendmail(User.email, User, res, req);
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});


router.post("/forgot/:id", async function (req, res, next) {
  try {
      const User = await user.findById(req.params.id);
      if (!User)
          return res.send("User not found! <a href='/forgot'>Try Again</a>.");

      if (User.token == req.body.token) {
          User.token = -1;
          await User.setPassword(req.body.newpassword);
          await User.save();
          res.redirect("/");
      } else {
          User.token = -1;
          await User.save();
          res.send("Invalid Token! <a href='/forgot'>Try Again<a/>");
      }
  } catch (error) {
      res.send(error);
  }
});




router.get("/reset", isLoggedIn, function (req, res, next) {
  res.render("reset", { admin: req.user });
});
router.get("/back", isLoggedIn, function (req, res, next) {
  res.redirect('/dashboard')
});

router.get("/filter", async function (req, res, next) {
  try {
      let { expenses } = await req.user.populate("expenses");
      expenses = expenses.filter((e) => e[req.query.key] == req.query.value);
      res.render("dashboard", { admin: req.user, expenses });
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});

router.post("/reset", isLoggedIn, async function (req, res, next) {
  try {
      await req.user.changePassword(
          req.body.oldpassword,
          req.body.newpassword
      );
      await req.user.save();
      res.redirect("/dashboard");
  } catch (error) {
      res.send(error);
  }
});

router.get('/return', function(req, res, next) {
res.redirect('/')});
module.exports = router;


// AUTHENTICATED ROUTE MIDDLEWARE
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect("/");
    }
}




router.get('/delete/:id', async function (req, res, next) {
  try {
      await expenses.findByIdAndDelete(req.params.id)
      res.redirect("/dashboard")
  } catch (error) {
      res.send(error)
  }
})

router.get('/update/:id', isLoggedIn, async function (req, res, next) {
  try {
      const data = await expenses.findById(req.params.id)
      res.render('update', { admin: req.user, data })
  } catch (error) {
    console.log(error);
      res.send(error)
  }
});

router.post('/update/:id', isLoggedIn, async function (req, res, next) {
  try {
      const data = await expenses.findByIdAndUpdate(req.params.id, req.body)
      await data.save()
      res.redirect('/dashboard')
  } catch (error) {

  }
})