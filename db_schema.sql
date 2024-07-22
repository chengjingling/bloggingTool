PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_type TEXT NOT NULL CHECK (user_type IN ("author", "reader")),
    user_name TEXT NOT NULL,
    user_username TEXT NOT NULL,
    user_password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS authors (
    author_id INT PRIMARY KEY,
    blog_title TEXT NOT NULL,
    blog_subtitle TEXT NOT NULL,
    FOREIGN KEY (author_id) REFERENCES users (user_id)
);

CREATE TABLE IF NOT EXISTS articles (
    article_id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_type TEXT NOT NULL CHECK (article_type IN ("publish", "draft")),
    article_title TEXT NOT NULL,
    article_subtitle TEXT NOT NULL,
    article_text TEXT NOT NULL,
    article_created DATETIME NOT NULL,
    article_modified DATETIME NOT NULL,
    article_published DATETIME,
    article_likes TEXT,
    article_comments TEXT,
    author_id INT NOT NULL,
    FOREIGN KEY (author_id) REFERENCES authors (author_id)
);

COMMIT;