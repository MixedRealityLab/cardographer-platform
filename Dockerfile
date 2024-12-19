FROM node:alpine
RUN mkdir /app
WORKDIR /app
COPY *.json /app/
COPY *.config.js *.config.cjs .npmrc /app/
RUN npm install && npm cache clean --force
COPY static /app/static
COPY src /app/src

ENV NODE_ENV=production
RUN npm run prepare
RUN npm run build
EXPOSE 3000

VOLUME /app/uploads

CMD ["node", "src/myserver.js"]