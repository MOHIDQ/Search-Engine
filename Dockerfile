FROM node:14

# create app directory 
WORKDIR /usr/src/app

#install dependencies, added * for package-lock.json are installed too
COPY package*.json ./

#run command to actually install the dependencies
RUN npm install

COPY . .

EXPOSE 8080
CMD [ "node", "server.js" ]