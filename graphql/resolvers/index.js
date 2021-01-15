const postsResolvers = require("./posts");
const usersResolvers = require("./users");
const commentsResolvers = require("./comments");
const invitesResolvers = require("./invites");
const chatsResolvers = require("./chats");
const { updateComments, updateLikes } = require("../../util/update-posts");

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
    postsCount: (parent, _, __, { variableValues }) => {
      console.log(variableValues);
      //Context, wehre is context?
      return parent.posts.length;
    },
  },
  ChatListItem: {
    unread: () => 0,
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
