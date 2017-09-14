const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");

// parse the form data
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser());

///////////////////////////////////////////

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  b7c9W3: {
    id: "b7c9W3",
    email: "sara.daniels@gmail.com",
    password: "purple-monkey-dinosaur"
  },
  S4f1p8: {
    id: "S4f1p8",
    email: "johndgregory@gmail.com",
    password: "dishwasher-funk"
  }
};

///////////////////////////////////////////

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

function findUserByEmail(userEmail) {
  for (let user in users) {
    if (users[user].email === userEmail) {
      return users[user];
    }
  }
}

function findUserByID(userID) {
  for (let user in users) {
    if (users[user].id === userID) {
      return users[user];
    }
  }
}

///////////////////////////////////////////

app.use(function(request, response, next) {
  response.locals = {
    urls: urlDatabase,
    shortURL: request.params.id,
    longURL: urlDatabase[request.params.id],
    user: findUserByID(request.cookies["user_id"])
  };
  next();
});

///////////////////////////////////////////

app.get("/", (request, response) => {
  response.end("Main Page");
});

app.get("/urls", (request, response) => {
  if (request.cookies["user_id"]) {
    response.render("urls_index");
  } else {
    response.redirect("/register");
  }
});

app.get("/urls/new", (request, response) => {
  if (request.cookies["user_id"]) {
    response.render("urls_new");
  } else {
    response.redirect("/register");
  }
});

app.get("/register", (request, response) => {
  response.render("registration_page");
});

app.get("/u/:shortURL", (request, response) => {
  if (urlDatabase[request.params.shortURL] === undefined) {
    response.redirect(404, "/urls/new");
  } else {
    let longURL = urlDatabase[request.params.shortURL];
    response.status(302);
    response.redirect(longURL);
  }
});

// requesting/asking the server
app.get("/urls/:id", (request, response) => {
  console.log(request.params.id);
  console.log(urlDatabase);
  console.log(urlDatabase[request.params.id]);
  if (urlDatabase[request.params.id] === undefined) {
    response.status(404);
    response.send("404: Not Found");
  } else {
    if (request.cookies["user_id"]) {
      response.render("urls_show");
    } else {
      response.redirect("/register");
    }
  }
});

///////////////////////////////////////////

// posting to the server data (url in this case)
app.post("/urls", (request, response) => {
  let shortURL = generateRandomString();
  let longURL = request.body.longURL;

  urlDatabase[shortURL] = longURL;
  response.status(302);
  response.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (request, response) => {
  let currKey = request.params.id;
  delete urlDatabase[currKey];
  response.redirect("/urls");
});

app.post("/urls/:id", (request, response) => {
  let newLongURL = request.body.longURL;

  let currKey = request.params.id;

  // assign new website to value
  urlDatabase[currKey] = newLongURL;

  response.redirect("/urls");
});

app.post("/login", (request, response) => {
  let user = request.body.email;
  response.cookie("email", user);
  response.redirect("/urls");
});

app.post("/logout", (request, response) => {
  let user = request.body.email;
  response.clearCookie("email", user);
  response.redirect("/urls");
});

// pluck _js, library of functions that implement these things
//  low dash ripoff

app.post("/register", (request, response) => {
  let userEmail = request.body.email;
  let userPassword = request.body.password;

  // console.log(users);

  if (!userEmail) {
    response.status(400);
    response.send("400: Bad Request");
    return;
  }

  if (!userPassword) {
    response.status(400);
    response.send("400: Bad Request");
    return;
  }

  if (findUserByEmail(userEmail)) {
    response.status(400);
    response.send("400: Bad Request");
    return;
  }

  let randID = generateRandomString();
  users[randID] = {
    id: randID,
    email: userEmail,
    password: userPassword
  };
  response.cookie("user_id", users[randID].id);
  response.redirect("/urls");
});

///////////////////////////////////////////

//start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
