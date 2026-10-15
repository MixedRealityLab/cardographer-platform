FROM node:alpine
RUN mkdir /app
WORKDIR /app
COPY *.config.*s *.json .npmrc /app/
RUN npm ci && npm cache clean --force
COPY static /app/static
COPY src /app/src

ENV NODE_ENV=production
RUN npm run build

CMD node build