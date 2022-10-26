const User = require("../model/user.model");
const randomToken = require("random-token").create(
  "abcdefghijklmnopqrstuvwxzyABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
);
const bcrypt = require("bcrypt");
const validator = require("email-validator");

//An enum to hold different states of Token
const Token = {
  VALID: 1,
  TIMEOUT: 2,
  INVALID: 3,
  USER_NOT_FOUND: 4,
};

/**
 * This method validates the input from the user & returns an array of error msg's
 * @param {*} req
 * @returns errorsArray
 */

function validateInputs(req) {
  var nameRegex = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z])$/;
  var tokenRegex = /^[A-Za-z0-9]*$/;
  var errorsArray = [];

  //In case of update user, req.body.newUserDetails will be populated
  if (req.body.newUserDetails) {
    req.body.password = req.body.newUserDetails.password;
    req.body.firstName = req.body.newUserDetails.firstName;
    req.body.lastName = req.body.newUserDetails.lastName;
  }

  let isEmailValid = true;
  if (req.body.emailAddress != undefined && req.body.emailAddress != null) {
    isEmailValid =
      req.body.emailAddress.length > 0 &&
      validator.validate(req.body.emailAddress);
  }

  let firstNameResult = true;
  if (req.body.firstName != undefined && req.body.firstName != null) {
    firstNameResult =
      req.body.firstName.length > 0 &&
      nameRegex.test(req.body.firstName) &&
      req.body.firstName.length < 250;
  }

  let lastNameResult = true;
  if (req.body.lastName != undefined && req.body.lastName != null) {
    lastNameResult =
      req.body.lastName.length > 0 &&
      nameRegex.test(req.body.lastName) &&
      req.body.lastName.length < 250;
  }

  let passwordCheck = true;
  if (req.body.password != undefined && req.body.password != null) {
    passwordCheck =
      req.body.password.length > 0 && req.body.password.length < 250;
  }

  let tokenResult = true;
  if (req.body.token != undefined && req.body.token != null) {
    tokenResult =
      req.body.token.length > 0 &&
      tokenRegex.test(req.body.token) &&
      req.body.token.length < 40;
  }

  if (!isEmailValid) {
    errorsArray.push({
      status: "error",
      message: "Email ID should not be blank & should be in valid format",
    });
  }

  if (!firstNameResult) {
    errorsArray.push({
      status: "error",
      message:
        "First Name should not be blank, have less than 250 characters and can contain only alphabets",
    });
  }

  if (!lastNameResult) {
    errorsArray.push({
      status: "error",
      message:
        "Last Name should not be blank, have less than 250 characters and can contain only alphabets",
    });
  }

  if (!passwordCheck) {
    errorsArray.push({
      status: "error",
      message: "Password should not be blank and have less than 250 characters",
    });
  }

  if (!tokenResult) {
    errorsArray.push({
      status: "error",
      message:
        "Token should not be blank, have less than 40 characters and should be alpha numeric",
    });
  }

  return errorsArray;
}

/**
 * This method takes emailAddress, password, firstName & lastName from request- Creates the user account in the Database
 * @param {*} req
 * @param {*} res
 * @returns success - User registered successfully (OR) error- Something went wrong!!
 */
exports.registerUser = async function (req, res) {
  try {
    var errorsArray = validateInputs(req);
    if (errorsArray.length > 0) {
      res.status(400);
      res.send(errorsArray);
      return;
    }
    //Password is hashed with salting
    const hash = bcrypt.hashSync(req.body.password, 10);
    await User.create({
      EMAIL_ADDRESS: req.body.emailAddress,
      PASSWORD: hash,
      FIRST_NAME: req.body.firstName,
      LAST_NAME: req.body.lastName,
    });
  } catch (error) {
    console.error(error);
    res.status(500);
    res.send({
      status: "error",
      message: "Something went wrong!!",
    });
  }
  res.status(200);
  res.send({
    status: "success",
    message: "User registered successfully!",
  });
};

/**
 * This method takes emailAddress, password from request- Validates with DB credentials
 * @param {*} req
 * @param {*} res
 * @returns Logged-in successfully (Token returned)/ Unable to find the user with the given email-address/
 * Unable to login with the given credentials!!
 *
 */
exports.signIn = async function (req, res) {
  try {
    var errorsArray = validateInputs(req);
    if (errorsArray.length > 0) {
      res.status(400);
      res.send(errorsArray);
      return;
    }
    const user = await User.findOne({
      where: { EMAIL_ADDRESS: req.body.emailAddress },
    });
    if (user === null) {
      res.status(404);
      res.send({
        status: "error",
        message: "Unable to find the user with the given email-address!!",
      });
    } else {
      //Password is hashed and compared with the DB password
      if (bcrypt.compareSync(req.body.password, user.PASSWORD)) {
        //Once logged in, 32 character Random Token valid for 30 minutes is stored along with Token create time
        let token = randomToken(32);
        await User.update(
          {
            AUTH_TOKEN: token,
            TOKEN_CREATE_TIME: Date.now(),
          },
          {
            where: {
              EMAIL_ADDRESS: req.body.emailAddress,
            },
          }
        );
        res.status(200);
        res.send({
          status: "success",
          data: token,
          message: "Logged in successfully",
        });
      } else {
        res.status(400);
        res.send({
          status: "error",
          message: "Unable to login with the given credentials!!",
        });
      }
    }
  } catch (error) {
    console.error(error);
    res.status(500);
    res.send({
      status: "error",
      message: "Something went wrong!!",
    });
  }
};

/**
 * This method takes token from signIn, emailAddress from request- Retrieves the user details
 * @param {*} req
 * @param {*} res
 * @returns User details fetched successfully!!/
 *
 */
exports.fetchUser = async function (req, res) {
  try {
    var errorsArray = validateInputs(req);
    if (errorsArray.length > 0) {
      res.status(400);
      res.send(errorsArray);
      return;
    }
    const authenticated = await authenticate(
      req.body.token,
      req.body.emailAddress
    );
    if (authenticated === Token.VALID) {
      const user = await User.findOne({
        where: { EMAIL_ADDRESS: req.body.emailAddress },
      });
      if (user && user instanceof User) {
        console.log("User details fetched ", user.get());
        res.status(200);
        res.send({
          status: "success",
          data: user.get(),
          message: "User details fetched successfully!!",
        });
      }
    } else {
      readResponse(authenticated, res);
    }
  } catch (error) {
    console.error(error);
    res.status(500);
    res.send({
      status: "error",
      message: "Something went wrong!!",
    });
  }
};

/**
 * Inner method to check if the token is valid & token create time is generated within 30 minutes
 * @param {*} token
 * @param {*} email
 * @returns Token enum to differentiate appropriate error msg's
 */
const authenticate = async (token, email) => {
  const user = await User.findOne({ where: { EMAIL_ADDRESS: email } });
  if (user && user instanceof User) {
    if (user.AUTH_TOKEN === token && user.TOKEN_CREATE_TIME) {
      if (Date.now() - user.TOKEN_CREATE_TIME < 30 * 60 * 1000) {
        return Token.VALID;
      } else {
        return Token.TIMEOUT;
      }
    } else {
      return Token.INVALID;
    }
  } else {
    return Token.USER_NOT_FOUND;
  }
};

/**
 * This method takes token, emailAddress, newUserDetails object containing the new details as input
 * @param {*} req
 * @param {*} res
 * @returns User details updated successfully!!/ Error response
 */
exports.updateUser = async function (req, res) {
  try {
    var errorsArray = validateInputs(req);
    if (errorsArray.length > 0) {
      res.status(400);
      res.send(errorsArray);
      return;
    }
    const authenticated = await authenticate(
      req.body.token,
      req.body.emailAddress
    );
    if (authenticated === Token.VALID) {
      let details = {};
      if (req.body.newUserDetails.password) {
        //Password hashed with salt and updated to DB
        const hash = bcrypt.hashSync(req.body.newUserDetails.password, 10);
        details["PASSWORD"] = hash;
      }
      req.body.newUserDetails.firstName
        ? (details["FIRST_NAME"] = req.body.newUserDetails.firstName)
        : null;
      req.body.newUserDetails.lastName
        ? (details["LAST_NAME"] = req.body.newUserDetails.lastName)
        : null;
      const updatedUser = await User.update(details, {
        where: {
          EMAIL_ADDRESS: req.body.emailAddress,
        },
      });
      console.log("updatedUser", updatedUser);
      res.status(200);
      res.send({
        status: "success",
        message: "User details updated successfully!!",
      });
    } else {
      readResponse(authenticated, res);
    }
  } catch (error) {
    console.error(error);
    res.status(500);
    res.send({
      status: "error",
      message: "Something went wrong!!",
    });
  }
};

/**
 * Send appropriate error messages for Invalid Token or Token Timeout / Email-Address
 * @param {*} authenticated
 * @param {*} res
 */
function readResponse(authenticated, res) {
  switch (authenticated) {
    case Token.INVALID:
    case Token.TIMEOUT:
      res.status(500);
      res.send({
        status: "error",
        message: "Please login again!!",
      });
    case Token.USER_NOT_FOUND:
      res.status(500);
      res.send({
        status: "error",
        message: "Unable to find the user with the given email-address!!",
      });
  }
}
