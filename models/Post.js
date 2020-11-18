const { model, Schema } = require("mongoose");
const moongose = require("mongoose");

moongose.Schema.Types.String.checkRequired((v) => typeof v === "string");

const postSchema = new Schema({
  body: {
    type: String,
    required: true,
  },
  createdAt: { type: String, required: true },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  type: {
    type: String,
    enum: ["TEXT", "IMAGE"],
    required: true,
    default: "TEXT",
  },
  image: { type: String },
  comments: [
    {
      body: { type: String },
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: String },
    },
  ],
  likes: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      createdAt: { type: String },
    },
  ],
});

module.exports = model("Post", postSchema);
