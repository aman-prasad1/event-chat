# 💬 Event-Chat

Event-Chat is a high-performance, real-time, event-driven microservices chat application. The system decouples business domains into dedicated services (Authentication, User Profiles, and Messaging) and integrates with **Apache Kafka** for asynchronous task execution, **Redis** for distributed pub/sub and presence tracking, and **PostgreSQL** via **Prisma ORM** for persistent storage. 

Routing is unified via an **Nginx Reverse Proxy**, allowing the frontend client to communicate with the entire service mesh through a single port. The client is a modern, responsive interface built using **React 19**, **Vite**, and **Tailwind CSS v4**.

---

## 🏗️ Architecture Overview

The system is designed around a microservices architecture with a dedicated API Gateway/Proxy layer to ensure scalability, fault isolation, and clean path-based routing:

```mermaid
graph TD
    %% Client & Gateway
    Client["React 19 Frontend Client"]
    
    subgraph "API Gateway & Reverse Proxy"
        Nginx["Nginx Proxy (Port 8080 Dev / 80 Prod)"]
    end

    subgraph "Microservices (Node 22-alpine)"
        AuthService["Auth Service (Port 8001)"]
        UserService["User Service (Port 8002)"]
        ChatService["Chat Service (Port 8000)"]
    end

    subgraph "Data & Messaging Infrastructure"
        Postgres[("PostgreSQL Database (Shared Schema)")]
        Redis[("Redis Cache & Pub/Sub (Presence & Socket Scaling)")]
        Kafka[["Apache Kafka Broker (Zookeeper Connected)"]]
        Zookeeper["Zookeeper"]
    end

    subgraph "External Cloud Providers"
        Cloudinary["Cloudinary CDN (Profile Picture Storage)"]
        S3["AWS S3 Bucket (Message Media Storage)"]
    end

    %% Client Interactions
    Client -->|HTTP and WebSockets| Nginx
    Nginx -->|Auth API| AuthService
    Nginx -->|User API| UserService
    Nginx -->|Chat and WebSockets| ChatService

    %% Database connections
    AuthService -->|Prisma Client| Postgres
    UserService -->|Prisma Client| Postgres
    ChatService -->|Prisma Client| Postgres

    %% Redis connections
    ChatService -->|Presence and Cache| Redis
    ChatService <-->|Socket Events Pub/Sub| Redis

    %% Kafka connections
    UserService -->|Publish: avatar-cleanup| Kafka
    Kafka -->|Consume: user-service-group| UserService
    ChatService -->|Publish: message-topic| Kafka
    Kafka -->|Consume: messaging-group| ChatService
    Zookeeper --- Kafka

    %% Cloud Storage connections
    UserService -->|Uploads| Cloudinary
    ChatService -->|S3 Uploads and URLs| S3
```

### Path-Based Routing (Nginx Gateway)
*   `/api/v1/auth/*` $\rightarrow$ Proxied to `http://auth-service:8001`
*   `/api/v1/user/*` $\rightarrow$ Proxied to `http://user-service:8002`
*   `/*` (default routing, including WebSocket / `socket.io` handshake) $\rightarrow$ Proxied to `http://chat-service:8000`

### Microservices Breakdown
*   **Auth Service**: Handles user registration, token generation, token refresh cycles via HttpOnly cookies, and security enforcement.
*   **User Service**: Manages profile changes, account deletions, and user search. Publishes avatar cleanup events to Kafka. Consumes events as part of the `user-service-group`.
*   **Chat Service**: Facilitates real-time direct & group messaging. Integrates WebSockets, leverages Redis for presence tracking, and publishes messages to Kafka for async db writes. Consumes messages as part of the `messaging-group`.

---

## ✨ Key Features

*   **API Gateway Integration (Nginx)**: Consolidates endpoints, simplifies CORS configurations, and handles client WebSocket connection upgrades through a single entry point.
*   **Microservices Architecture**: Multi-stage dockerized environments running on **Node.js 22-alpine**.
*   **Distributed WebSockets (Redis Pub/Sub)**: Scales socket communication horizontally by synchronizing socket events across multiple server processes using Redis.
*   **Offline Messages & Read Receipts**: Queues messages for offline users and synchronizes "Sent", "Delivered", and "Seen" indicators when users connect.
*   **Event-Driven Workflows (Kafka)**: Asynchronous processing of messages (`message-topic`) and profile asset deletions (`avatar-cleanup`) with dedicated consumer groups for each service.
*   **Secure File Sharing**: Securely uploads attachments (images, PDFs, documents) to AWS S3, caching temporary, secure, presigned S3 download URLs in Redis.
*   **Premium React 19 Frontend**:
    *   State management with **Zustand**.
    *   Server-state synchronization with **TanStack React Query**.
    *   Dynamic routing, emoji integrations, and modern Tailwind CSS v4 styling.

---

## 🛠️ Tech Stack

### Frontend
*   **Framework**: React 19 (Vite)
*   **Styling**: Tailwind CSS v4
*   **State Management**: Zustand
*   **Data Fetching**: TanStack React Query v5 & Axios
*   **Real-Time Connection**: Socket.io-client v4

### Backend
*   **Runtime**: Node.js v22-alpine
*   **Framework**: Express.js
*   **Database ORM**: Prisma v7 (PostgreSQL)
*   **Real-Time Networking**: Socket.io v4
*   **Task Queue / Messaging**: KafkaJS v2
*   **Caching & Session Storage**: Redis (ioredis v5)
*   **Gateway**: Nginx (alpine)

---

## 📁 Repository Structure

```text
├── frontend/                  # React 19 Client App
│   ├── src/
│   │   ├── components/        # ChatBox, Sidebar, Settings panels
│   │   ├── hooks/             # API hook layer (useAuth, useChat)
│   │   ├── lib/               # Axios and Socket connections setup
│   │   └── main.jsx           # App initialization
│   ├── .env.sample            # Frontend env template
│   ├── package.json
│   └── vite.config.js
├── services/                  # Backend Microservices & Orchestration
│   ├── auth-service/          # Authentication Service & Dockerfile
│   ├── user-service/          # User Management Service & Dockerfile
│   ├── chat-service/          # Real-time WebSocket Messaging Service & Dockerfile
│   ├── nginx.dev.conf         # Nginx router configs for development environment
│   ├── docker-compose.dev.yml # Local development orchestrator (with hot-reload)
│   ├── docker-compose.yml     # Consolidated production orchestrator (without local DBs)
│   └── .env.sample            # Unified environment templates for backend
└── LICENSE                    # MIT License file
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have the following installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher; services run on v22 inside Docker)
*   [Docker & Docker Compose](https://www.docker.com/)

---

### 1. Environment Configurations

Both the root services and individual subservices require `.env` configurations. Copy the sample files and update them.

#### Frontend Client Configuration (`frontend/.env`)
Create a `.env` file inside the `frontend` folder:
```ini
VITE_BACKEND_URL=http://localhost:8080/api/v1
VITE_SOCKET_URL=http://localhost:8080
```
> [!NOTE]
> If `VITE_SOCKET_URL` is omitted, the socket client automatically derives it by stripping the `/api/v1` suffix from `VITE_BACKEND_URL`.

#### Services Common Variables (`services/.env`)
Create a `.env` file in the `services` directory containing configurations for the microservices:
```ini
PORT=8000
CORS_ORIGIN=http://localhost:5173

# Database & Cache
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/event_chat
REDIS_URL=redis://redis:6379

# Third Party Services
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_key_id
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket_name

# Kafka Configuration
ZOOKEEPER_CLIENT_PORT=2181
ZOOKEEPER_TICK_TIME=2000
KAFKA_PORT=9092
KAFKA_BROKER_ID=1
KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
KAFKA_REPLICATION_FACTOR=1
KAFKA_BROKER=localhost:9092
```

---

### 2. Running the Application via Docker

The project provides separate Docker Compose files for development (local) and production.

#### A. Development Mode (with Hot-Reloading & Local Databases)
This setup spins up the databases (Postgres, Redis), Zookeeper/Kafka, and launches the microservices with hot-reloading (via mounted directories). It maps only the **Nginx** port to host machine on port `8080`.

1. Run the compose file:
   ```bash
   cd services
   docker compose -f docker-compose.dev.yml up -d
   ```
2. The databases, brokers, and services will launch. The chat service automatically runs `npx prisma migrate dev` during initialization to set up the DB schemas.

#### B. Production Mode
In production, database services (PostgreSQL, Redis) are typically run as managed instances (e.g. RDS, Neon, Upstash) and removed from the application cluster. The production compose builds minimized images (`prod` target) and runs Nginx on port `80`.

1. Ensure your `.env` files point to your production database and Redis URLs.
2. Build and run:
   ```bash
   cd services
   docker compose up -d
   ```
3. The chat service automatically runs `npx prisma migrate deploy` on startup to execute pending migrations.

---

### 3. Manual Local Setup (Alternative)

If you prefer to run services manually without Docker wrapping the Express servers:

1. Spin up base services (Database, Redis, Kafka):
   ```bash
   cd services
   # Start only the databases & brokers in docker
   docker compose -f docker-compose.dev.yml up -d postgres redis zookeeper kafka
   ```
2. For each microservice (`auth-service`, `user-service`, `chat-service`), install dependencies, run migrations, and start in dev mode:
   ```bash
   # Install dependencies
   npm install
   # Generate Prisma Client & Migrate
   npm run prisma:generate
   npm run prisma:migrate
   # Run
   npm run dev
   ```

---

### 4. Running the Frontend

In a separate terminal, start the React developer server:
```bash
cd frontend
npm install
npm run dev
```
Access the application at `http://localhost:5173`.

---

## 📡 API Endpoints Reference

All requests must route through Nginx at `http://localhost:8080/api/v1` (in Dev) or your host URL (in Prod).

### 🔒 Authentication Service (`/api/v1/auth/*`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Register a new user profile | No (Rate-Limited) |
| `POST` | `/api/v1/auth/login` | Login user and issue HTTPOnly cookies | No (Rate-Limited) |
| `POST` | `/api/v1/auth/refresh-tokens` | Renew access token via refresh token | No |
| `POST` | `/api/v1/auth/logout` | Revoke tokens & delete cookies | Yes |
| `POST` | `/api/v1/auth/change-password` | Update current password | Yes |

### 👤 User Service (`/api/v1/user/*`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/user/profile` | Get logged-in user profile details | Yes |
| `PATCH` | `/api/v1/user/profile` | Update profile details / upload avatar | Yes |
| `GET` | `/api/v1/user/search` | Search users by name or username | Yes |
| `DELETE` | `/api/v1/user/delete-account` | Delete user account & trigger S3/Cloudinary cleanup | Yes |

### 💬 Chat Service (`/*` or `/api/v1/messages/*` depending on routing)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/messages/conversations/direct` | Establish or load direct conversation | Yes |
| `POST` | `/api/v1/messages/` | Send message (supports text / file upload) | Yes (Rate-Limited) |
| `GET` | `/api/v1/messages/conversation-messages/:conversationId` | Get paginated message history | Yes |
| `GET` | `/api/v1/messages/recent-conversations` | Get recent conversations (Redis Cached) | Yes |
| `GET` | `/api/v1/messages/file-url` | Generate presigned URL for file download | Yes |

---

## 🔌 Real-Time Socket Events

Socket.io connects directly to Nginx at the root pathway `http://localhost:8080` (or `http://localhost` in production).

### Client $\rightarrow$ Server
*   `message_delivered`: Notifies that a message (by `messageId`) has reached the recipient's client.
*   `message_seen`: Notifies that a message (by `messageId`) has been explicitly viewed by the receiver.

### Server $\rightarrow$ Client
*   `message_sent`: Dispatched to the sender once their message has successfully cleared the Kafka pipeline and is saved.
*   `message_received`: Dispatched to active recipients when a new message is directed to their conversation.
*   `message_delivered_update`: Broadcasts a delivery timestamp update to the sender.
*   `message_seen_update`: Broadcasts a seen/read timestamp update to the sender.
*   `action_error`: Standard socket error emissions.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
