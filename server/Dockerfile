# # --- build stage: TS -> JS ---
# FROM node:20-alpine AS build
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci                         # kell a devDependencies is a buildhez
# COPY tsconfig.json ./
# COPY src ./src
# RUN npm run build                  # -> dist/

# # --- runtime stage: csak prod dep + dist ---
# FROM node:20-alpine
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci --omit=dev              # csak production dep-ek
# COPY --from=build /app/dist ./dist
# ENV NODE_ENV=production
# ENV PORT=3001
# EXPOSE 3001
# CMD ["node","dist/server.js"]

# build stage
# --- build stage: TS -> JS ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build   # -> dist/

# --- runtime stage ---
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001
CMD ["node","dist/start-http.js"]