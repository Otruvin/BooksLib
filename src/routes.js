if (process.env.NODE_ENV !== 'production')
{
    require('dotenv').config();
}

const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const initializePassport = require('./passport-config');
const fs = require('fs');
const flash = require('express-flash');
const session = require('express-session');
const methodOverride = require('method-override');
const store = require('jfs');

const db = new store('./database.json', {saveId: 'id', pretty: true});
const dbBooks = new store('./booksDB.json', {saveId: 'id', pretty: true});
let users = Object.values(db.allSync());
let books = Object.values(dbBooks.allSync());
initializePassport(
    passport, 
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
    );
const router = express.Router();
router.use(express.urlencoded({ extended: false }));
router.use(flash());
router.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

router.use(passport.initialize());
router.use(passport.session());
router.use(methodOverride('_method'));

Date.prototype.yyyymmdd = function() {
    var mm = this.getMonth() + 1;
    var dd = this.getDate();
  
    return [this.getFullYear(),
            (mm>9 ? '' : '0') + mm,
            (dd>9 ? '' : '0') + dd
           ].join('');
  };

router.get("/userLibrary", checkAuthenticated, (req, res) => {
    var id = req.user.id;
    var user = db.getSync(id);
    var booksUser = [];
    books.forEach( book => {
        if (book.owner === id) {
            booksUser.push(book);
        }
    })
    res.render("librarypage", {
        emailVal: req.user.email,
        booksVal: booksUser
    });
    
});

router.post("/takebookback", (req, res) => {
    var nameVal = req.body.name;
    var authorVal = req.body.author;
    var dateOfWrittenVal = req.body.dateOfWritten;
    var id = req.body.id;
    var idUser = req.user.id;
    var sendedVal = req.body.sended;
    try
    {
        dbBooks.saveSync(id, {
            name: nameVal,
            author: authorVal,
            dateOfWritten: dateOfWrittenVal,
            owner: idUser,
            sended: sendedVal
        });
        return res.redirect('/userLibrary');
    }
    catch
    {
        return res.redirect('/saveUpdate');
    }
});

router.post("/takebooksave", (req, res) => {
    var nameVal = req.body.name;
    var authorVal = req.body.author;
    var dateOfWrittenVal = req.body.dateOfWritten;
    var id = req.body.id;
    var idUser = req.user.id;
    var sendedVal = req.body.sended;
    try
    {
        dbBooks.saveSync(id, {
            name: nameVal,
            author: authorVal,
            dateOfWritten: dateOfWrittenVal,
            owner: idUser,
            sended: sendedVal
        });
        return res.redirect('/userLibrary');
    }
    catch
    {
        return res.redirect('/saveUpdate');
    }
});

router.post("/takebook", (req, res) => {

    var datenow = new Date();
    datenow.yyyymmdd();

    res.render("takedpage", {
        nameVal: req.body.name,
        authorVal: req.body.author,
        dateOfWrittenVal: req.body.dateOfWritten,
        idVal: req.body.id,
        sendedVal: req.body.sended,
        datenowVal: datenow
    });
});

router.post("/delBook", (req, res) => {
    var id = req.body.id;

    try
    {
        dbBooks.delete(id);
        return res.redirect('/userLibrary');
    }
    catch
    {
        return res.redirect('/delBook');
    }
    
});

router.post("/saveUpdate", (req, res) => {
    var nameVal = req.body.name;
    var authorVal = req.body.author;
    var dateOfWrittenVal = req.body.dateOfWritten;
    var id = req.body.id;
    var idUser = req.user.id

    try
    {
        dbBooks.saveSync(id, {
            name: nameVal,
            author: authorVal,
            dateOfWritten: dateOfWrittenVal,
            owner: idUser,
            sended: "none"
        });
        return res.redirect('/userLibrary');
    }
    catch
    {
        return res.redirect('/saveUpdate');
    }
    
});

router.post("/updateBook", (req, res) => {

    res.render("updatebookpage", {
        nameVal: req.body.name,
        authorVal: req.body.author,
        dateOfWrittenVal: req.body.dateOfWritten,
        idVal: req.body.id
    });
});

router.post("/addbook", (req, res) => {
    var idUser = req.user.id;
    try
    {
        var id = dbBooks.saveSync({
            name: req.body.nameBook,
            dateOfWritten: req.body.dateOfWritten,
            author: req.body.author,
            owner: idUser,
            sended: "none"
        });
        
        return res.redirect('/userLibrary')

    }
    catch
    {
        return res.redirect('/addbook')
    }
});

router.get("/addbook", (req, res) => {
    res.render("addbookpage");
})

router.delete('/logout', (req, res) => {
    req.logOut();
    res.redirect('/login');
});

router.get("/", (req, res) => {
    res.render("mainpage");
});

router.get("/login", checkNotAuthenticated, (req, res) => {
    res.render("loginpage");
});

router.post("/login", checkNotAuthenticated, passport.authenticate('local', {
    successRedirect: '/userLibrary',
    failureRedirect: '/login',
    failureFlash: true
}));

router.get("/register", checkNotAuthenticated, (req, res) => {
    res.render("registerpage");
});

router.post("/register", checkNotAuthenticated, async (req, res) => {
    try
    {
        const hashedPassword = await bcrypt.hash(req.body.txtPassword, 10);
        var id = db.saveSync({
            email: req.body.txtEmail,
            password: hashedPassword,
        });
        res.redirect('/login');
    }catch
    {
        res.redirect('/register');
    }
});

function checkAuthenticated(req, res, next)
{
    if (req.isAuthenticated())
    {
        return next();
    }

    res.redirect('/login');
}

function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated())
    {
        return res.redirect('/userLibrary');
    }
    next();
}

router.get("*", (req, res) => {
    res.status(404);
    res.render("404page");
});

module.exports = router;