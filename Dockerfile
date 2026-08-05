# Nexus web frontend - image for Docker/Render.
#
# Build stage: install deps + produce the static bundle.
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first (cache-friendly).
COPY package.json package-lock.json ./
RUN npm ci

# Build-time Vite env. Vite inlines VITE_* vars when `npm run build` runs, so
# these must exist in the build stage — never rely on an uncommitted .env being
# in the build context. Pass them as build args (docker-compose `build.args`,
# Render service env, or CI `--build-arg`); empty defaults keep auth disabled.
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_API_BASE_URL
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_API_BASE_URL=$VITE_API_BASE_URL

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
