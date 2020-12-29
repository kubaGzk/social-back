const { UserInputError } = require("apollo-server");
const mongoose = require("mongoose");

const User = require("../../models/User");
const checkAuth = require("../../util/check-auth");

module.exports = {
  Query: {
    getInvitations: async (_, body, context) => {
      const { id } = checkAuth(context);

      const invites = { sent: [], received: [] };

      try {
        const user = await User.findById(id, "invitesSend invitesReceived")
          .populate("invitesSend", "firstname lastname image")
          .populate("invitesReceived", "firstname lastname image")
          .exec();

        for (const iS of user.invitesSend) {
          invites.sent.push(iS);
        }

        for (const iR of user.invitesReceived) {
          invites.received.push(iR);
        }
      } catch (err) {
        throw new Error(err);
      }

      return invites;
    },
  },

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

      if (!receiveUser) {
        throw new UserInputError("Receiver does not exist");
      }

      if (
        requestUser.friends.indexOf(receiver) !== -1 ||
        receiveUser.friends.indexOf(requestor) !== -1
      ) {
        throw new UserInputError("Relation already exist");
      }

      if (requestUser.invitesReceived.indexOf(receiver) !== -1) {
        try {
          const sess = await mongoose.startSession();
          sess.startTransaction();

          requestUser.invitesReceived = requestUser.invitesReceived.filter(
            (el) => el.toString() !== receiveUser.id.toString()
          );
          receiveUser.invitesSend = receiveUser.invitesSend.filter(
            (el) => el.toString() !== requestUser.id.toString()
          );

          requestUser.friends.push(receiveUser.id);
          receiveUser.friends.push(requestUser.id);

          await requestUser.save({ session: sess });
          await receiveUser.save({ session: sess });

          await sess.commitTransaction();
        } catch (err) {
          throw new Error(err);
        }
        return "Invitation has been accepted.";
      }

      try {
        const sess = await mongoose.startSession();
        sess.startTransaction();

        requestUser.invitesSend.push(receiveUser.id);
        receiveUser.invitesReceived.push(requestUser.id);

        await requestUser.save({ session: sess });
        await receiveUser.save({ session: sess });

        await sess.commitTransaction();
      } catch (err) {
        throw new Error(err);
      }
      return "Invitation has been sent.";
    },
    confirmInvite: async (_, { requestor }, context) => {
      const { id: receiver } = checkAuth(context);

      const requestUser = await User.findById(
        requestor,
        " invitesReceived invitesSend friends"
      );
      const receiveUser = await User.findById(
        receiver,
        "invitesReceived invitesSend friends"
      );

      if (receiveUser.invitesReceived.indexOf(requestor) === -1) {
        throw new Error("There is no such invitation");
      }

      try {
        const sess = await mongoose.startSession();
        sess.startTransaction();

        requestUser.invitesSend = requestUser.invitesSend.filter(
          (el) => el.toString() !== receiveUser.id.toString()
        );
        receiveUser.invitesReceived = receiveUser.invitesReceived.filter(
          (el) => el.toString() !== requestUser.id.toString()
        );

        requestUser.friends.push(receiveUser.id);
        receiveUser.friends.push(requestUser.id);

        await requestUser.save({ session: sess });
        await receiveUser.save({ session: sess });

        await sess.commitTransaction();
      } catch (err) {
        throw new Error(err);
      }

      return "Invitation has been accepted.";
    },
    declineInvite: async (_, { requestor }, context) => {
      const { id: receiver } = checkAuth(context);

      const requestUser = await User.findById(
        requestor,
        " invitesReceived invitesSend friends"
      );
      const receiveUser = await User.findById(
        receiver,
        "invitesReceived invitesSend friends"
      );

      if (receiveUser.invitesReceived.indexOf(requestor) === -1) {
        throw new Error("There is no such invitation");
      }

      try {
        const sess = await mongoose.startSession();
        sess.startTransaction();

        requestUser.invitesSend = requestUser.invitesSend.filter(
          (el) => el.toString() !== receiveUser.id.toString()
        );
        receiveUser.invitesReceived = receiveUser.invitesReceived.filter(
          (el) => el.toString() !== requestUser.id.toString()
        );

        await requestUser.save({ session: sess });
        await receiveUser.save({ session: sess });

        await sess.commitTransaction();
      } catch (err) {
        throw new Error(err);
      }

      return "Invitation has been declined";
    },
  },
};