const updatePosts = (posts) => {
  if (posts.length === 0) return [];

  return posts.map((post) => {
    const newPost = post.toObject({ getters: true });

    newPost.comments = newPost.comments.map((com) => {
      return {
        body: com.body,
        createdAt: com.createdAt,
        userId: com.userId.id,
        firstname: com.userId.firstname,
        lastname: com.userId.lastname,
      };
    });

    newPost.likes = newPost.likes.map((like) => {
      return {
        createdAt: like.createdAt,
        userId: like.userId.id,
        firstname: like.userId.firstname,
        lastname: like.userId.lastname,
      };
    });

    console.log(newPost);

    return newPost;
  });
};

const updatePost = (post) => {
  const newPost = post.toObject({ getters: true });
  newPost.comments = newPost.comments.map((com) => {
    return {
      body: com.body,
      createdAt: com.createdAt,
      userId: com.userId.id,
      firstname: com.userId.firstname,
      lastname: com.userId.lastname,
    };
  });

  newPost.likes = newPost.likes.map((like) => {
    return {
      createdAt: like.createdAt,
      userId: like.userId.id,
      firstname: like.userId.firstname,
      lastname: like.userId.lastname,
    };
  });

  return newPost;
};

exports.updatePosts = updatePosts;
exports.updatePost = updatePost;
