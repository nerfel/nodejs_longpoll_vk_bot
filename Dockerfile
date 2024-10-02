FROM node:17.9.1-alpine3.15

WORKDIR /usr/src/app

COPY . .

RUN npm install

CMD [ "node", "index.js" ]