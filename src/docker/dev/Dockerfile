FROM node:alpine
RUN mkdir /app
WORKDIR /app
COPY *.json /app/
RUN npm ci && npm cache clean --force
COPY *.config.js *.config.cjs .npmrc /app/

ENV NODE_ENV=development
RUN npm run prepare
CMD npm run dev