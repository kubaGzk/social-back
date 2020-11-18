const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError, ApolloError } = require("apollo-server");

const {
  validateRegisterInput,
  validateLoginInput,
} = require("../../util/validators");
const { SECRET_KEY } = require("../../config");
const User = require("../../models/User");
const checkAuth = require("../../util/check-auth");
const uploadFile = require("../../util/upload-file");

const generateToken = (user) =>
  jwt.sign(
    {
      id: user.id,
    },
    SECRET_KEY,
    { expiresIn: "1h" }
  );

module.exports = {
  Mutation: {
    async login(_, { username, password }) {
      const { errors, valid } = validateLoginInput(username, password);

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const user = await User.findOne({ username }).exec();

      if (!user) {
        errors.general = "User not found";
        throw new UserInputError("User not found", { errors });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        errors.general = "Wrong credentials";
        throw new UserInputError("Wrong credentials", { errors });
      }

      const token = generateToken(user);

      return {
        ...user._doc,
        id: user._id,
        token,
      };
    },
    async register(
      parent,
      {
        registerInput: {
          username,
          firstname,
          lastname,
          email,
          password,
          confirmPassword,
          image,
        },
      }
    ) {
      const { valid, errors } = validateRegisterInput(
        username,
        firstname,
        lastname,
        email,
        password,
        confirmPassword,
        image
      );

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      const user = await User.findOne({ username }).exec();

      if (user) {
        throw new UserInputError("Username is taken", {
          errors: {
            username: "This username is taken",
          },
        });
      }

      password = await bcrypt.hash(password, 12);

      let imageKey;
      try {
        imageKey = await uploadFile(image);
      } catch (err) {
        console.log(err);
        throw new ApolloError(err);
      }

      console.log(imageKey);

      const newUser = new User({
        email,
        username,
        firstname,
        lastname,
        password,
        createdAt: new Date().toISOString(),
        image: imageKey,
      });

      try {
        await newUser.save();
      } catch (err) {
        throw new Error(err);
      }
      const token = generateToken(newUser);

      return {
        email: newUser.email,
        firstname: newUser.firstname,
        lastname: newUser.lastname,
        username: newUser.username,
        createdAt: newUser.createdAt,
        image: newUser.image,
        id: newUser.id,
        token,
      };
    },
    async validateToken(parent, body, context) {
      const user = checkAuth(context);

      const returnedUser = await User.findById(user.id).exec();

      return returnedUser;
    },
  },
};
