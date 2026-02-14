FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY index.html tsconfig.json tsconfig.app.json vite.config.ts ./
COPY src/ ./src/

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
