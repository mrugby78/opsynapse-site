FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY package-lock.json ./
COPY --from=deps /app/node_modules ./node_modules
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
