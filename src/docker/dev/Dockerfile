FROM node:alpine
RUN mkdir /app
WORKDIR /app
COPY *.json /app/
COPY *.config.js *.config.cjs .npmrc /app/
RUN npm install && npm cache clean --force
COPY static /app/static
COPY src /app/src

ENV NODE_ENV=development
RUN npm run prepare
RUN npm run build
CMD npm run dev