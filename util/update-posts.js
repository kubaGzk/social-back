const updatePosts = (posts) =>
  posts.map((post) => {
    const newPost = post.toObject({ getters: true });

    newPost.comments = newPost.comments.map((com) => ({
      id: com.id,
      body: com.body,
      createdAt: com.createdAt,
      userId: com.userId.id,
      firstname: com.userId.firstname,
      lastname: com.userId.lastname,
    }));

    newPost.likes = newPost.likes.map((like) => ({
      id: like.id,
      createdAt: like.createdAt,
      userId: like.userId.id,
      firstname: like.userId.firstname,
      lastname: like.userId.lastname,
    }));

    return newPost;
  });

const updatePost = (post) => {
  const newPost = post.toObject({ getters: true });
  newPost.comments = newPost.comments.map((com) => ({
    id: com.id,
    body: com.body,
    createdAt: com.createdAt,
    userId: com.userId.id,
    firstname: com.userId.firstname,
    lastname: com.userId.lastname,
  }));

  newPost.likes = newPost.likes.map((like) => ({
    id: like.id,
    createdAt: like.createdAt,
    userId: like.userId.id,
    firstname: like.userId.firstname,
    lastname: like.userId.lastname,
  }));

  return newPost;
};

const updateComments = (post) =>
  post.comments.map((com) => ({
    id: com.id,
    body: com.body,
    createdAt: com.createdAt,
    userId: com.userId.id || com.userId,
    firstname: com.userId.firstname,
    lastname: com.userId.lastname,
  }));

const updateLikes = (post) =>
  post.likes.map((like) => ({
    id: like.id,
    createdAt: like.createdAt,
    userId: like.userId.id || like.userId,
    firstname: like.userId.firstname,
    lastname: like.userId.lastname,
  }));

exports.updateComments = updateComments;
exports.updateLikes = updateLikes;
exports.updatePosts = updatePosts;
exports.updatePost = updatePost;
