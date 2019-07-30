FROM node:10.16

COPY package.json package-lock.json /app/
WORKDIR /app

RUN npm i && rm -rf /root/.node-gyp /root/.npm

COPY . /app/

CMD ["npm", "start"]
