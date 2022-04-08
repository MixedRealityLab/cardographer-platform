FROM node:alpine
RUN mkdir /app
WORKDIR /app
COPY *.json /app/
RUN npm ci
COPY *.config.js *.config.cjs .npmrc /app/
COPY static /app/static
COPY src /app/src
ENV NODE_ENV=production
RUN npm run build
EXPOSE 3000

# HACK To FIX Issue with basepath
# RUN mkdir build/client/platform
# RUN mv -f build/client/* build/client/platform/; exit 0
# RUN mkdir build/static/platform
# RUN mv -f build/static/* build/static/platform/; exit 0

VOLUME /app/static/uploads

CMD ["node", "build"]