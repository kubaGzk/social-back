const Post = require("../../models/Post");
const HttpError = require("../../models/http-error");
const checkAuth = require("../../util/check-auth");
const { AuthenticationError, UserInputError } = require("apollo-server");
const comments = require("./comments");
const { updatePosts } = require("../../util/update-posts");

module.exports = {
  Query: {
    async getPosts() {
      try {
        const posts = await Post.find()
          .populate("comments.userId", "id firstname lastname")
          .populate("likes.userId", "id firstname lastname")
          .sort({ createdAt: -1 })
          .exec();

        return updatePosts(posts);
      } catch (err) {
        throw new Error(err);
      }
    },

    async getPost(_, { postId }) {
      try {
        const post = await Post.findById(postId)
          .populate("comments.userId", "id firstname lastname")
          .populate("likes.userId", "id firstname lastname")
          .exec();
        if (post) {
          return updatePost(post);
        } else {
          throw new Error("Post not found");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Mutation: {
    async createPost(_, { type, body, image }, context) {
      const user = checkAuth(context);

      if (
        (type === "TEXT" && body.trim() === "") ||
        (type === "IMAGE" && !image)
      ) {
        throw new UserInputError("Post cannot be empty");
      }

      const postData = {
        body,
        type,
        userId: user.id,
        createdAt: new Date().toISOString(),
      };

      type === "IMAGE" && (postData.image = image);

      const newPost = new Post(postData);

      const post = await newPost.save();

      context.pubsub.publish("NEW_POST", {
        newPost: post,
      });

      return post;
    },

    async deletePost(_, { postId }, context) {
      const user = checkAuth(context);

      try {
        const post = await Post.findById(postId);

        if (user.username === post.username) {
          await post.delete();
          return "Post deleted succesfully";
        } else {
          throw new AuthenticationError("Action not allowed");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
    async likePost(_, { postId }, context) {
      const { id } = checkAuth(context);

      const post = await Post.findById(postId)
        .populate("comments.userId", "id firstname lastname")
        .populate("likes.userId", "id firstname lastname")
        .exec();

      if (!post) {
        throw new UserInputError("Post not found");
      }

      if (post.likes.find((like) => like.userId === id)) {
        //Post already liked, to unlike
        post.likes = post.likes.filter((like) => like.userId !== id);
      } else {
        //Not liked
        post.likes.push({
          userId: id,
          createdAt: new Date().toISOString(),
        });
      }

      await post.save();
      return updatePost(post);
    },
  },
  Subscription: {
    newPost: {
      subscribe: (_, data, { pubsub }) => pubsub.asyncIterator("NEW_POST"),
    },
  },
};
