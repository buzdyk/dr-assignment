# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-slim AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

FROM deps AS build
COPY . .
RUN npm run build

FROM base AS runtime
ENV NODE_ENV=production \
    NITRO_HOST=0.0.0.0 \
    NITRO_PORT=3455
COPY --from=build /app/.output ./.output
EXPOSE 3455
USER node
CMD ["node", ".output/server/index.mjs"]

FROM deps AS dev
ENV NODE_ENV=development \
    NUXT_HOST=0.0.0.0 \
    NUXT_PORT=3455
COPY . .
EXPOSE 3455
CMD ["npm", "run", "dev"]

FROM deps AS migrate
COPY db ./db
COPY kysely.config.ts ./
CMD ["npm", "run", "db:migrate"]
