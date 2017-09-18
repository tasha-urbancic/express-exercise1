const bcrypt = require("bcrypt");

/**
* Generates random string for TinyUrl & user ID
*
* It returns a random  6 charcter string
* @param {randomString} string
*/
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

/**
* Find user by email. Takes inputs:
*
* @param {userEmail} string
* @param {users} object
*
* It returns the user associated with that email.
* @param {user} object
*/
function findUserByEmail(userEmail, users) {
  for (let user in users) {
    if (users[user].email === userEmail) {
      return users[user];
    }
  }
}

/**
* Finds urls corresponding to user id. Takes inputs:
*
* @param {ID} string
* @param {urlDatabase} object
*
* It returns a version of urlDatabase that only shows
* current users urls.
* @param {filteredUrlDatabase} object
*/
function urlsForUser(ID, urlDatabase) {
  let filtered = {};

  for (let tinyUrl in urlDatabase) {
    if (ID === urlDatabase[tinyUrl].userID) {
      filtered[tinyUrl] = urlDatabase[tinyUrl];
    }
  }

  return filtered;
}

/**
* Handles user not being logged in. Takes inputs:
*
* @param {request} object
* @param {response} object
*
* It returns a function, redirect, which redirects
* to the login page.
* @param {response.redirect()} function
*/
function handleUserNotLoggedIn(request, response) {
  if (!request.session.user) {
    response.status(401);
    return response.redirect(401, "/login");
  }
}

/**
* Handles user providing a bad url. Takes inputs:
*
* @param {longUrl} string
* @param {response} object
*
* It returns a function, redirect, which redirects
* to the urls/new page.
* @param {response.redirect()} function
*/
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

/**
* Handles user trying to access an unowned url.
* Takes inputs:
*
* @param {currentUser} string
* @param {urlOwner} string
* @param {response} object
*
* It returns a function, render, which renders
* the error page.
* @param {response.render()} function
*/
function handleUnownedUrl(currentUser, urlOwner, response) {
  if (currentUser !== urlOwner) {
    response.status(403);
    return response.render("error-page", {
      error: "403: Forbidden, Must Be Your TinyUrl To Modify"
    });
  }
}

/**
* Handles user entering bad login info.
* Takes inputs:
*
* @param {user} object
* @param {request} object
* @param {response} object
*
* It returns a function, redirect, which redirects
* to the login or register page.
* @param {response.redirect()} function
*/
function handleBadLoginInfo(user, request, response) {
  if (!user) {
    response.status(404);
    return response.redirect(404, "/register");
  } else if (!bcrypt.compareSync(request.body.password, user.hashedPassword)) {
    response.status(404);
    return response.redirect(404, "/login");
  }
}

/**
* Handles user entering bad registration info.
* Takes inputs:
*
* @param {request} object
* @param {response} object
* @param {userHashedPassword} string
*
* It returns a function, render, which renders
* the registration or login page with an error
* in the header.
* @param {response.render()} function
*/
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

/**
* Handles user entering a username already
* defined.
* Takes inputs:
*
* @param {userEmail} string
* @param {response} object
*
* It returns a function, redirect, which redirects
* to the login page.
* @param {response.redirect()} function
*/
function handleUsernameTaken(userEmail, response) {
  if (findUserByEmail(userEmail)) {
    response.status(403);
    return response.redirect(403, "/login");
  }
}

/**
* Handles user entering a url that is not 
* owned by the user.
* Takes inputs:
*
* @param {request} object
* @param {response} object
* @param {urlDatabase} object
*
* It returns a function, render, which renders
* the error-page.
* @param {response.render()} function
*/
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

/**
* Handles user entering a url that is not 
* valid.
* Takes inputs:
*
* @param {response} object
* @param {id} string
* @param {urlDatabase} object
*
* It returns a function, render, which renders
* the error-page.
* @param {response.render()} function
*/
function handleUrlNotValid(response, id, urlDatabase) {
  if (urlDatabase[id] === undefined) {
    response.status(403);
    return response.render("error-page", {
      error: "403: Forbidden, TinyUrl Does Not Exist"
    });
  }
}

module.exports = {handleUrlNotValid: handleUrlNotValid, handleUrlNotOwnedByUser: handleUrlNotOwnedByUser, handleUsernameTaken: handleUsernameTaken, handleBadRegister: handleBadRegister, handleBadLoginInfo: handleBadLoginInfo, handleUnownedUrl: handleUnownedUrl, handleBadUrlPrefix: handleBadUrlPrefix, handleUserNotLoggedIn: handleUserNotLoggedIn, urlsForUser: urlsForUser, findUserByEmail: findUserByEmail, generateRandomString: generateRandomString};