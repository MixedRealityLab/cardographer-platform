FROM node:alpine
RUN mkdir /app
WORKDIR /app
COPY package.json /app/
COPY package-lock.json /app/
ENV NODE_ENV=development
RUN npm install
COPY *.config.js *.config.cjs tsconfig.json .npmrc /app/
CMD ["npm", "run", "dev"]
#Before creating a production version of your app, install an [adapter](https://kit.svelte.dev/docs#adapters) for your target environment. Then: npm run build.
#preview with npm run preview
#CMD ["/bin/sh"]
