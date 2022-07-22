FROM node:alpine
RUN mkdir /app
WORKDIR /app
COPY *.json /app/
RUN npm install && npm cache clean --force
COPY *.config.js *.config.cjs .npmrc /app/
COPY static /app/static
COPY src /app/src

ENV NODE_ENV=production
RUN npm run build
EXPOSE 3000

VOLUME /app/static/uploads

CMD ["node", "build"]