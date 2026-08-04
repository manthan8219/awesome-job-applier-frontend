# Nexus web frontend - image for Docker/Render.
#
# Build stage: install deps + produce the static bundle.
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first (cache-friendly).
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build the production bundle (tsc + vite).
COPY . .
RUN npm run build

# Serve stage: nginx hosts the static bundle and proxies /api + /health to
# the Go backend over the compose network (service name "api").
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
