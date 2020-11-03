const { gql } = require("apollo-server");

module.exports = gql`
  type Post {
    id: ID!
    body: String!
    createdAt: String!
    userId: ID!
    comments: [Comment]!
    likes: [Like]!
    likeCount: Int!
    commentCount: Int!
  }

  type Comment {
    id: ID!
    createdAt: String!
    userId: ID!
    body: String!
    type: CommentType!
    firstname: String
    lastname: String
  }

  enum CommentType {
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
    getPosts: [Post]
    getPost(postId: ID!): Post
  }

  type Mutation {
    register(registerInput: RegisterInput): User!
    login(username: String!, password: String!): User!
    validateToken: User!
    createPost(body: String!): Post!
    deletePost(postId: ID!): String!
    createComment(postId: ID!, body: String!): Post!
    deleteComment(postId: ID!, commentId: ID!): Post!
    likePost(postId: ID!): Post!
  }

  type Subscription {
    newPost: Post!
  }
`;
