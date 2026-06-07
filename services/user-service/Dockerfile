FROM node:20-alpine

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

EXPOSE 8002

# Run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]