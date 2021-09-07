FROM node:alpine
RUN mkdir /app
WORKDIR /app
COPY *.json /app/
RUN npm ci
COPY *.config.js *.config.cjs .npmrc /app/

ENV NODE_ENV=development
CMD npm run dev