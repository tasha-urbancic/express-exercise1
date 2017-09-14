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
  b2xVn2: { 
    fullURL: "http://www.lighthouselabs.ca",
    userID: "b7c9W3"
  }
  "9sm5xK": {
    fullURL: "http://www.google.com",
    userID: "S4f1p8"
  }
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

// function findUserByID(userID) {
//   for (let user in users) {
//     if (users[user].id === userID) {
//       return users[user];
//     }
//   }
// }

///////////////////////////////////////////

app.use(function(request, response, next) {
  response.locals = {
    urls: urlDatabase,
    user: users[request.cookies["user_id"]]
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
    response.redirect("/login");
  }
});

app.get("/urls/new", (request, response) => {
  if (request.cookies["user_id"]) {
    response.render("urls_new");
  } else {
    response.redirect("/login");
  }
});

app.get("/register", (request, response) => {
  response.render("registration_page");
});

app.get("/login", (request, response) => {
  response.render("login_page");
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
  if (urlDatabase[request.params.id] === undefined) {
    response.status(404);
    response.send("404: Not Found");
  } else {
    if (request.cookies["user_id"]) {
      response.locals.shortURL = request.params.id;
      response.locals.longURL = urlDatabase[request.params.id].fullURL;
      response.render("urls_show");
    } else {
      response.redirect("/login");
    }
  }
});

///////////////////////////////////////////

// posting to the server data (url in this case)
app.post("/urls", (request, response) => {
  let shortURL = generateRandomString();
  let longURL = request.body.longURL;
  let currUser = users[request.cookies["user_id"]].id;

  urlDatabase[shortURL].fullURL = longURL;
  urlDatabase[shortURL].userID = currUser;

  response.status(302);
  response.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (request, response) => {

  let currKey = request.params.id;
  let currUser = users[request.cookies["user_id"]].id;

  if (currUser === urlDatabase[currKey].userID) {
    delete urlDatabase[currKey];
    response.redirect("/urls");
  } else {
    // not sure if these status codes are right
    response.status(403);
    response.send('403: Forbidden')
  }
});

app.post("/urls/:id", (request, response) => {

  let newLongURL = request.body.longURL;
  let currKey = request.params.id;
  let currUser = users[request.cookies["user_id"]].id;

  if (currUser === urlDatabase[currKey].userID) {
    // assign new website to value
    urlDatabase[currKey].fullURL = newLongURL;
    response.redirect("/urls");
  } else {
    // not sure if these status codes are right
    response.status(403);
    response.send('403: Forbidden')
  }

});

app.post("/login", (request, response) => {
  let user = findUserByEmail(request.body.email);

  if (!user) {
    response.status(403);
    response.send('403: Forbidden');
    // response.redirect('/register');
  }

  if (request.body.password === user.password) {
    console.log('password was right, creating cookie!');
    response.cookie("user_id", user.id);
    response.redirect("/");
  } else {
    response.status(403);
    response.send('403: Forbidden');
    // response.redirect("login");
  }
  
});

app.post("/logout", (request, response) => {
  let user = request.body.email;
  response.clearCookie("user_id", user);
  response.redirect("/urls");
});

// pluck _js, library of functions that implement these things
//  low dash ripoff

app.post("/register", (request, response) => {
  let userEmail = request.body.email;
  let userPassword = request.body.password;

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
