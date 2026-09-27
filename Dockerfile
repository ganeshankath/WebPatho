FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY public ./public
COPY src ./src
COPY tailwind.config.js ./
RUN npm run build

FROM node:26-alpine
ENV NODE_ENV=production PORT=9000 DATABASE_PATH=/data/circular-visit.sqlite
WORKDIR /app
COPY --from=build /app/build ./build
COPY server ./server
RUN mkdir -p /data && chown node:node /data
USER node
EXPOSE 9000
CMD ["node", "server/index.js"]
