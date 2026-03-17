# 1) Build frontend (Vite)
FROM node:20-alpine AS fe-build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Ha van public/sw.js, manifest, stb., Vite be fogja másolni a dist-be
RUN npm run build

# 2) Nginx, statikus + proxy
FROM nginx:1.27-alpine
# statikus fájlok
COPY --from=fe-build /app/dist /usr/share/nginx/html
# saját konfig
COPY nginx/default.conf /etc/nginx/conf.d/default.conf