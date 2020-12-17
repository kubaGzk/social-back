const Post = require("../../models/Post");
const checkAuth = require("../../util/check-auth");
const { AuthenticationError, UserInputError } = require("apollo-server");
const uploadFile = require("../../util/upload-file");
const aws = require("aws-sdk");
const {
  AWS_ACC_KEY,
  AWS_SEC_KEY,
  AWS_S3_BUCKET,
  AWS_REGION,
} = require("../../config");

aws.config.update({
  accessKeyId: AWS_ACC_KEY,
  secretAccessKey: AWS_SEC_KEY,
  region: AWS_REGION,
});

module.exports = {
  Query: {
    async getPosts(_, { offset, userId }) {
      const ind = offset || 0;

      const filters = {};

      if (userId) {
        filters.userId = userId;
      }

      let posts;

      try {
        posts = await Post.find(filters)
          .skip(ind)
          .limit(10)
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
    async editPost(_, { postId, body, image }, context) {
      const { id } = checkAuth(context);

      let editedPost;
      try {
        editedPost = await Post.findById(postId).exec();
      } catch (err) {
        throw new Error("Unexpected error");
      }

      if (!editedPost) {
        throw new UserInputError("Cannot find this post");
      }

      if (id !== editedPost.userId.toString()) {
        throw new AuthenticationError("Insufficient access to edit this post");
      }

      if (body) {
        editedPost.body = body;
      }

      try {
        if (image && editedPost.type === "IMAGE") {
          const imageKey = await uploadFile(image);
          const oldImage = editedPost.image;
          editedPost.image = imageKey;

          const s3 = new aws.S3();

          const s3response = await s3
            .deleteObject({ Bucket: AWS_S3_BUCKET, Key: oldImage })
            .promise();
          console.log(`Image deleted ${oldImage}`, s3response);
        }

        await editedPost.save();
      } catch (err) {
        throw new Error(err);
      }

      context.pubsub.publish("EDITED_POST", {
        editedPost,
      });

      const returnedPost = await Post.findById(editedPost.id)
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
        if (post.type === "IMAGE") {
          const s3 = new aws.S3();

          const s3response = await s3
            .deleteObject({ Bucket: AWS_S3_BUCKET, Key: post.image })
            .promise();
          console.log(`Image deleted ${post.image}`, s3response);
        }
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
