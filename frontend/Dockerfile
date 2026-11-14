# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci
COPY . .
ARG VITE_API_V1_URL=/api/v1
ARG VITE_WS_URL=/ws
ENV VITE_API_V1_URL=$VITE_API_V1_URL
ENV VITE_WS_URL=$VITE_WS_URL
RUN npm run build

FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
