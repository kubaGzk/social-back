const { UserInputError, AuthenticationError } = require("apollo-server");
const mongoose = require("mongoose");
const Invite = require("../../models/Invite");
const User = require("../../models/User");
const checkAuth = require("../../util/check-auth");

module.exports = {
  Mutation: {
    createInvite: async (_, { receiver }, context) => {
      const { id: requestor } = checkAuth(context);

      if (receiver === requestor) {
        throw new UserInputError("Cannot send invite to ourselve");
      }

      const requestUser = await User.findById(
        requestor,
        "invitesReceived invitesSend friends"
      );
      const receiveUser = await User.findById(
        receiver,
        "invitesReceived invitesSend friends"
      );

      if (
        requestUser.friends.indexOf(receiver) !== -1 ||
        receiveUser.friends.indexOf(requestor) !== -1
      ) {
        throw new UserInputError("Relation already exist");
      }

      const receiverExistingInvite = await Invite.findOne({
        receiver: requestor,
        requestor: receiver,
      });

      if (receiverExistingInvite && receiverExistingInvite.status === "SEND") {
        try {
          const sess = await mongoose.startSession();
          sess.startTransaction();

          receiverExistingInvite.status = "CONFIRMED";

          requestUser.invitesReceived = requestUser.invitesReceived.filter(
            (el) => el.toString() !== receiverExistingInvite.id.toString()
          );
          receiveUser.invitesSend = receiveUser.invitesSend.filter(
            (el) => el.toString() !== receiverExistingInvite.id.toString()
          );

          requestUser.friends.push(receiveUser.id);
          receiveUser.friends.push(requestUser.id);

          await requestUser.save({ session: sess });
          await receiveUser.save({ session: sess });

          await receiverExistingInvite.save({ session: sess });

          await sess.commitTransaction();
        } catch (err) {
          throw new Error(err);
        }
        return receiverExistingInvite;
      }

      let invite;

      const existingInvite = await Invite.findOne({
        requestor,
        receiver,
      }).exec();

      if (existingInvite) {
        switch (existingInvite.status) {
          case "SEND":
            throw new UserInputError("Invitation has been sent already");

          case "DECLINED":
            invite = existingInvite;
            invite.status = "SEND";
            break;

          default:
            break;
        }
      }

      if (!invite) {
        invite = new Invite({ requestor, receiver, status: "SEND" });
      }

      try {
        const sess = await mongoose.startSession();
        sess.startTransaction();

        await invite.save({ session: sess });

        requestUser.invitesSend.push(invite.id);
        receiveUser.invitesReceived.push(invite.id);

        await requestUser.save({ session: sess });
        await receiveUser.save({ session: sess });

        await sess.commitTransaction();
      } catch (err) {
        throw new Error(err);
      }
      return invite;
    },
    confirmInvite: async (_, { inviteId }, context) => {
      const { id: receiver } = checkAuth(context);

      const invite = await Invite.findById(inviteId);

      if (!invite) {
        throw new UserInputError("Cannot find this invite");
      }

      if (receiver !== invite.receiver.toString()) {
        throw new AuthenticationError("You are not authorized");
      }

      if (invite.status !== "SEND") {
        throw new UserInputError(
          "Cannot respond to this invite - confirmed/declined already"
        );
      }

      try {
        const sess = await mongoose.startSession();
        sess.startTransaction();

        invite.status = "CONFIRMED";

        const requestUser = await User.findById(
          invite.requestor,
          "invitesSend friends"
        );
        const receiveUser = await User.findById(
          invite.receiver,
          "invitesReceived friends"
        );

        requestUser.invitesSend = requestUser.invitesSend.filter(
          (el) => el.toString() !== invite.id.toString()
        );
        receiveUser.invitesReceived = receiveUser.invitesReceived.filter(
          (el) => el.toString() !== invite.id.toString()
        );

        requestUser.friends.push(receiveUser.id);
        receiveUser.friends.push(requestUser.id);

        await requestUser.save({ session: sess });
        await receiveUser.save({ session: sess });

        await invite.save({ session: sess });

        await sess.commitTransaction();
      } catch (err) {
        throw new Error(err);
      }

      return invite;
    },
    declineInvite: async (_, { inviteId }, context) => {
      const { id: receiver } = checkAuth(context);

      const invite = await Invite.findById(inviteId);

      if (!invite) {
        throw new UserInputError("Cannot find this invite");
      }

      if (receiver !== invite.receiver.toString()) {
        throw new AuthenticationError("You are not authorized");
      }

      if (invite.status !== "SEND") {
        throw new UserInputError(
          "Cannot respond to this invite - confirmed/declined already"
        );
      }

      try {
        const sess = await mongoose.startSession();
        await sess.startTransaction();

        invite.status = "DECLINED";

        const requestUser = await User.findById(
          invite.requestor,
          "invitesSend"
        );
        const receiveUser = await User.findById(
          invite.receiver,
          "invitesReceived"
        );

        requestUser.invitesSend = requestUser.invitesSend.filter(
          (el) => el.toString() !== invite.id.toString()
        );
        receiveUser.invitesReceived = receiveUser.invitesReceived.filter(
          (el) => el.toString() !== invite.id.toString()
        );

        await requestUser.save({ session: sess });
        await receiveUser.save({ session: sess });

        await invite.save({ session: sess });

        await sess.commitTransaction();
      } catch (err) {
        throw new Error(err);
      }

      return invite;
    },
  },
};
