# Nexus web frontend - image for Docker/Render/Koyeb.
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

# Serve stage: nginx hosts the static bundle and proxies /api + /health to the
# Go backend. The backend target is injected at runtime through BACKEND_URL:
# the official nginx entrypoint envsubst-renders the template into
# /etc/nginx/conf.d/default.conf before starting. Default (http://api:8080)
# keeps the local docker-compose network working unchanged.
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template
ENV BACKEND_URL=http://api:8080
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
