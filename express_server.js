//define all packages
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

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

// generates random string for TinyUrl & user ID
function generateRandomString() {
  let randomString = "";
  let possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 6; i++) {
    randomString += possible.charAt(
      Math.floor(Math.random() * possible.length)
    );
  }

  return randomString;
}

// find user by email
function findUserByEmail(userEmail) {
  for (let user in users) {
    if (users[user].email === userEmail) {
      return users[user];
    }
  }
}

// find urls corresponding to user id
function urlsForUser(ID) {
  let filtered = {};

  for (let tinyUrl in urlDatabase) {
    if (ID === urlDatabase[tinyUrl].userID) {
      filtered[tinyUrl] = urlDatabase[tinyUrl];
    }
  }

  return filtered;
}

// handler functions:

function handleUserNotLoggedIn(request, response) {
  if (!request.session.user) {
    response.status(401);
    response.redirect(401, "/login");
  }
}

function handleBadUrlPrefix(longURL) {
  const hasHttp =
    longURL
      .split("")
      .splice(0, 7)
      .join("") === "http://";
  const hasHttps =
    longURL
      .split("")
      .splice(0, 8)
      .join("") === "https://";

  if (!hasHttp && !hasHttps) {
    response.status(406);
    response.redirect(406, "/urls/new");
  }
}

function handleUnownedUrl(currentUser, urlOwner) {
  if (currentUser !== urlOwner) {
    response.status(403);
    response.render("error-page", {
      error: "403: Forbidden, Must Be Your TinyUrl To Modify"
    });
  }
}

function handleBadLoginInfo(user, request, response) {
  if (!user) {
    response.status(404);
    response.redirect(404, "/register");
  } else if (!bcrypt.compareSync(request.body.password, user.hashedPassword)) {
    response.status(404);
    response.redirect(404, "/login");
  }
}

function handleBadRegister(request, response, userHashedPassword) {
  const userEmail = request.body.email;

  if (!userEmail) {
    response.status(400);
    response.render("registration_page", {
      error: "400: Bad Request, Please Enter A Username"
    });
    return;
  }

  if (!userHashedPassword) {
    response.status(400);
    response.render("login_page", {
      error: "400: Bad Request, Please Enter a Password"
    });
    return;
  }
}

function handleUsernameTaken(userEmail, response) {
  if (findUserByEmail(userEmail)) {
    response.status(403);
    response.redirect(403, "/login");
  }
}

function handleUrlNotOwnedByUser(request, response, id) {
  const currentUser = request.session.user.id;
  const urlsFiltered = urlsForUser(currentUser);
  const access = Object.keys(urlsFiltered).includes(id);

  if (!access) {
    response.status(401);
    response.render("error-page", {
      error: `401: Unauthorized, You Don't Have Access To This url`
    });
  }
}

function handleUrlNotValid(request, response, id) {
  if (urlDatabase[id] === undefined) {
    response.status(403);
    response.render("error-page", {
      error: "403: Forbidden, TinyUrl Does Not Exist"
    });
  }
}

app.use(function(request, response, next) {
  response.locals = {
    error: undefined,
    user: request.session.user
  };
  next();
});

// home
app.get("/", (request, response) => {
  handleUserNotLoggedIn(request, response);

  response.redirect("/urls");
});

// dislay user urls
app.get("/urls", (request, response) => {
  handleUserNotLoggedIn(request, response);

  const currentUser = request.session.user.id;
  const urlsFiltered = urlsForUser(currentUser);
  response.render("urls_index", { urls: urlsFiltered });
});

// generate a new tiny url
app.get("/urls/new", (request, response) => {
  handleUserNotLoggedIn(request, response);

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

  handleUrlNotValid(request, response, request.params.shortURL);

  const longURL = urlDatabase[request.params.shortURL].fullURL;
  response.redirect(longURL);
});

app.get("/urls/:id", (request, response) => {
  handleUserNotLoggedIn(request, response);
  handleUrlNotValid(request, response, request.params.id);
  handleUrlNotOwnedByUser(request, response, request.params.id);

  const shortURL = request.params.id;
  const longURL = urlDatabase[request.params.id].fullURL;
  response.render("urls_show", { shortURL: shortURL, longURL: longURL });
});

// generate new tiny url
app.post("/urls", (request, response) => {
  const longURL = request.body.longURL;
  handleBadUrlPrefix(longURL);

  const currentUser = request.session.user.id;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { fullURL: longURL, userID: currentUser };
  response.status(302);
  response.redirect(302, `/urls/${shortURL}`);
});

// delete tiny url
app.post("/urls/:id/delete", (request, response) => {
  const currentKey = request.params.id;
  const currentUser = request.session.user.id;
  // const urlsFiltered = urlsForUser(currentUser);

  handleUnownedUrl(currentUser, urlDatabase[currentKey].userID);
  delete urlDatabase[currentKey];
  response.status(200);
  response.redirect("/urls");
});

// edit tiny url
app.post("/urls/:id", (request, response) => {
  const newLongURL = request.body.longURL;
  const currentKey = request.params.id;
  const currentUser = request.session.user.id;

  handleUnownedUrl(currentUser, urlDatabase[currentKey].userID);
  urlDatabase[currentKey].fullURL = newLongURL;
  response.redirect("/urls");
});

// authenticate login, create cookie
app.post("/login", (request, response) => {
  const user = findUserByEmail(request.body.email);
  handleBadLoginInfo(user, request, response);

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
  handleBadRegister(request, response, userHashedPassword);
  const userEmail = request.body.email;
  handleUsernameTaken(userEmail, response);

  const randID = generateRandomString();
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

