# Fetching the minified node image on Alpine Linux
FROM node:slim

# Declaring env
ENV NODE_ENV development

# Setting up the work directory
WORKDIR /express-docker

# Copying the entire project directory
COPY . .

# Installing dependencies
RUN npm install

# Setting the working directory to src
WORKDIR /express-docker/src

# Starting our application
CMD [ "node", "index.js" ]

# Exposing server port
EXPOSE 5000