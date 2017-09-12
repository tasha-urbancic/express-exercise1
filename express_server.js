//Express server JS code

const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");

function generateRandomString(aString) {
  let randomString = '';
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < 6; i++) {
      randomString += possible.charAt(Math.floor(Math.random() * possible.length));
    };

  // let randomString = Math.floor((1 + Math.random()) * 0x10000000).toString(36);
  return randomString;
}

const urlDatabase = {
  b2xVn2: "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

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

// requesting/asking the server
app.get("/urls/:id", (request, response) => {
  let templateVars = {
    shortUrl: request.params.id,
    longUrl: urlDatabase[request.params.id]
  };
  response.render("urls_show", templateVars);
});

// posting to the server data (url in this case)
app.post("/urls", (req, res) => {
  urlDatabase[generateRandomString()] = req.body.longURL;
  console.log(urlDatabase);
  res.send("Ok");
});

// req.body.longURL
// which we will store in a variable called urlDatabase

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
