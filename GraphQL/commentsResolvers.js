const Post = require("../Models/Post");
const { AuthenticationError } = require("apollo-server");
const { UserInputError } = require("apollo-server");
require("dotenv").config();
const checkAuth = require("../util/checkAuth");

const commentsResolvers = {
  Mutation: {
    async likePost(_, { postId }, context) {
      const user = checkAuth(context);
      const post = await Post.findById(postId);
      if (post) {
        if (post.likes.find((like) => like.username === user.username)) {
          // Post already liked, unlike post
          post.likes = post.likes.filter(
            (like) => like.username !== user.username
          );
        } else {
          // Not liked, like post
          post.likes.push({
            username: user.username,
            createdAt: new Date(),
          });
        }
        await post.save();
        return post;
      } else {
        throw new UserInputError("Post not found");
      }
    },
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
  },
};

module.exports = { commentsResolvers };
