const mongoose = require("mongoose");

// Required fields will be handled in the GraphQL layer,
// not the mongoose
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  createdAt: String,
});

module.exports = mongoose.model("User", userSchema);
