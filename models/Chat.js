const { model, Schema } = require("mongoose");

const chatSchema = new Schema({
  users: [{ type: Schema.Types.ObjectId, ref: "User", require: true }],
  messages: [
    {
      body: { type: String },
      user: { type: Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: String },
      read: [{ type: Schema.Types.ObjectId, ref: "User" }],
    },
  ],
  writing: [{ type: Schema.Types.ObjectId, ref: "User" }],
});

module.exports = model("Chat", chatSchema);
