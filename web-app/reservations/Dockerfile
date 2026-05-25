FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app
ARG VITE_API_GATEWAY_WEB=http://localhost:8080
ENV VITE_API_GATEWAY_WEB=$VITE_API_GATEWAY_WEB
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV __VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS=.openshiftapps.com
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/vite.config.js ./vite.config.js
RUN chgrp -R 0 /app && chmod -R g+rwX /app
USER 1001
EXPOSE 4314
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4314"]
