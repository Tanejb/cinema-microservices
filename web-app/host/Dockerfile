FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_REMOTE_MOVIES=http://localhost:4311/assets/remoteEntry.js
ARG VITE_REMOTE_USERS=http://localhost:4312/assets/remoteEntry.js
ARG VITE_REMOTE_SCREENINGS=http://localhost:4313/assets/remoteEntry.js
ARG VITE_REMOTE_RESERVATIONS=http://localhost:4314/assets/remoteEntry.js
ENV VITE_REMOTE_MOVIES=$VITE_REMOTE_MOVIES
ENV VITE_REMOTE_USERS=$VITE_REMOTE_USERS
ENV VITE_REMOTE_SCREENINGS=$VITE_REMOTE_SCREENINGS
ENV VITE_REMOTE_RESERVATIONS=$VITE_REMOTE_RESERVATIONS
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN printf "VITE_REMOTE_MOVIES=%s\nVITE_REMOTE_USERS=%s\nVITE_REMOTE_SCREENINGS=%s\nVITE_REMOTE_RESERVATIONS=%s\n" \
    "$VITE_REMOTE_MOVIES" "$VITE_REMOTE_USERS" "$VITE_REMOTE_SCREENINGS" "$VITE_REMOTE_RESERVATIONS" \
    > .env.production
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=.openshiftapps.com
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
# Intentionally do NOT copy vite.config.js: on OpenShift the random UID cannot write
# the timestamp cache that vite creates next to the config. allowedHosts is supplied
# via __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS env var instead.
EXPOSE 4310
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4310"]
