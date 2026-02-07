FROM node:24

COPY package.json package-lock.json /app/
WORKDIR /app

RUN npm i && rm -rf /root/.node-gyp /root/.npm

COPY . /app/

CMD ["npm", "run", "dev", "--", "--host"]
