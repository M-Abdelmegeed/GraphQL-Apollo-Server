const User = require("../Models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const { generateToken } = require("../util/generateToken");
const {
  validateRegisterInput,
  validateLoginInput,
} = require("../util/validators");

const userResolvers = {
  Mutation: {
    async login(_, { username, password }) {
      const { errors, valid } = validateLoginInput(username, password);
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }
      const user = await User.findOne({ username: username });
      if (!user) {
        errors.general = "User not found";
        throw new UserInputError("User not found!", { errors });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
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
      _,
      { registerInput: { username, email, password, confirmPassword } },
      context,
      info
    ) {
      // Validate user data (server validation)
      const { valid, errors } = validateRegisterInput(
        username,
        email,
        password,
        confirmPassword
      );
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }
      // Make sure user doesnt already exist
      const users = await User.find({ username: username }).exec();
      if (users.length > 0) {
        throw new UserInputError("Username is taken", {
          errors: {
            username: "This username is taken",
          },
        });
      }
      password = await bcrypt.hash(password, Number(process.env.SALT_ROUNDS));
      const newUser = new User({
        email,
        username,
        password,
        createdAt: new Date(),
      });
      const res = await newUser.save();
      // Creating token
      const token = jwt.sign(
        {
          id: res.id,
          email: res.email,
          username: res.username,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: "1h",
        }
      );
      return {
        ...res._doc,
        id: res._id,
        token,
      };
    },
  },
};

module.exports = { userResolvers };
