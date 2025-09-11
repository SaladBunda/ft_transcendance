# Use the official Node.js image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Initialize a new package.json file
RUN npm init -y

# Install Next.js, React, and React DOM
RUN npm install next react react-dom

# Install TypeScript and type definitions for React
RUN npm install --save-dev typescript @types/react @types/react-dom

# Copy the application code into the container
COPY . .

# Expose the port used by Next.js
EXPOSE 3000

# Start the Next.js development server
CMD ["npm", "run", "dev"]