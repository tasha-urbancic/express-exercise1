// DEFINE GLOBAL VARIABLES FOR LIBRARIES
const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require("bcrypt");

// SET THE APP SETTINGS
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  cookieSession({
    keys: ["keyname1"]
  })
);

//////////////FAKE DATA FOR TESTING////////////////

// URL DATABASE
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

// USERS DATABASE
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

//////////////////FUNCTIONS////////////////////

// TO GENERATE A 6 CHARACTER LONG ID CODE
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

// TO FIND A USER BY THEIR EMAIL
function findUserByEmail(userEmail) {
  for (let user in users) {
    if (users[user].email === userEmail) {
      return users[user];
    }
  }
}

// TO FIND A URL THAT THE USER CREATED
function urlsForUser(ID) {
  let filtered = {};

  for (let tinyUrl in urlDatabase) {
    if (ID === urlDatabase[tinyUrl].userID) {
      filtered[tinyUrl] = urlDatabase[tinyUrl];
    }
  }

  return filtered;
}

///////////////DEFINE LOCALS/////////////////

app.use(function(request, response, next) {
  response.locals = {
    error: undefined,
    user: request.session.user
  };
  next();
});

////////////////GET REQUESTS//////////////////

// ROOT
app.get("/", (request, response) => {
  if (request.session.user) {
    response.redirect("/urls");
  }
  response.redirect("/login");
});

// SEE ALL URLS
app.get("/urls", (request, response) => {
  if (request.session.user) {
    let currentUser = request.session.user.id;
    let urlsFiltered = urlsForUser(currentUser);
    response.render("urls_index", { urls: urlsFiltered });
  } else {
    response.status(401);
    response.redirect(401, "/login");
  }
});

// CREATE NEW TINYURL
app.get("/urls/new", (request, response) => {
  if (request.session.user) {
    response.render("urls_new");
  } else {
    response.status(401);
    response.render("login_page", {
      error: "401: Unauthorized, Please Log In"
    });
  }
});

// REGISTER
app.get("/register", (request, response) => {
  response.render("registration_page");
});

// LOGIN
app.get("/login", (request, response) => {
  response.render("login_page");
});

// TINYURL
app.get("/u/:shortURL", (request, response) => {
  if (urlDatabase[request.params.shortURL] === undefined) {
    response.status(404);
    response.render("error-page", {
      error: "404: Not Found, TinyUrl does not exist"
    });
  } else {
    let longURL = urlDatabase[request.params.shortURL].fullURL;
    response.status(302);
    response.redirect(longURL);
  }
});

// SPECIFIC TINYURL EDIT/DELETE
app.get("/urls/:id", (request, response) => {
  if (!request.session.user) {
    response.status(401);
    response.redirect(401, "/login");
  }

  if (urlDatabase[request.params.id] === undefined) {
    response.status(403);
    response.render("error-page", {
      error: "403: Forbidden, TinyUrl Does Not Exist"
    });
  }

  const currentUser = request.session.user.id;
  const urlsFiltered = urlsForUser(currentUser);
  const access = Object.keys(urlsFiltered).includes(request.params.id);

  if (!access) {
    response.status(401);
    response.render("error-page", {
      error: `401: Unauthorized, You Don't Have Access To This url`
    });
  }

  const shortURL = request.params.id;
  const longURL = urlDatabase[request.params.id].fullURL;
  response.render("urls_show", { shortURL: shortURL, longURL: longURL });
});

/////////////////POST REQUESTS///////////////////

// CREATE A TINYURL
app.post("/urls", (request, response) => {
  const currentUser = request.session.user.id;

  const shortURL = generateRandomString();
  const longURL = request.body.longURL;

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
    response.redirect(406, "/urls/new");
  }

  urlDatabase[shortURL] = { fullURL: longURL, userID: currentUser };
  response.status(302);
  response.redirect(`/urls/${shortURL}`);
});

// DELETE A TINY URL
app.post("/urls/:id/delete", (request, response) => {
  const currKey = request.params.id;
  const currentUser = request.session.user.id;
  const urlsFiltered = urlsForUser(currentUser);

  if (currentUser === urlDatabase[currKey].userID) {
    delete urlDatabase[currKey];
    response.status(200);
    response.redirect("/urls");
  } else {
    response.status(403);
    response.render("error-page", {
      error: "403: Forbidden, Must Be Your TinyUrl To Delete"
    });
  }
});

// UPDATE YOUR TINYURL'S LONG-URL
app.post("/urls/:id", (request, response) => {
  const newLongURL = request.body.longURL;
  const currKey = request.params.id;
  const currentUser = request.session.user.id;
  const urlsFiltered = urlsForUser(currentUser);

  if (currentUser === urlDatabase[currKey].userID) {
    urlDatabase[currKey].fullURL = newLongURL;
    response.redirect("/urls");
  } else {
    response.status(403);
    response.render("error-page", {
      error: "403: Forbidden, Must Be Your TinyUrl To Update"
    });
  }
});

// AUTHENTICATE LOGIN
app.post("/login", (request, response) => {
  const user = findUserByEmail(request.body.email);

  if (!user) {
    response.status(404);
    response.redirect(404, "/register");
  } else if (!bcrypt.compareSync(request.body.password, user.hashedPassword)) {
    response.status(404);
    response.redirect(404, "/login");
  } else {
    request.session.user = user;
    response.redirect("/urls");
  }
});

// LOGOUT, DELETE COOKIES
app.post("/logout", (request, response) => {
  const user = request.body.email;
  request.session = null;
  response.redirect("/login");
});

// CREATE A NEW USER, AND NEW COOKIE
app.post("/register", (request, response) => {
  const userEmail = request.body.email;
  const userHashedPassword = bcrypt.hashSync(request.body.password, 10);

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

  if (findUserByEmail(userEmail)) {
    response.status(403);
    response.render("login_page", {
      error: "403: Forbidden, Username Already Taken"
    });
    return;
  }

  let randID = generateRandomString();
  users[randID] = {
    id: randID,
    email: userEmail,
    hashedPassword: userHashedPassword
  };

  request.session.user = users[randID];
  response.redirect("/urls");
});

//////////////////SERVER/////////////////////

// START THE SERVER
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

///////////////////END///////////////////////
