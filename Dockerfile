# Use Node.js as base image
FROM node:18

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install --force

# Copy the Prisma schema
COPY prisma ./prisma

# Run Prisma commands (this will now have access to DATABASE_URL from the environment variables)
RUN npx prisma db push

# Copy the entire application
COPY . .

# Build the application
RUN npm run build

# Seed the database
RUN npm run db:seed

# Expose the app port
EXPOSE 3000

# Start the NestJS app
CMD ["npm", "run", "start:prod"]
