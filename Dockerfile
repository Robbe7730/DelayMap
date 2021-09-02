FROM node:16
WORKDIR /app
ADD . /app/
RUN npm install
RUN npm run build
ENV NODE_ENV="production"
ENTRYPOINT node serve.js
