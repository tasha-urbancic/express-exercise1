const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const bcrypt = require('bcrypt');

// parse the form data
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(cookieParser());

///////////////////////////////////////////

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

function urlsForUser(ID) {
  let filtered = {};
  for (let tinyUrl in urlDatabase) {
    // if the persons id matches the tiny url creator
    if (ID === urlDatabase[tinyUrl].userID) {
      // assign tinyUrl object to filtered url database
      filtered[tinyUrl] = urlDatabase[tinyUrl];
    }
  }
  return filtered;
}

///////////////////////////////////////////

app.use(function(request, response, next) {
  response.locals = {
    // urls: urlDatabase,
    error: undefined,
    user: users[request.cookies["user_id"]]
  };
  next();
});

///////////////////////////////////////////

app.get("/", (request, response) => {
  // response.render('main_page',{user: users[request.cookies["user_id"]]});
  response.end('Hello');
});

app.get("/urls", (request, response) => {

  if (request.cookies["user_id"]) {
    let currUser = request.cookies["user_id"];
    let urlsFiltered = urlsForUser(currUser);
    response.render("urls_index", { urls: urlsFiltered });
  } else {
    response.status(401);
    // response.render("login_page", {
    //   error: "401: Unauthorized, Please Log In"
    // });
    response.redirect(401, "/login");
  }
});

app.get("/urls/new", (request, response) => {
  if (request.cookies["user_id"]) {
    response.render("urls_new");
  } else {
    response.status(401);
    response.render("login_page", {
      error: "401: Unauthorized, Please Log In"
    });
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

// requesting/asking the server
app.get("/urls/:id", (request, response) => {
  if (!request.cookies["user_id"]) {
    response.status(401);
    response.render("login_page", {
      error: "401: Unauthorized, Must Log In First"
    });
    
  }

  let currUser = request.cookies["user_id"];
  let urlsFiltered = urlsForUser(currUser);
  let access = Object.keys(urlsFiltered).includes(request.params.id);

  if (!access) {
    response.status(401);
    response.render("error-page", {error: `401: Unauthorized, You Don't Have Access To This url`});
  }

  if (urlDatabase[request.params.id] === undefined) {
    response.status(403);
    response.render("error-page", {
      error: "403: Forbidden, TinyUrl Does Not Exist"});
  }

  let shortURL = request.params.id;
  let longURL = urlDatabase[request.params.id].fullURL;
  response.render("urls_show", { shortURL: shortURL, longURL: longURL });
});

///////////////////////////////////////////

// posting to the server data (url in this case)
app.post("/urls", (request, response) => {
  let shortURL = generateRandomString();
  let longURL = request.body.longURL;
  let currUser = request.cookies["user_id"];

  urlDatabase[shortURL] = {fullURL: longURL, userID: currUser};

  response.status(302);
  response.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (request, response) => {
  let currKey = request.params.id;
  let currUser = request.cookies["user_id"];
  let urlsFiltered = urlsForUser(currUser);

  if (currUser === urlDatabase[currKey].userID) {
    delete urlDatabase[currKey];
    response.status(200);
    response.redirect("/urls");
  } else {
    response.status(403);
    response.render("error-page", {
      error: "403: Forbidden, Must Be Your TinyUrl To Delete"});
  }
});

app.post("/urls/:id", (request, response) => {
  let newLongURL = request.body.longURL;
  let currKey = request.params.id;
  let currUser = request.cookies["user_id"];
  let urlsFiltered = urlsForUser(currUser);

  if (currUser === urlDatabase[currKey].userID) {
    // assign new website to value
    urlDatabase[currKey].fullURL = newLongURL;
    response.redirect("/urls");
  } else {
    response.status(403);
    response.render("error-page", {
      error: "403: Forbidden, Must Be Your TinyUrl To Update"});
  }
});

app.post("/login", (request, response) => {

  let user = findUserByEmail(request.body.email);

  if (!user) {
    response.status(404);
    response.redirect(404, "/login");
  } else if (!bcrypt.compareSync(request.body.password, user.hashedPassword)) {
    response.status(404);
    response.redirect(404, "/login");
  } else {
    console.log("password was right, creating cookie!");
    response.cookie("user_id", user);
    response.redirect("/");
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
  let userHashedPassword = bcrypt.hashSync(request.body.password, 10);

  // console.log(`userHashedPassword ${userHashedPassword}`);

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

  // console.log(users);

  let randID = generateRandomString();
  users[randID] = {
    id: randID,
    email: userEmail,
    hashedPassword: userHashedPassword
  };

  response.cookie("user_id", users[randID].id);
  response.redirect("/urls");
});

///////////////////////////////////////////

//start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
