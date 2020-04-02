FROM node:10

WORKDIR /usr/src/app

RUN apt-get update && apt-get -y install ffmpeg

COPY package*.json ./
RUN npm install
COPY start.js ./

CMD [ "node", "start.js" ]
