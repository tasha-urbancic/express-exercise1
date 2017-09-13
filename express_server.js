const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");

// parse the form data
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString(aString) {
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

app.get("/", (request, response) => {
  response.end("Main Page");
});

app.get("/urls", (request, response) => {
  let templateVars = { urls: urlDatabase };
  response.render("urls_index", templateVars);
});

app.get("/urls/new", (request, response) => {
  response.render("urls_new");
});

app.get("/u/:shortURL", (request, response) => {
  if (urlDatabase[request.params.shortURL] === undefined){
    response.redirect(404, "/urls/new");
  } else {
    let longURL = urlDatabase[request.params.shortURL];
    response.statusCode(302);
    response.redirect(longURL);
  }
});

// requesting/asking the server
app.get("/urls/:id", (request, response) => {
  if (urlDatabase[request.params.id] === undefined){
    response.redirect(404, "/urls/new");
  } else {
    let templateVars = {
      shortURL: request.params.id,
      longURL: urlDatabase[request.params.id]
    };
    response.render("urls_show", templateVars);
  }
});

// posting to the server data (url in this case)
app.post("/urls", (request, response) => {
  let shortURL = generateRandomString();
  let longURL = request.body.longURL;

  //if doesnt start with http:// add it
  if (longURL.substring(0, 6) !== "http://") {
    longURL = "http://" + longURL;
  }

  urlDatabase[shortURL] = longURL;
  response.statusCode(302);
  response.redirect(`/urls/${shortURL}`);
});

app.post('/urls/:id/delete', (request, response) => {
  let currKey = request.params.id;
  delete urlDatabase[currKey];
  response.redirect('/urls');
});

//start the server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
