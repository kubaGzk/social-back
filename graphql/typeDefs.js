const { gql } = require("apollo-server");

module.exports = gql`
  type Post {
    id: ID!
    body: String!
    createdAt: String!
    userId: ID!
    firstname: String!
    lastname: String!
    userImage: String!
    comments: [Comment]!
    likes: [Like]!
    likeCount: Int!
    commentCount: Int!
    type: PostType!
    image: String
  }

  type Comment {
    id: ID!
    createdAt: String!
    userId: ID!
    body: String!
    firstname: String
    lastname: String
    image: String
  }

  enum PostType {
    TEXT
    IMAGE
  }

  type Like {
    id: ID!
    createdAt: String!
    userId: ID!
    firstname: String
    lastname: String
  }

  input RegisterInput {
    username: String!
    firstname: String!
    lastname: String!
    password: String!
    confirmPassword: String!
    email: String!
    image: Upload!
  }

  type User {
    id: ID!
    email: String!
    token: String!
    username: String!
    firstname: String!
    lastname: String!
    createdAt: String!
    image: String!
  }

  type Query {
    getPosts(offset: Int, userId: ID): [Post]
    getPost(postId: ID!): Post
  }

  type Mutation {
    register(registerInput: RegisterInput): User!
    login(username: String!, password: String!): User!
    validateToken: User!
    createPost(type: PostType!, body: String, image: Upload): Post!
    deletePost(postId: ID!): ID!
    createComment(postId: ID!, body: String!): Post!
    deleteComment(postId: ID!, commentId: ID!): Post!
    likePost(postId: ID!): Post!
  }

  type Subscription {
    newPost: Post!
  }
`;
