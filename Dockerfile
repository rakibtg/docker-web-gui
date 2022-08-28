From node:alpine as base
ADD ./client /src/client
RUN cd /src/client && npm install && npm run build

FROM node:alpine
RUN apk add docker-cli
WORKDIR /src
ADD ./backend /src/backend
ADD ./app.js /src/app.js
RUN  apk add --no-cache --virtual .build_deps make python3 make g++ \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && cd /src/backend && npm install \
    && apk del .build_deps \
    && rm /usr/bin/python \
    && rm -rf /var/cache/apk/* \
    && rm -rf /src/backend/web
COPY --from=base /src/client/build /src/backend/web
CMD ["node", "/src/app.js"]
EXPOSE 3230
