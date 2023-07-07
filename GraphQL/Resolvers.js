const Post = require("../Models/Post");
const User = require("../Models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { AuthenticationError } = require("apollo-server");
const { UserInputError } = require("apollo-server");
require("dotenv").config();
const checkAuth = require("../util/checkAuth");

const {
  validateRegisterInput,
  validateLoginInput,
} = require("../util/validators");

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: "1h",
    }
  );
}

const resolvers = {
  Query: {
    async getPosts() {
      try {
        const posts = await Post.find().sort({ createdAt: -1 });
        return posts;
      } catch (err) {
        throw new Error(err);
      }
    },
    async getPost(_, { postId }) {
      try {
        const post = await Post.findById(postId);
        if (post) {
          return post;
        } else {
          throw new Error("Post not found");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Mutation: {
    async createComment(_, { postId, body }, context) {
      const user = checkAuth(context);
      //Empty
      if (body.trim() === "") {
        throw new UserInputError("Empty comment", {
          body: "Comment body must not be empty",
        });
      }
      const post = await Post.findById(postId);
      if (post) {
        // Unshift appends to the array at the top (beginning)
        post.comments.unshift({
          body: body,
          username: user.username,
          createdAt: new Date(),
        });
        await post.save();
        return post;
      } else throw new Error("Sorry, post not found");
    },
    async deleteComment(_, { postId, commentId }, context) {
      const { username } = checkAuth(context);
      const post = await Post.findById(postId);
      if (post) {
        const commentIndex = post.comments.findIndex((c) => c.id === commentId);
        if (post.comments[commentIndex].username === username) {
          post.comments.splice(commentIndex, 1);
          await post.save();
          return post;
        } else {
          throw new AuthenticationError("Action not allowed");
        }
      } else {
        throw new UserInputError("Post not found!");
      }
    },
    async createPost(_, { body }, context) {
      const user = checkAuth(context);
      console.log(user);
      const newPost = new Post({
        body,
        user: user.id,
        username: user.username,
        createdAt: new Date(),
      });
      const post = await newPost.save();
      return post;
    },
    async deletePost(_, { postId }, context) {
      const user = checkAuth(context);
      try {
        const post = await Post.findById(postId);
        if (user.username === post.username) {
          await Post.deleteOne({ _id: postId });
          return "Post deleted successfully";
        } else {
          throw new AuthenticationError("Action not allowed");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
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

module.exports = { resolvers };
