FROM node:0.12

ADD package.json /install/package.json
RUN cd /install && npm install
RUN mkdir -p /flipendo-api && cp -a /install/node_modules /flipendo-api/ && rm -rf /install

VOLUME ["~/.aws"]

COPY . /flipendo-api

WORKDIR /flipendo-api

EXPOSE 3000

ENV NODE_ENV=docker

CMD ["npm", "start"]
