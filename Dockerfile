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

# HACK To FIX Issue with basepath
RUN mkdir -p build/client/platform
RUN mv -f build/client/* build/client/platform/; exit 0
RUN mkdir -p build/static/platform
RUN mv -f build/static/* build/static/platform/; exit 0

VOLUME /app/static/uploads

CMD ["node", "build"]