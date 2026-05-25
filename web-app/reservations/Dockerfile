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
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 4314
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4314"]
