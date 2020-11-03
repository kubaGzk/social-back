const { model, Schema } = require("mongoose");

const userSchema = new Schema({
  username: { type: String, required: true },
  firstname: { type: String, required: true },
  lastname: { type: String, required: true },
  password: { type: String, required: true },
  email: { type: String, required: true },
  createdAt: { type: String, required: true },
  image: { type: String, required: true },
});

module.exports = model("User", userSchema);
