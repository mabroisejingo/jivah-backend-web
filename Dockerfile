# Use Node.js as base image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Set environment variables for build time (can be overridden at runtime)
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --force

# Copy the entire application
COPY . .

# Build the application
RUN npm run build



# Expose the app port
EXPOSE 3000

# Start the NestJS app
CMD ["npm", "run", "start:prod"]
