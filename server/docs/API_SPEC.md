# API Specification

Base URL: `http://localhost:3000` (or your deployed URL)

## User API

### Get Current User
Retrieves the user profile based on the `x-user-id` header.

*   **URL:** `/users`
*   **Method:** `GET`
*   **Headers:**
    *   `x-user-id` (Required): The unique ID of the user.
*   **Response:**
    *   **200 OK**
        ```json
        {
          "user": {
            "id": "string",
            "wallet_address": "string",
            "nickname": "string",
            "avatar_url": "string | null",
            "created_at": "string" // timestamp from DB
          }
        }
        ```
    *   **400 Bad Request:** Missing `x-user-id` header.
    *   **404 Not Found:** User does not exist.
    *   **500 Internal Server Error**

### Create User
Creates a new user profile.

*   **URL:** `/users`
*   **Method:** `POST`
*   **Body:**
    ```json
    {
      "id": "string (optional, auto-generated if missing)",
      "wallet_address": "string (required)",
      "nickname": "string (required)",
      "avatar_url": "string (optional)"
    }
    ```
*   **Response:**
    *   **201 Created**
        ```json
        {
          "user": { ... }
        }
        ```
    *   **400 Bad Request:** Missing required fields (wallet_address, nickname).
    *   **409 Conflict:** User with same wallet_address or ID already exists.
    *   **500 Internal Server Error**

### Update User
Updates the current user's profile.

*   **URL:** `/users`
*   **Method:** `PATCH`
*   **Headers:**
    *   `x-user-id` (Required)
*   **Body:** (At least one field is required)
    ```json
    {
      "nickname": "string (optional)",
      "avatar_url": "string (optional)"
    }
    ```
*   **Response:**
    *   **200 OK**
        ```json
        {
          "user": { ... }
        }
        ```
    *   **400 Bad Request:** Missing header, empty values, or no fields to update.
    *   **404 Not Found:** User not found.
    *   **409 Conflict:** Unique constraint violation (if applicable).
    *   **500 Internal Server Error**

---

## Post API

### List Posts
Retrieves a list of posts, ordered by timestamp (newest first).

*   **URL:** `/posts`
*   **Method:** `GET`
*   **Query Parameters:**
    *   `limit` (Optional): Number of posts to return (default: 50).
*   **Response:**
    *   **200 OK**
        ```json
        {
          "posts": [
            {
              "id": "string",
              "user_id": "string",
              "nickname": "string",
              "content": "string",
              "timestamp": number,
              "likes": number,
              "reposts": number,
              "is_repost": boolean,
              "parent_post_id": "string | null",
              "depth": number,
              "created_at": "string"
            },
            ...
          ]
        }
        ```
    *   **500 Internal Server Error**

### Get Post Detail
Retrieves a single post by ID.

*   **URL:** `/posts/:id`
*   **Method:** `GET`
*   **Response:**
    *   **200 OK**
        ```json
        {
          "post": { ... }
        }
        ```
    *   **404 Not Found**
    *   **500 Internal Server Error**

### Create Post
Creates a new post.

*   **URL:** `/posts`
*   **Method:** `POST`
*   **Headers:**
    *   `x-user-id` (Required)
*   **Body:**
    ```json
    {
      "content": "string (required)"
    }
    ```
*   **Response:**
    *   **201 Created**
        ```json
        {
          "post": { ... }
        }
        ```
    *   **400 Bad Request:** Missing header or content.
    *   **403 Forbidden:** User not found (based on x-user-id).
    *   **500 Internal Server Error**

### Toggle Like
Likes or unlikes a post. Acts as a toggle: first request likes, second request unlikes.

*   **URL:** `/posts/:id/likes`
*   **Method:** `POST`
*   **Headers:**
    *   `x-user-id` (Required)
*   **Response:**
    *   **200 OK**
        ```json
        {
          "post": { ... }, // The post object
          "liked": boolean // true if the user currently likes the post, false otherwise
        }
        ```
    *   **400 Bad Request:** Missing header.
    *   **404 Not Found:** Post or User not found.
    *   **500 Internal Server Error**

### Toggle Repost
Reposts or removes a repost of a post. Acts as a toggle.

*   **URL:** `/posts/:id/reposts`
*   **Method:** `POST`
*   **Headers:**
    *   `x-user-id` (Required)
*   **Response:**
    *   **200 OK**
        ```json
        {
          "post": { ... }, // The parent post object
          "reposted": boolean, // true if currently reposted by user
          "repost_id": "string | undefined" // The ID of the new repost entry (if reposted is true)
        }
        ```
    *   **400 Bad Request:** Missing header.
    *   **404 Not Found:** Post or User not found.
    *   **500 Internal Server Error**
