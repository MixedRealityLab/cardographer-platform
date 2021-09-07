FROM node:alpine
RUN apk add rsync
CMD while :; do rsync -ravu --delete /dev/src/ /app/src/; rsync -ravu --delete /dev/static/ /app/static/; sleep 1s; done;