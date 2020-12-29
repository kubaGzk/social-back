module.exports.validateRegisterInput = (
  username,
  firstname,
  lastname,
  email,
  password,
  confirmPassword,
  image
) => {
  const errors = {};
  if (username.trim() === "") {
    errors.username = "Username must not be empty";
  }
  if (firstname.trim() === "") {
    errors.firstname = "First name must not be empty";
  }
  if (lastname.trim() === "") {
    errors.lastname = "Last name must not be empty";
  }
  if (email.trim() === "") {
    errors.email = "Email must not be empty";
  } else {
    const regEx = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!email.match(regEx)) {
      errors.email = "Email must be a valid email address";
    }
  }

  if (password === "") {
    errors.password = "Password must not be empty";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords must match";
  }
  if (!image) {
    errors.image = "Image must be provided";
  }

  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};

module.exports.validateLoginInput = (username, password) => {
  const errors = {};
  if (username.trim() === "") {
    errors.username = "Username must not be empty";
  }
  if (password.trim() === "") {
    errors.password = "Password must not be empty";
  }
  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};

module.exports.validateUpdateUserInput = (firstname, lastname, description) => {
  const errors = {};
  if (firstname.trim() === "") {
    errors.firstname = "First name must not be empty";
  }
  if (lastname.trim() === "") {
    errors.lastname = "Last name must not be empty";
  }

  if (description.trim() === "") {
    errors.description = "Description name must not be empty";
  }
  return {
    errors,
    valid: Object.keys(errors).length < 1,
  };
};
