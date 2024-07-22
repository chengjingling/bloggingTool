const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const app = express();
const port = 3000;

// Make the database global so that it is accessible throughout the app
global.db = new sqlite3.Database("./database.db", function(err) {
  if (err) {
    console.error(err);
    process.exit(1); // bail out when we cannot connect to the database
  }
  
  else {
    console.log("Database connected");
    global.db.run("PRAGMA foreign_keys=ON"); // tell sqlite to pay attention to foreign key constraints
  }
});

// Set the app to use express-session for secure session
app.use(express.json());
app.use(
    cors({
        origin: ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true
    })
);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
    session({
        key: "userId",
        secret: "thisisasecret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 1000 * 60 * 60 * 24
        }
    })
);

// Set the app to use ejs for rendering
app.set("view engine", "ejs");

// Redirect to login page when app is run
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Add all login routes to the app under the path /login
const loginRoute = require("./routes/login");
app.use("/login", loginRoute);

// Add all author routes to the app under the path /author
const authorRoute = require("./routes/author");
app.use("/author", authorRoute);

// Add all reader routes to the app under the path /reader
const readerRoute = require("./routes/reader");
app.use("/reader", readerRoute);

// Make the "public" folder public so that it is accessible throughout the app
app.use(express.static("public"));

// Use port 3000
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})