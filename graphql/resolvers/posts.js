const Post = require("../../models/Post");
const checkAuth = require("../../util/check-auth");
const { AuthenticationError, UserInputError } = require("apollo-server");
const uploadFile = require("../../util/upload-file");

module.exports = {
  Query: {
    async getPosts() {
      let posts;

      try {
        posts = await Post.find()
          .populate("userId", "id firstname lastname image")
          .populate("comments.userId", "id firstname lastname image")
          .populate("likes.userId", "id firstname lastname")
          .sort({ createdAt: -1 })
          .exec();
      } catch (err) {
        throw new Error(err);
      }
      return posts;
    },

    async getPost(_, { postId }) {
      let post;
      try {
        post = await Post.findById(postId)
          .populate("userId", "id firstname lastname image")
          .populate("comments.userId", "id firstname lastname image")
          .populate("likes.userId", "id firstname lastname")
          .exec();
      } catch (err) {
        throw new Error(err);
      }

      if (!post) {
        throw new Error("Post not found");
      }

      return post;
    },
  },
  Mutation: {
    async createPost(_, { type, body, image }, context) {
      const { id } = checkAuth(context);

      let postBody = "";
      if (body) {
        postBody = body;
      }

      if (
        (type === "TEXT" && postBody.trim() === "") ||
        (type === "IMAGE" && !image)
      ) {
        throw new UserInputError("Post cannot be empty");
      }

      const postData = {
        body: postBody,
        type,
        userId: id,
        createdAt: new Date().toISOString(),
      };

      let newPost;

      try {
        if (type === "IMAGE") {
          const imageKey = await uploadFile(image);
          postData.image = imageKey;
        }

        newPost = new Post(postData);
        await newPost.save();
      } catch (err) {
        throw new Error(err);
      }

      context.pubsub.publish("NEW_POST", {
        newPost,
      });

      const returnedPost = await Post.findById(newPost.id)
        .populate("userId", "id firstname lastname image")
        .populate("comments.userId", "id firstname lastname image")
        .populate("likes.userId", "id firstname lastname")
        .exec();

      return returnedPost;
    },

    async deletePost(_, { postId }, context) {
      const { id } = checkAuth(context);

      let post;
      try {
        post = await Post.findById(postId);
      } catch (err) {
        throw new Error(err);
      }

      if (!post) {
        throw new Error("Post cannot be found");
      }

      if (id !== post.userId.toString()) {
        throw new AuthenticationError("Action not allowed");
      }

      try {
        await post.delete();
      } catch (err) {
        throw new Error(err);
      }
      return postId;
    },
  },
  Subscription: {
    newPost: {
      subscribe: (_, data, { pubsub }) => pubsub.asyncIterator("NEW_POST"),
    },
  },
};
