const { ApolloServer } = require("apollo-server-express");
const { typeDefs } = require("./GraphQL/TypeDefs");
const { resolvers } = require("./GraphQL/Resolvers");
const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();

const server = new ApolloServer({ typeDefs, resolvers });

async function startServer() {
  await server.start();

  server.applyMiddleware({ app });

  const uri = process.env.MONGO_DB_CONNECTION;
  class Database {
    constructor() {
      this._connect();
    }
    _connect() {
      mongoose
        .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
          console.log("MongoDB connection successful");
          app.listen({ port: 4000 }, () =>
            console.log(
              `Server ready at http://localhost:4000${server.graphqlPath}`
            )
          );
        })
        .catch((err) => {
          console.error("Database connection error");
        });
    }
  }
  new Database();
}

startServer();
