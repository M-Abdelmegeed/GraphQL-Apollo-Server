const { userResolvers } = require("./userResolvers");
const { commentsResolvers } = require("./commentsResolvers");
const { postsResolvers } = require("./postsResolvers");

module.exports = {
  Query: {
    ...postsResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...postsResolvers.Mutation,
    ...commentsResolvers.Mutation,
  },
};
