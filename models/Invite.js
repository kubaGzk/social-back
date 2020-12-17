const { model, Schema } = require("mongoose");

const inviteSchema = new Schema({
  requestor: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  receiver: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["SEND", "CONFIRMED", "DECLINED"],
    default: "SEND",
  },
});

module.exports = model("Invite", inviteSchema);
