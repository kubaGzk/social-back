const {
  ApolloError,
  UserInputError,
  AuthenticationError,
  withFilter,
} = require("apollo-server");
const Chat = require("../../models/Chat");
const checkAuth = require("../../util/check-auth");
const mongoose = require("mongoose");

module.exports = {
  Query: {
    getChat: async (_, { chatId }, context) => {
      const { id: userId } = checkAuth(context);

      let chat;
      try {
        chat = await Chat.findById(chatId)
          .populate("users", "firstname lastname image")
          .exec();
      } catch (err) {
        throw new ApolloError(err);
      }
      if (!chat) {
        throw new UserInputError("Chat doesn't exist");
      }

      if (chat.users.findIndex((us) => us.id === userId) < 0) {
        throw new AuthenticationError("You are not allowed to read this chat");
      }

      return chat;
    },
    getChats: async (_, data, context) => {
      const { id: userId } = checkAuth(context);

      let chats = [];
      try {
        chats = await Chat.find({ users: { $elemMatch: { userId } } })
          .populate("users", "firstname lastname image")
          .exec();
      } catch (err) {
        throw new ApolloError(err);
      }

      return chats;
    },
  },
  Mutation: {
    createChat: async (_, { users }, context) => {
      const { id: userId } = checkAuth(context);

      const usersArr = [userId, ...users];
      let chat;

      try {
        chat = await Chat.findOne({
          users: { $all: usersArr, $size: usersArr.length },
        })
          .populate("users", "firstname lastname image")
          .exec();
      } catch (err) {
        throw new ApolloError(err);
      }

      if (chat) {
        throw new UserInputError("Chat already exist.");
      }

      try {
        const sess = await mongoose.startSession();
        sess.startTransaction();

        chat = new Chat({ users: usersArr });
        await chat.save();

        chat = await Chat.findById(chat.id)
          .populate("users", "firstname lastname image")
          .exec();

        await sess.commitTransaction();
      } catch (err) {
        throw new ApolloError(err);
      }

      context.pubsub.publish("NEW_CHAT", {
        newChat: chat,
      });

      return chat;
    },
    startWriting: async (_, { chatId }, context) => {
      const { id: userId } = checkAuth(context);

      let chat;
      try {
        chat = await Chat.findById(chatId)
          .populate("users", "firstname lastname image")
          .exec();
      } catch (err) {
        throw new ApolloError(err);
      }

      if (!chat) {
        throw new UserInputError("Cannot find chat for provided ID.");
      }

      if (chat.writing.findIndex((w) => w.toString() === userId) < 0) {
        chat.writing = [...chat.writing, userId];
      }

      try {
        await chat.save();
      } catch (err) {
        throw new ApolloError(err);
      }

      context.pubsub.publish("CHAT_CHANGE", { chatChange: chat });

      return chat;
    },
    endWriting: async (_, { chatId }, context) => {
      const { id: userId } = checkAuth(context);

      let chat;
      try {
        chat = await Chat.findById(chatId)
          .populate("users", "firstname lastname image")
          .exec();
      } catch (err) {
        throw new ApolloError(err);
      }

      if (!chat) {
        throw new UserInputError("Cannot find chat for provided ID.");
      }

      chat.writing = chat.writing.filter((w) => w.toString() !== userId);

      try {
        await chat.save();
      } catch (err) {
        throw new ApolloError(err);
      }

      context.pubsub.publish("CHAT_CHANGE", { chatChange: chat });

      return chat;
    },
    writeMessage: async (_, { chatId, body }, context) => {
      const { id: userId } = checkAuth(context);
      let chat;
      try {
        chat = await Chat.findById(chatId)
          .populate("users", "firstname lastname image")
          .exec();
      } catch (err) {
        throw new ApolloError(err);
      }

      if (!chat) {
        throw new UserInputError("Cannot find chat for provided ID.");
      }

      chat.messages = [
        ...chat.messages,
        {
          body,
          user: userId,
          createdAt: new Date().toISOString(),
          read: [userId],
        },
      ];

      try {
        await chat.save();
      } catch (err) {
        throw new ApolloError(err);
      }

      context.pubsub.publish("CHAT_CHANGE", { chatChange: chat });

      return chat;
    },
    readMessage: async (_, { chatId, messageIds }, context) => {
      const { id: userId } = checkAuth(context);
      let chat;
      try {
        chat = await Chat.findById(chatId)
          .populate("users", "firstname lastname image")
          .exec();
      } catch (err) {
        throw new ApolloError(err);
      }

      if (!chat) {
        throw new UserInputError("Cannot find chat for provided ID.");
      }

      chat.messages = chat.messages.map((msg) => {
        if (messageIds.indexOf(msg.id.toISOString()) >= 0) {
          msg.read.push(userId);
        }
        return msg;
      });

      try {
        await chat.save();
      } catch (err) {
        throw new ApolloError(err);
      }

      context.pubsub.publish("CHAT_CHANGE", { chatChange: chat });

      return chat;
    },
  },
  Subscription: {
    newChat: {
      subscribe: withFilter(
        (_, data, { pubsub }) => pubsub.asyncIterator("NEW_CHAT"),
        (payload, variables) =>
          payload.newChat.users.findIndex(
            (usr) => usr.id === variables.userId
          ) >= 0
      ),
    },
    chatChange: {
      subscribe: withFilter(
        (_, data, { pubsub }) => pubsub.asyncIterator("CHAT_CHANGE"),
        (payload, variables) =>
          payload.chatChange.users.findIndex(
            (usr) => usr.id === variables.userId
          ) >= 0
      ),
    },
  },
};
