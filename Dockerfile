FROM node:alpine
WORKDIR /src

RUN apk add --no-cache python3 py3-pip build-base

RUN apk add docker-cli

ADD ./backend /src/backend
ADD ./client /src/client
ADD ./app.js /src/app.js
RUN cd /src/backend && npm install
CMD ["node", "/src/app.js"]
EXPOSE 3230
