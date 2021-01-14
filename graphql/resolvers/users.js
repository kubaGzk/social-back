const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError, ApolloError } = require("apollo-server");

const {
  validateRegisterInput,
  validateLoginInput,
  validateUpdateUserInput,
} = require("../../util/validators");
const { SECRET_KEY } = require("../../config");
const User = require("../../models/User");
const checkAuth = require("../../util/check-auth");
const uploadFile = require("../../util/upload-file");
const aws = require("aws-sdk");
const {
  AWS_ACC_KEY,
  AWS_SEC_KEY,
  AWS_S3_BUCKET,
  AWS_REGION,
} = require("../../config");

aws.config.update({
  accessKeyId: AWS_ACC_KEY,
  secretAccessKey: AWS_SEC_KEY,
  region: AWS_REGION,
});

const generateToken = (user) =>
  jwt.sign(
    {
      id: user.id,
    },
    SECRET_KEY,
    { expiresIn: "1h" }
  );

module.exports = {
  Query: {
    async getUserInfo(_, { userId }) {
      const user = await User.findById(
        userId,
        "email lastname firstname description createdAt image friends invitesReceived invitesSend posts"
      ).exec();

      if (!user) {
        throw new Error("User not found");
      }

      return user;
    },
    async getUserList(_, { text }) {
      let userList;

      const textArr = text.split(" ").reduce((arr, el) => {
        el.length > 0 && arr.push(new RegExp(el, "gi"));
        return arr;
      }, []);

      try {
        userList = await User.find({
          $or: [
            {
              firstname: { $in: textArr },
              lastname: { $in: textArr },
            },
            {
              lastname: { $in: textArr[0] },
            },
            {
              firstname: { $in: textArr[0] },
            },
          ],
        }).exec();
      } catch (err) {
        throw new Error(err);
      }

      return userList;
    },
  },
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
    async updateUser(
      parent,
      { firstname, lastname, description, image },
      context
    ) {
      const { id } = checkAuth(context);

      const { valid, errors } = validateUpdateUserInput(
        firstname,
        lastname,
        description
      );

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }

      let updatedUser;

      try {
        updatedUser = await User.findById(id);

        updatedUser.firstname = firstname;
        updatedUser.lastname = lastname;
        updatedUser.description = description;

        if (image) {
          const imageKey = await uploadFile(image);
          const oldImage = updatedUser.image;
          updatedUser.image = imageKey;

          const s3 = new aws.S3();

          const s3response = await s3
            .deleteObject({ Bucket: AWS_S3_BUCKET, Key: oldImage })
            .promise();
          console.log(`Image deleted ${oldImage}`, s3response);
        }

        await updatedUser.save();
      } catch (err) {
        throw new Error(err);
      }

      return updatedUser;
    },
  },
};
