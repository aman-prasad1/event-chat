FROM node:22-alpine AS dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY prisma ./prisma
RUN npx prisma generate

EXPOSE 8001

CMD ["npm", "run", "dev"]


# Production stage
FROM node:22-alpine as prod

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy prisma schema first (needed for generate)
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the source
COPY . .

EXPOSE 8001

# Run migrations then start the server
CMD ["node", "src/index.js"]