const { UserInputError, AuthenticationError } = require("apollo-server");
const Post = require("../../models/Post");
const checkAuth = require("../../util/check-auth");

module.exports = {
  Mutation: {
    createComment: async (_, { postId, body }, context) => {
      const { id } = checkAuth(context);

      if (body.trim() === "") {
        throw new UserInputError("Empty comment", {
          errors: {
            body: "Comment body must not be empty",
          },
        });
      }

      const newPost = await Post.findById(postId).exec();

      if (!newPost) {
        throw new UserInputError("Post not found");
      }

      newPost.comments.push({
        body,
        userId: id,
        createdAt: new Date().toISOString(),
      });

      try {
        await newPost.save();
      } catch (err) {
        throw new Error(err);
      }

      const returnedPost = await Post.findById(newPost.id)
        .populate("userId", "id firstname lastname image")
        .populate("comments.userId", "id firstname lastname image")
        .populate("likes.userId", "id firstname lastname")
        .exec();

      context.pubsub.publish("EDITED_POST", {
        editedPost: returnedPost,
      });

      return returnedPost;
    },
    async deleteComment(_, { postId, commentId }, context) {
      const { id } = checkAuth(context);

      const newPost = await Post.findById(postId).exec();

      if (!newPost) {
        throw new UserInputError("Post not found");
      }

      const commentIndex = newPost.comments.findIndex(
        (c) => c.id === commentId
      );

      if (newPost.comments[commentIndex].userId.toString() === id) {
        newPost.comments.splice(commentIndex, 1);
      } else {
        throw new AuthenticationError("Action not allowed");
      }

      try {
        await newPost.save();
      } catch (err) {
        throw new Error(err);
      }

      const returnedPost = await Post.findById(newPost.id)
        .populate("userId", "id firstname lastname image")
        .populate("comments.userId", "id firstname lastname image")
        .populate("likes.userId", "id firstname lastname")
        .exec();

      context.pubsub.publish("EDITED_POST", {
        editedPost: returnedPost,
      });

      return returnedPost;
    },
    async likePost(_, { postId }, context) {
      const { id } = checkAuth(context);

      const newPost = await Post.findById(postId).exec();

      if (!newPost) {
        throw new UserInputError("Post not found");
      }

      if (newPost.likes.find((like) => like.userId.toString() === id)) {
        //Post already liked, to unlike
        newPost.likes = newPost.likes.filter(
          (like) => like.userId.toString() !== id
        );
      } else {
        //Not liked
        newPost.likes.push({
          userId: id,
          createdAt: new Date().toISOString(),
        });
      }

      try {
        await newPost.save();
      } catch (err) {
        throw new Error(err);
      }

      const returnedPost = await Post.findById(newPost.id)
        .populate("userId", "id firstname lastname image")
        .populate("comments.userId", "id firstname lastname image")
        .populate("likes.userId", "id firstname lastname")
        .exec();

      context.pubsub.publish("EDITED_POST", {
        editedPost: returnedPost,
      });

      return returnedPost;
    },
  },
};
