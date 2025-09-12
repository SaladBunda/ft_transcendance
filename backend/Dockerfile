# Use official Node.js image
FROM node:18

# Set working dir
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the backend source
COPY . .

# Build TypeScript
# RUN npx tsc

# Expose Fastify port
EXPOSE 3001

# Start server directly
# CMD ["node", "dist/server.js"]
CMD ["npm", "run", "dev"]
