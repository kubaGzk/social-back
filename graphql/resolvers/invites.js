const { UserInputError, withFilter } = require("apollo-server");
const mongoose = require("mongoose");

const User = require("../../models/User");
const Chat = require("../../models/Chat");
const checkAuth = require("../../util/check-auth");
const checkAuthWs = require("../../util/check-auth-ws");

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
        "invitesReceived invitesSend friends firstname lastname image"
      );
      const receiveUser = await User.findById(
        receiver,
        "invitesReceived invitesSend friends firstname lastname image"
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
        let chat;
        let chatExist = true;
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

          //CHAT CREATION
          const usersArr = [requestUser.id, receiveUser.id];

          chat = await Chat.findOne({
            users: { $all: usersArr, $size: usersArr.length },
          })
            .populate("users", "firstname lastname image")
            .exec();

          if (!chat) {
            chat = new Chat({ users: [requestUser.id, receiveUser.id] });
            await chat.save({ session: sess });

            chat = await Chat.findById(chat.id)
              .populate("users", "firstname lastname image")
              .exec();

            chatExist = false;
          }

          await requestUser.save({ session: sess });
          await receiveUser.save({ session: sess });

          await sess.commitTransaction();
        } catch (err) {
          throw new Error(err);
        }

        !chatExist &&
          context.pubsub.publish("NEW_CHAT", {
            newChat: chat,
          });

        context.pubsub.publish("INVITE", {
          invite: {
            type: "CONFIRMED",
            receiverId: receiveUser.id,
            id: requestUser.id,
            firstname: requestUser.firstname,
            lastname: requestUser.lastname,
            image: requestUser.image,
          },
        });

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

      context.pubsub.publish("INVITE", {
        invite: {
          type: "RECEIVED",
          receiverId: receiveUser.id,
          id: requestUser.id,
          firstname: requestUser.firstname,
          lastname: requestUser.lastname,
          image: requestUser.image,
        },
      });

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
        "invitesReceived invitesSend friends firstname lastname image"
      );

      if (receiveUser.invitesReceived.indexOf(requestor) === -1) {
        throw new Error("There is no such invitation");
      }
      let chat;
      let chatExist = true;

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

        //CHAT CREATION
        const usersArr = [requestUser.id, receiveUser.id];

        chat = await Chat.findOne({
          users: { $all: usersArr, $size: usersArr.length },
        })
          .populate("users", "firstname lastname image")
          .exec();

        if (!chat) {
          chat = new Chat({ users: [requestUser.id, receiveUser.id] });
          await chat.save({ session: sess });

          chat = await Chat.findById(chat.id)
            .populate("users", "firstname lastname image")
            .exec();
          chatExist = false;
        }

        await requestUser.save({ session: sess });
        await receiveUser.save({ session: sess });

        await sess.commitTransaction();
      } catch (err) {
        throw new Error(err);
      }

      !chatExist &&
        context.pubsub.publish("NEW_CHAT", {
          newChat: chat,
        });

      context.pubsub.publish("INVITE", {
        invite: {
          type: "CONFIRMED",
          receiverId: requestUser.id,
          id: receiveUser.id,
          firstname: receiveUser.firstname,
          lastname: receiveUser.lastname,
          image: receiveUser.image,
        },
      });

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
  Subscription: {
    invite: {
      subscribe: withFilter(
        (_, __, { pubsub }) => pubsub.asyncIterator("INVITE"),
        (parent, _, context) => {
          const { id: userId } = checkAuthWs(context);
          return parent.invite.receiverId === userId;
        }
      ),
    },
  },
};
