//define all packages
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");
const helperFunctions = require('./helper-functions');

// set settings
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    keys: ["keyname1"]
  })
);

// test data
const urlDatabase = {
  b2xVn2: {
    fullURL: "http://www.lighthouselabs.ca",
    userID: "b7c9W3"
  },
  "9sm5xK": {
    fullURL: "http://www.google.com",
    userID: "S4f1p8"
  }
};

const users = {
  b7c9W3: {
    id: "b7c9W3",
    email: "sara.daniels@gmail.com",
    hashedPassword: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  S4f1p8: {
    id: "S4f1p8",
    email: "johndgregory@gmail.com",
    hashedPassword: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

app.use(function(request, response, next) {
  response.locals = {
    error: undefined,
    user: request.session.user
  };
  next();
});

// home
app.get("/", (request, response) => {
  helperFunctions.handleUserNotLoggedIn(request, response);

  response.redirect("/urls");
});

// dislay user urls
app.get("/urls", (request, response) => {
  helperFunctions.handleUserNotLoggedIn(request, response);

  const currentUser = request.session.user.id;
  const urlsFiltered = helperFunctions.urlsForUser(currentUser, urlDatabase);
  response.render("urls_index", { urls: urlsFiltered });
});

// generate a new tiny url
app.get("/urls/new", (request, response) => {
  helperFunctions.handleUserNotLoggedIn(request, response);

  response.render("urls_new");
});

// register a new user
app.get("/register", (request, response) => {
  response.render("registration_page");
});

// login page
app.get("/login", (request, response) => {
  response.render("login_page");
});

// link from short url to long url
app.get("/u/:shortURL", (request, response) => {

  helperFunctions.handleUrlNotValid(response, request.params.shortURL, urlDatabase);

  const longURL = urlDatabase[request.params.shortURL].fullURL;
  response.redirect(longURL);
});

app.get("/urls/:id", (request, response) => {
  helperFunctions.handleUserNotLoggedIn(request, response);
  helperFunctions.handleUrlNotValid(response, request.params.id, urlDatabase);

  helperFunctions.handleUrlNotOwnedByUser(request, response, urlDatabase);

  const shortURL = request.params.id;
  const longURL = urlDatabase[request.params.id].fullURL;
  response.render("urls_show", { shortURL: shortURL, longURL: longURL });
});

// generate new tiny url
app.post("/urls", (request, response) => {
  const longURL = request.body.longURL;
  helperFunctions.handleBadUrlPrefix(longURL, response);

  const currentUser = request.session.user.id;
  const shortURL = helperFunctions.generateRandomString();

  urlDatabase[shortURL] = { fullURL: longURL, userID: currentUser };
  response.status(302);
  response.redirect(302, `/urls/${shortURL}`);
});

// delete tiny url
app.post("/urls/:id/delete", (request, response) => {
  const currentKey = request.params.id;
  const currentUser = request.session.user.id;

  helperFunctions.handleUnownedUrl(currentUser, urlDatabase[currentKey].userID, response);
  delete urlDatabase[currentKey];
  response.status(200);
  response.redirect("/urls");
});

// edit tiny url
app.post("/urls/:id", (request, response) => {
  const newLongURL = request.body.longURL;
  const currentKey = request.params.id;
  const currentUser = request.session.user.id;

  helperFunctions.handleUnownedUrl(currentUser, urlDatabase[currentKey].userID);
  urlDatabase[currentKey].fullURL = newLongURL;
  response.redirect("/urls");
});

// authenticate login, create cookie
app.post("/login", (request, response) => {
  const user = helperFunctions.findUserByEmail(request.body.email, users);
  helperFunctions.handleBadLoginInfo(user, request, response);

  request.session.user = user;
  response.redirect("/urls");
});

// log user out, delete cookie
app.post("/logout", (request, response) => {
  const user = request.body.email;
  request.session = null;
  response.redirect("/login");
});

// create new user
app.post("/register", (request, response) => {
  const userHashedPassword = bcrypt.hashSync(request.body.password, 10);
  helperFunctions.handleBadRegister(request, response, userHashedPassword);
  const userEmail = request.body.email;
  helperFunctions.handleUsernameTaken(userEmail, response);

  const randID = helperFunctions.generateRandomString();
  users[randID] = {
    id: randID,
    email: userEmail,
    hashedPassword: userHashedPassword
  };

  request.session.user = users[randID];
  response.redirect("/urls");
});

// listen on port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

