FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 py3-pip build-base docker-cli

COPY . /app

RUN cd /app && npm install

RUN cd /app && npm run build

EXPOSE 8080

CMD ["npm", "run", "start:prod"]
