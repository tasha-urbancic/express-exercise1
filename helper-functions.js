const bcrypt = require("bcrypt");

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
function findUserByEmail(userEmail, users) {
  for (let user in users) {
    if (users[user].email === userEmail) {
      return users[user];
    }
  }
}

// find urls corresponding to user id
function urlsForUser(ID, urlDatabase) {
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
    return response.redirect(401, "/login");
  }
}

function handleBadUrlPrefix(longURL, response) {
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
    return response.redirect(406, "/urls/new");
  }
}

function handleUnownedUrl(currentUser, urlOwner, response) {
  if (currentUser !== urlOwner) {
    response.status(403);
    return response.render("error-page", {
      error: "403: Forbidden, Must Be Your TinyUrl To Modify"
    });
  }
}

function handleBadLoginInfo(user, request, response) {
  if (!user) {
    response.status(404);
    return response.redirect(404, "/register");
  } else if (!bcrypt.compareSync(request.body.password, user.hashedPassword)) {
    response.status(404);
    return response.redirect(404, "/login");
  }
}

function handleBadRegister(request, response, userHashedPassword) {
  const userEmail = request.body.email;

  if (!userEmail) {
    response.status(400);
    return response.render("registration_page", {
      error: "400: Bad Request, Please Enter A Username"
    });
  }

  if (!userHashedPassword) {
    response.status(400);
    return response.render("login_page", {
      error: "400: Bad Request, Please Enter a Password"
    });
  }
}

function handleUsernameTaken(userEmail, response) {
  if (findUserByEmail(userEmail)) {
    response.status(403);
    return response.redirect(403, "/login");
  }
}


function handleUrlNotOwnedByUser(request, response, urlDatabase) {
  const ID = request.params.id;
  const currentUser = request.session.user.id;
  const urlsFiltered = urlsForUser(currentUser, urlDatabase);
  const access = Object.keys(urlsFiltered).includes(ID);

  if (!access) {
    response.status(401);
    return response.render("error-page", {
      error: `401: Unauthorized, You Don't Have Access To This url`
    });
  }
}

function handleUrlNotValid(response, id, urlDatabase) {
  if (urlDatabase[id] === undefined) {
    response.status(403);
    return response.render("error-page", {
      error: "403: Forbidden, TinyUrl Does Not Exist"
    });
  }
}

module.exports = {handleUrlNotValid: handleUrlNotValid, handleUrlNotOwnedByUser: handleUrlNotOwnedByUser, handleUsernameTaken: handleUsernameTaken, handleBadRegister: handleBadRegister, handleBadLoginInfo: handleBadLoginInfo, handleUnownedUrl: handleUnownedUrl, handleBadUrlPrefix: handleBadUrlPrefix, handleUserNotLoggedIn: handleUserNotLoggedIn, urlsForUser: urlsForUser, findUserByEmail: findUserByEmail, generateRandomString: generateRandomString};