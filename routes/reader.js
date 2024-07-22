const express = require("express");
const router = express.Router();

/**
 * @desc Displays all published articles
 */
router.get("/", (req, res, next) => {
    if (!req.session.user) { // if no login user
      res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
    }
    else {
        // Retrieve all published articles
        global.db.all("SELECT articles.article_published, articles.article_title, users.user_name, articles.article_likes, articles.article_id FROM articles JOIN users ON users.user_id = articles.author_id WHERE articles.article_type = 'publish' ORDER BY articles.article_published DESC",
            function (err, result) {
                if (err) {
                    next(err); // send the error on to the error handler
                }
                else {
                    // Count the number of likes for each published article
                    result.forEach(entry => {
                        likesArray = entry.article_likes.split(", ");
                        entry.article_likes = likesArray.length - 1;
                    });
                    res.render("reader-home", {user_username: req.session.user.user_username, data: result}); // render reader homepage
                }
            }
        );
    }
});

/**
 * @desc Renders a published article for reading
 */
router.get("/:id", (req, res, next) => {
    if (!req.session.user) { // if no login user
      res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
    }
    else {
        // Retrieve article information
        global.db.all("SELECT users.user_name, articles.article_published, articles.article_likes, articles.article_id, articles.article_title, articles.article_subtitle, articles.article_text, articles.article_comments FROM articles JOIN users ON users.user_id = articles.author_id WHERE articles.article_id = " + req.params.id,
            function (dataErr, dataResult) {
                if (dataErr) {
                    next(dataErr); // send the error on to the error handler
                }
                else {
                    // Count the number of likes for the article
                    likesArray = dataResult[0].article_likes.split(", ");
                    dataResult[0].article_likes = likesArray.length - 1;
                    // Display heart image based on whether article is liked/unliked
                    var heart_image;
                    if (likesArray.includes(req.session.user.user_id.toString())) {
                        heart_image = "/heart-red.png";
                    }
                    else {
                        heart_image = "/heart-white.png";
                    }
                    // Convert article comments from string to dictionary
                    const commentsArray = dataResult[0].article_comments.split(" ~~~ ");
                    const commentsResult = [];
                    for (let i = 1; i < commentsArray.length; i += 3) {
                        const commentsDict = {};
                        commentsDict.id = commentsArray[i];
                        commentsDict.username = commentsArray[i + 1];
                        commentsDict.comment = commentsArray[i + 2];
                        // Only display delete button for current user's comments
                        if (commentsArray[i] == req.session.user.user_id.toString()) {
                            commentsDict.delete_button = "block";
                        }
                        else {
                            commentsDict.delete_button = "none";
                        }
                        commentsResult.push(commentsDict);
                    }
                    res.render("reader-article", {user_type: req.session.user.user_type, user_username: req.session.user.user_username, heart_image: heart_image, dataData: dataResult, commentsData: commentsResult}); // render read article page
                }
            }
        );
    }
});

/**
 * @desc Likes/unlikes an article
 */
router.post("/:id/like", (req, res, next) => {
    if (!req.session.user) { // if no login user
      res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
    }
    else {
        // Retrieve article likes
        global.db.all("SELECT article_likes FROM articles WHERE article_id = " + req.params.id,
            function (err, result) {
                if (err) {
                    next(err); // send the error on to the error handler
                }
                else {
                    likesArray = result[0].article_likes.split(", ");
                    loginID = req.session.user.user_id.toString();
                    if (likesArray.includes(loginID)) { // if user unlikes the article
                        // Remove user ID from article likes
                        if (likesArray.indexOf(loginID) >= 0) {
                            likesArray.splice(likesArray.indexOf(loginID), 1);
                        }
                        newLikesString = likesArray.join(", ");
                        global.db.run("UPDATE articles SET article_likes = '" + newLikesString + "' WHERE article_id = " + req.params.id,
                            function (unlikeErr) {
                                if (unlikeErr) {
                                    next(unlikeErr); // send the error on to the error handler
                                }
                                else {
                                    res.redirect("/reader/" + req.params.id); // redirect to read article page
                                }
                            }
                        );
                    }
                    else { // if user likes the article
                        // Add user ID to article likes
                        global.db.run("UPDATE articles SET article_likes = article_likes || ', " + loginID + "' WHERE article_id = " + req.params.id,
                            function (likeErr) {
                                if (likeErr) {
                                    next(likeErr); // send the error on to the error handler
                                }
                                else {
                                    res.redirect("/reader/" + req.params.id); // redirect to read article page
                                }
                            }
                        );
                    }
                }
            }
        );
    }
});

/**
 * @desc Comments on an article
 */
router.post("/:id/comment", (req, res, next) => {
    if (!req.session.user) { // if no login user
      res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
    }
    else {
        // Add comment to article comments
        global.db.run("UPDATE articles SET article_comments = ' ~~~ " + req.session.user.user_id + " ~~~ " + req.session.user.user_username + " ~~~ " + req.body.comment + "' || article_comments WHERE article_id = " + req.params.id,
            function (err) {
                if (err) {
                    next(err); // send the error on to the error handler
                }
                else {
                    res.redirect("/reader/" + req.params.id); // redirect to read article page
                }
            }
        );
    }
});

/**
 * @desc Deletes a comment
 */
router.post("/:id/delete-comment", (req, res, next) => {
    if (!req.session.user) { // if no login user
      res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
    }
    else {
        // Retrieve article comments
        global.db.all("SELECT article_comments FROM articles WHERE article_id = " + req.params.id,
            function (commentsErr, commentsResult) {
                if (commentsErr) {
                    next(commentsErr); // send the error on to the error handler
                }
                else {
                    // Remove comment from article comments
                    updatedComments = commentsResult[0].article_comments.replace(" ~~~ " + req.body.id + " ~~~ " + req.body.username.substring(1) + " ~~~ " + req.body.comment, "");
                    global.db.run("UPDATE articles SET article_comments = '" + updatedComments + "' WHERE article_id = " + req.params.id,
                        function (deleteErr) {
                            if (deleteErr) {
                                next(deleteErr); // send the error on to the error handler
                            }
                            else {
                                res.redirect("/reader/" + req.params.id); // redirect to read article page
                            }
                        }
                    );
                }
            }
        );
    }
});

module.exports = router;