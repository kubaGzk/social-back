const postsResolvers = require("./posts");
const usersResolvers = require("./users");
const commentsResolvers = require("./comments");
const invitesResolvers = require("./invites");
const chatsResolvers = require("./chats");
const { updateComments, updateLikes } = require("../../util/update-posts");
const checkAuth = require("../../util/check-auth");
const checkAuthWs = require("../../util/check-auth-ws");

module.exports = {
  Post: {
    likeCount: (parent) => parent.likes.length,
    commentCount: (parent) => parent.comments.length,
    comments: (parent) => updateComments(parent),
    likes: (parent) => updateLikes(parent),
    userId: (parent) => parent.userId.id,
    firstname: (parent) => parent.userId.firstname,
    lastname: (parent) => parent.userId.lastname,
    userImage: (parent) => parent.userId.image,
  },
  UserInfo: {
    postsCount: (parent) => parent.posts.length,
  },
  Chat: {
    unread: (parent, _, context, info) => {
      let userId;

      if (info.operation.operation === "subscription") {
        userId = checkAuthWs(context).id;
      } else {
        userId = checkAuth(context).id;
      }

      return parent.messages.reduce((acc, msg) => {
        if (msg.read.indexOf(userId) < 0) {
          acc += 1;
        }
        return acc;
      }, 0);
    },
  },

  Query: {
    ...postsResolvers.Query,
    ...usersResolvers.Query,
    ...invitesResolvers.Query,
    ...chatsResolvers.Query,
  },
  Mutation: {
    ...usersResolvers.Mutation,
    ...postsResolvers.Mutation,
    ...commentsResolvers.Mutation,
    ...invitesResolvers.Mutation,
    ...chatsResolvers.Mutation,
  },
  Subscription: {
    ...postsResolvers.Subscription,
    ...invitesResolvers.Subscription,
    ...chatsResolvers.Subscription,
  },
};
