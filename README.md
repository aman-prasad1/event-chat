# 💬 Event-Chat

Event-Chat is a high-performance, real-time, event-driven microservices chat application. The system decouples business domains into dedicated services (Authentication, User Profiles, and Messaging) and integrates with **Apache Kafka** for asynchronous task execution, **Redis** for distributed pub/sub and presence tracking, and **PostgreSQL** via **Prisma ORM** for persistent storage. The client is a modern, responsive interface built using **React 19**, **Vite**, and **Tailwind CSS v4**.

---

## 🏗️ Architecture Overview

The system is designed around a microservices architecture to ensure scalability, fault isolation, and decoupling of core features:

```mermaid
graph TD
    %% Client & Gateway
    Client[React 19 Frontend Client]

    subgraph "Microservices"
        AuthService[Auth Service<br/>Port 8001]
        UserService[User Service<br/>Port 8002]
        ChatService[Chat Service<br/>Port 8000]
    end

    subgraph "Data & Messaging Infrastructure"
        Postgres[(PostgreSQL Database<br/>Shared/Segmented Schema)]
        Redis[(Redis Cache & Pub/Sub<br/>Presence & Socket Scaling)]
        Kafka[[Apache Kafka Message Broker]]
        Zookeeper[Zookeeper]
    end

    subgraph "External Cloud Providers"
        Cloudinary[Cloudinary CDN<br/>Profile Picture Storage]
        S3[AWS S3 Bucket<br/>Message Media Storage]
    end

    %% Client Interactions
    Client -->|HTTP / Auth / JWT| AuthService
    Client -->|HTTP / Profile Update| UserService
    Client -->|WebSockets / HTTP| ChatService

    %% Database connections
    AuthService -->|Prisma Client| Postgres
    UserService -->|Prisma Client| Postgres
    ChatService -->|Prisma Client| Postgres

    %% Redis connections
    ChatService -->|Presence & Cache| Redis
    ChatService <-->|Socket Events Pub/Sub| Redis

    %% Kafka connections
    UserService -->|Publish: avatar-cleanup| Kafka
    Kafka -->|Consume| UserService
    ChatService -->|Publish: message-topic| Kafka
    Kafka -->|Consume| ChatService
    Zookeeper --- Kafka

    %% Cloud Storage connections
    UserService -->|Uploads| Cloudinary
    ChatService -->|S3 Uploads & Presigned URLs| S3
```

### Microservices Breakdown
*   **Auth Service (`ports: 8001`)**: Handles user authentication, token generation, token refresh cycles via HttpOnly cookies, and security enforcement (rate-limiting, CORS, password hashing).
*   **User Service (`ports: 8002`)**: Manages profile changes, account deletions, and user discovery. Uploads avatars directly to Cloudinary and broadcasts deletion events to Kafka for storage cleanup.
*   **Chat Service (`ports: 8000`)**: Facilitates direct and group messaging. Manages persistent WebSocket connections using Socket.io. It leverages Redis for caching chat records, tracking user online presence, and scaling socket emissions across nodes.

---

## ✨ Key Features

*   **Microservice Architecture**: Fully independent, specialized backend engines communicating asynchronously where applicable.
*   **Real-Time Bidirectional Messaging**: Live message transport using WebSockets via `Socket.io-client` and `Socket.io`.
*   **Distributed WebSockets (Redis Pub/Sub)**: Scales socket communication horizontally by synchronizing socket events across multiple server processes using Redis.
*   **Offline Messages & Read Receipts**: Queues messages for offline users and synchronizes "Sent", "Delivered", and "Seen" indicators when users connect.
*   **Event-Driven Workflows (Kafka)**: Decouples critical flows. For instance, sending messages queues them in a Kafka topic (`message-topic`) before saving to database, and account deletions trigger asynchronous profile picture deletions on Cloudinary via `avatar-cleanup`.
*   **Secure File Sharing**: Securely uploads attachments (images, PDFs, documents) to AWS S3, caching temporary, secure, presigned S3 download URLs in Redis.
*   **Premium React 19 Frontend**:
    *   Responsive state management with **Zustand**.
    *   Robust server-state management, caching, and auto-refetching with **TanStack React Query**.
    *   Clean emoji integrations, toast alerts, and a modern Tailwind CSS v4 design.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React 19 (Vite)
*   **Styling**: Tailwind CSS v4 (Vanilla CSS fallback hooks)
*   **State Management**: Zustand
*   **Data Fetching**: TanStack React Query v5 & Axios
*   **Real-Time Connection**: Socket.io-client v4
*   **Icons & Utilities**: React Icons, React Input Emoji, React Toastify

### Backend
*   **Runtime**: Node.js
*   **Framework**: Express.js
*   **Database ORM**: Prisma v7 (PostgreSQL adapter)
*   **Real-Time Networking**: Socket.io v4
*   **Task Queue / Messaging**: KafkaJS v2
*   **Caching & Session Storage**: Redis (ioredis v5)

### Third-Party Services
*   **Cloudinary**: User profile image CDN.
*   **AWS S3**: Multi-media chat attachment storage.

---

## 📁 Repository Structure

```text
├── frontend/                  # React 19 Client App
│   ├── src/
│   │   ├── components/        # ChatBox, Sidebar, Settings panels
│   │   ├── hooks/             # Custom custom React hooks
│   │   ├── pages/             # SignUp, Login, Home (main app page)
│   │   ├── store/             # Zustand global states (auth, chat)
│   │   └── main.jsx           # App initialization
│   ├── package.json
│   └── vite.config.js
├── services/                  # Backend Microservices
│   ├── auth-service/          # Authentication Service
│   ├── user-service/          # User Management Service
│   ├── chat-service/          # Real-time WebSocket Messaging Service
│   ├── docker-compose.yml     # Infrastructure (DB, Redis, Kafka) orchestrator
│   └── .env.sample            # Unified environment templates
└── LICENSE                    # MIT License file
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Docker & Docker Compose](https://www.docker.com/)

---

### 1. Environment Configurations

Both the root services and individual subservices require `.env` configurations. Copy the sample files and update them with your API keys.

#### Global / Services Common Variables (`services/.env`)
```ini
ZOOKEEPER_CLIENT_PORT=2181
ZOOKEEPER_TICK_TIME=2000

KAFKA_PORT=9092
KAFKA_BROKER_ID=1
KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
KAFKA_REPLICATION_FACTOR=1
KAFKA_BROKER=localhost:9092
```

#### Auth Service (`services/auth-service/.env`)
```ini
PORT=8001
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/event_chat
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
ACCESS_TOKEN_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION=7d
```

#### User Service (`services/user-service/.env`)
```ini
PORT=8002
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/event_chat
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Kafka config
ZOOKEEPER_CLIENT_PORT=2181
KAFKA_PORT=9092
KAFKA_BROKER=localhost:9092
```

#### Chat Service (`services/chat-service/.env`)
```ini
PORT=8000
CORS_ORIGIN=http://localhost:5173
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/event_chat
REDIS_URL=redis://localhost:6379

# AWS S3 Bucket details for file transfers
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket_name

# Kafka Config
KAFKA_BROKER=localhost:9092
```

---

### 2. Spinning Up Infrastructure (Docker)

Spin up PostgreSQL, Redis, Zookeeper, and Apache Kafka using the provided docker compose file:

```bash
cd services
docker-compose up -d
```

This starts the base components:
*   **PostgreSQL** on port `5432`
*   **Redis** on port `6379`
*   **Kafka** on port `9092`
*   **Zookeeper** on port `2181`

---

### 3. Setting Up Databases and Prisma

To set up the shared database schemas, you must generate the Prisma Clients and run the migrations for the backend services.

Run the following commands in the folder of **each** service (`auth-service`, `user-service`, `chat-service`):

```bash
# Install dependencies
npm install

# Generate the prisma schema and deploy migration
npm run prisma:generate
npm run prisma:migrate
```

---

### 4. Running Backend Services

You can run each service individually in development mode (which utilizes `nodemon` to watch file changes):

```bash
# In services/auth-service
npm run dev

# In services/user-service
npm run dev

# In services/chat-service
npm run dev
```

---

### 5. Running the Frontend

Navigate to the frontend folder, install dependencies, and start the Vite development server:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📡 API Endpoints Reference

### 🔒 Authentication Service (`PORT: 8001`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new user profile | No (Rate-Limited) |
| `POST` | `/api/auth/login` | Login user and issue cookies | No (Rate-Limited) |
| `POST` | `/api/auth/refresh-tokens` | Renew access token via refresh token | No |
| `POST` | `/api/auth/logout` | Revoke tokens & delete cookies | Yes |
| `POST` | `/api/auth/change-password` | Update current password | Yes |

### 👤 User Service (`PORT: 8002`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/user/profile` | Get logged-in user profile details | Yes |
| `PATCH` | `/api/user/profile` | Update profile properties / avatar image | Yes |
| `GET` | `/api/user/search` | Search users by name or username | Yes |
| `DELETE` | `/api/user/delete-account` | Delete user account & triggers cleanups | Yes |

### 💬 Chat Service (`PORT: 8000`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/messages/conversations/direct` | Establish or load direct conversation | Yes |
| `POST` | `/api/messages/` | Send message (supports text / files) | Yes (Rate-Limited) |
| `GET` | `/api/messages/conversation-messages/:conversationId` | Get paginated message history | Yes |
| `GET` | `/api/messages/recent-conversations` | Get recent conversations (Cached in Redis) | Yes |
| `GET` | `/api/messages/file-url` | Generate presigned URL for secure download | Yes |

---

## 🔌 Real-Time Socket Events

The Chat Service (`PORT: 8000`) utilizes Socket.io for managing real-time events.

### Client $\rightarrow$ Server
*   `message_delivered`: Notifies the server that a message (by `messageId`) has reached the recipient's viewport.
*   `message_seen`: Notifies the server that a message (by `messageId`) has been explicitly viewed/read by the receiver.

### Server $\rightarrow$ Client
*   `message_sent`: Sent to the sender once their message has successfully cleared the Kafka pipeline and is persisted.
*   `message_received`: Dispatched to active recipients when a new message is directed to their conversation.
*   `message_delivered_update`: Broadcasts a delivery timestamp update to the sender.
*   `message_seen_update`: Broadcasts a seen/read timestamp update to the sender.
*   `action_error`: Standard socket error emissions (e.g. unauthorized requests, invalid payload IDs).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
