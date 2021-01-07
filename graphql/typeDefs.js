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
    friends: [ID!]
    posts: [ID!]
    invitesSend: [ID!]
    invitesReceived: [ID!]
  }

  type UserInfo {
    id: ID!
    email: String!
    firstname: String!
    lastname: String!
    createdAt: String!
    image: String!
    description: String
    friends: [ID!]
    postsCount: Int!
    invitesSend: [ID!]
    invitesReceived: [ID!]
  }

  enum InviteType {
    RECEIVED
    CONFIRMED
  }

  type Invite {
    id: ID!
    firstname: String!
    lastname: String!
    image: String!
  }

  type InviteNotification {
    type: InviteType!
    receiverId: ID!
    id: ID!
    firstname: String!
    lastname: String!
    image: String!
  }

  type Invites {
    received: [Invite]
    sent: [Invite]
  }

  type Query {
    getPosts(offset: Int, userId: ID): [Post]
    getPost(postId: ID!): Post
    getUserInfo(userId: ID!): UserInfo
    getInvitations: Invites
  }

  type Mutation {
    register(registerInput: RegisterInput): User!
    login(username: String!, password: String!): User!
    updateUser(
      firstname: String!
      lastname: String!
      description: String!
      image: Upload
    ): UserInfo!
    validateToken: User!
    createPost(type: PostType!, body: String, image: Upload): Post!
    editPost(postId: ID!, body: String, image: Upload): Post!
    deletePost(postId: ID!): ID!
    createComment(postId: ID!, body: String!): Post!
    deleteComment(postId: ID!, commentId: ID!): Post!
    likePost(postId: ID!): Post!
    createInvite(receiver: ID!): String!
    confirmInvite(requestor: ID!): String!
    declineInvite(requestor: ID!): String!
  }

  type Subscription {
    newPost: Post!
    editedPost: Post!
    deletedPost: ID!
    invite(userId: ID!): InviteNotification!
  }
`;
