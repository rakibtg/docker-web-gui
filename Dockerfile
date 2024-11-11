# Use Node.js 18 (LTS) as the base image for stability and ES module support
FROM node:18-alpine

# Set the working directory
WORKDIR /src

# Install Python, pip, and build tools in one RUN command
RUN apk add --no-cache python3 py3-pip build-base docker-cli

# Copy application files to the container
COPY ./backend /src/backend
COPY ./client /src/client
COPY ./app.js /src/app.js

# Install backend dependencies
RUN cd /src/backend && npm install

# Expose the application port
EXPOSE 3230

# Run the application
CMD ["node", "/src/app.js"]
