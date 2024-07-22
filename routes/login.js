const express = require("express");
const router = express.Router();

const bcrypt = require("bcrypt");
const saltRounds = 10;

/**
 * @desc Renders register/login page
 */
router.get("/", (req, res, next) => {
    // Destroy session when page is loaded
    req.session.destroy(function (err) {
        if (err) {
            next(err); // send the error on to the error handler
        }
        else {
            res.render("login", {registerMessage: "", loginMessage: ""}); // render login page
        }
    });
});

/**
 * @desc Registers a new user
 */
router.post("/register", (req, res, next) => {
    // Check if username exists
    global.db.all("SELECT user_username FROM users WHERE user_username = '" + req.body.username + "'",
        function (usernameErr, usernameResult) {
            if (usernameErr) {
                next(usernameErr); // send the error on to the error handler
            }
            else {
                if (usernameResult.length > 0) { // if username exists
                    res.render("login", {registerMessage: "Username @" + req.body.username + " already exists!", loginMessage: ""}); // display error message
                }
                else {
                    // Hash password
                    bcrypt.hash(req.body.password, saltRounds, 
                        function (hashErr, hash) {
                            if (hashErr) {
                                next(hashErr); // send the error on to the error handler
                            }
                            else {
                                // Insert new user into users table
                                global.db.run("INSERT INTO users ('user_type', 'user_name', 'user_username', 'user_password') VALUES (?, ?, ?, ?)",
                                    [req.body.type, req.body.name, req.body.username, hash],
                                    function (registerErr) {
                                        if (registerErr) {
                                            next(registerErr); // send the error on to the error handler
                                        }
                                        else {
                                            // Retrieve new user information
                                            global.db.all("SELECT * FROM users WHERE user_username = '" + req.body.username + "'",
                                                function (userErr, userResult) {
                                                    if (userErr) {
                                                        next(userErr); // send the error on to the error handler
                                                    }
                                                    else {
                                                        req.session.user = userResult[0]; // create session
                                                        if (req.body.type == "author") { // if user registered as author
                                                            // Insert new user into authors table
                                                            global.db.run("INSERT INTO authors ('author_id', 'blog_title', 'blog_subtitle') VALUES (?, ?, ?)",
                                                                [req.session.user.user_id, req.body.blog_title, req.body.blog_subtitle],
                                                                function (authorErr) {
                                                                    if (authorErr) {
                                                                        next(authorErr); // send the error on to the error handler
                                                                    }
                                                                    else {
                                                                        res.redirect("/author"); // redirect to author homepage
                                                                    }
                                                                }
                                                            );
                                                        }
                                                        else { // if user registered as reader
                                                            res.redirect("/reader"); // redirect to reader homepage
                                                        }
                                                    }
                                                }
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            }
        }
    );
});

/**
 * @desc Login a user
 */
router.post("/check-credentials", (req, res, next) => {
    // Retrieve user with matching username
    global.db.all("SELECT * FROM users WHERE user_username = '" + req.body.username + "'",
        function (userErr, userResult) {
            if (userErr) {
                next(userErr); // send the error on to the error handler
            }
            else {
                if (userResult.length < 1) { // if username does not exist
                    res.render("login", {registerMessage: "", loginMessage: "Username or password incorrect!"}); // display error message
                }
                else {
                    // Check password
                    bcrypt.compare(req.body.password, userResult[0].user_password,
                        function (passwordErr, passwordResult) {
                            if (passwordErr) {
                                next(passwordErr); // send the error on to the error handler
                            }
                            else {
                                if (!passwordResult) { // if password incorrect
                                    res.render("login", {registerMessage: "", loginMessage: "Username or password incorrect!"}); // display error message
                                }
                                else {
                                    req.session.user = userResult[0]; // create session
                                    if (userResult[0].user_type == "author") { // if user is an author
                                        res.redirect("/author"); // redirect to author homepage
                                    }
                                    else { // if user is a reader
                                        res.redirect("/reader"); // redirect to reader homepage
                                    }
                                }
                            }
                        }
                    );
                }
            }
        }
    );
});

module.exports = router;