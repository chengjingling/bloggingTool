const express = require("express");
const router = express.Router();

const date = require("date-and-time");

/**
 * @desc Displays the author's published and draft articles
 */
router.get("/", (req, res, next) => {
  if (!req.session.user) { // if no login user
    res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
  }
  else {
    // Retrieve blog title and subtitle
    global.db.all("SELECT blog_title, blog_subtitle FROM authors WHERE author_id = " + req.session.user.user_id,
      function (titleErr, titleResult) {
        if (titleErr) {
          next(titleErr); // send the error on to the error handler
        }
        else {
          // Retrieve the author's published articles
          global.db.all("SELECT article_title, article_published, article_likes, article_id FROM articles WHERE author_id = " + req.session.user.user_id + " AND article_type = 'publish' ORDER BY article_published DESC", 
            function (publishErr, publishResult) {
              if (publishErr) {
                next(publishErr); // send the error on to the error handler
              }
              else {
                // Retrieve the author's draft articles
                global.db.all("SELECT article_title, article_created, article_modified, article_id FROM articles WHERE author_id = " + req.session.user.user_id + " AND article_type = 'draft' ORDER BY article_modified DESC", 
                  function (draftErr, draftResult) {
                    if (draftErr) {
                      next(draftErr); // send the error on to the error handler
                    }
                    else {
                      // Count the number of likes for each published article
                      publishResult.forEach(entry => {
                        likesArray = entry.article_likes.split(", ");
                        entry.article_likes = likesArray.length - 1;
                      });
                      res.render("author-home", {user_username: req.session.user.user_username, user_name: req.session.user.user_name, titleData: titleResult, publishData: publishResult, draftData: draftResult}); // render author homepage
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
});

/**
 * @desc Renders create draft page
 */
router.get("/create", (req, res) => {
  if (!req.session.user) { // if no login user
    res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
  }
  else {
    res.render("author-create", {user_username: req.session.user.user_username}); // render create draft page
  }
});

/**
 * @desc Creates a new draft
 */
router.post("/create-draft", (req, res, next) => {
  if (!req.session.user) { // if no login user
    res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
  }
  else {
    const now = new Date();
    // Insert new draft into articles table
    global.db.run("INSERT INTO articles ('article_type', 'article_title', 'article_subtitle', 'article_text', 'article_created', 'article_modified', 'author_id') VALUES (?, ?, ?, ?, ?, ?, ?)",
      ["draft", req.body.title, req.body.subtitle, req.body.text, date.format(now, "YYYY/MM/DD HH:mm:ss"), date.format(now, "YYYY/MM/DD HH:mm:ss"), req.session.user.user_id],
      function (err) {
        if (err) {
          next(err); // send the error on to the error handler
        }
        else {
          res.redirect("/author"); // redirect to author homepage
        }
      }
    );
  }
});

/**
 * @desc Publishes a draft
 */
router.post("/publish/:id", (req, res, next) => {
  if (!req.session.user) { // if no login user
    res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
  }
  else {
    const now = new Date();
    // Update article to published
    global.db.run("UPDATE articles SET article_type = 'publish', article_published = '" + date.format(now, "YYYY/MM/DD HH:mm:ss") + "', article_likes = '', article_comments = '' WHERE article_id = " + req.params.id,
      function (err) {
        if (err) {
          next(err); // send the error on to the error handler
        }
        else {
          res.redirect("/author"); // redirect to author homepage
        }
      }
    );
  }
});

/**
 * @desc Prefills a draft for editing
 */
router.get("/edit/:id", (req, res, next) => {
  if (!req.session.user) { // if no login user
    res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
  }
  else {
    // Retrieve draft information
    global.db.all("SELECT article_id, article_title, article_subtitle, article_text, article_created, article_modified FROM articles WHERE article_id = " + req.params.id, 
      function (err, result) {
        if (err) {
          next(err); // send the error on to the error handler
        }
        else {
          res.render("author-edit", {user_username: req.session.user.user_username, data: result}); // render edit draft page
        }
      }
    );
  }
});

/**
 * @desc Updates a draft after editing
 */
router.post("/update-draft/:id", (req, res, next) => {
  if (!req.session.user) { // if no login user
    res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
  }
  else {
    const now = new Date();
    // Update draft information
    global.db.run("UPDATE articles SET article_title = '" + req.body.title.replaceAll("'", "''") + "', article_subtitle = '" + req.body.subtitle.replaceAll("'", "''") + "', article_text = '" + req.body.text.replaceAll("'", "''") + "', article_modified = '" + date.format(now, "YYYY/MM/DD HH:mm:ss") + "' WHERE article_id = " + req.params.id,
      function (err) {
        if (err) {
          next(err); // send the error on to the error handler
        }
        else {
          res.redirect("/author"); // redirect to author homepage
        }
      }
    );
  }
});

/**
 * @desc Deletes a published/draft article
 */
router.get("/delete/:id", (req, res, next) => {
  if (!req.session.user) { // if no login user
    res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
  }
  else {
    // Delete article from articles table
    global.db.run("DELETE FROM articles WHERE article_id = " + req.params.id,
      function (err) {
        if (err) {
          next(err); // send the error on to the error handler
        }
        else {
          res.redirect("/author"); // redirect to author homepage
        }
      }
    );
  }
});

/**
 * @desc Prefills settings for editing
 */
router.get("/settings", (req, res, next) => {
  if (!req.session.user) { // if no login user
    res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
  }
  else {
    // Retrieve author information
    global.db.all("SELECT users.user_username, users.user_name, authors.blog_title, authors.blog_subtitle FROM users JOIN authors ON authors.author_id = users.user_id WHERE users.user_id = " + req.session.user.user_id, 
      function (err, result) {
        if (err) {
          next(err); // send the error on to the error handler
        }
        else {
          res.render("author-settings", {data: result}); // render settings page
        }
      }
    );
  }
});

/**
 * @desc Updates settings after editing
 */
router.post("/update-settings", (req, res, next) => {
  if (!req.session.user) { // if no login user
    res.render("login", {registerMessage: "", loginMessage: "Something went wrong, please login again."}); // redirect to login page
  }
  else {
    // Update author name
    global.db.run("UPDATE users SET user_name = '" + req.body.author.replaceAll("'", "''") + "' WHERE user_id = " + req.session.user.user_id, 
      function (userErr) {
        if (userErr) {
          next(userErr); // send the error on to the error handler
        }
        else {
          // Update blog title and subtitle
          global.db.all("UPDATE authors SET blog_title = '" + req.body.title.replaceAll("'", "''") + "', blog_subtitle = '" + req.body.subtitle.replaceAll("'", "''") + "' WHERE author_id = " + req.session.user.user_id, 
            function (authorErr) {
              if (authorErr) {
                next(authorErr); // send the error on to the error handler
              }
              else {
                req.session.user.user_name = req.body.author.replaceAll("'", "''"); // update author name in session data
                res.redirect("/author"); // redirect to author homepage
              }
            }
          );
        }
      }
    );
  }
});

module.exports = router;