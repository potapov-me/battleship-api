FROM node:22.2-slim AS development

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

FROM node:22.2-slim AS production

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

# Update and upgrade system packages to reduce vulnerabilities
RUN apt-get update && apt-get upgrade -y && apt-get clean

COPY package*.json ./

RUN npm install --production

COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]
