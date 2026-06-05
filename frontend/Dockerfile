FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.25-alpine

COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# Replace default Nginx port 80 with 5173 to match docker-compose.yml mappings
RUN sed -i 's/listen\(.*\)80;/listen 5173;/g' /etc/nginx/conf.d/default.conf

EXPOSE 5173

CMD ["nginx", "-g", "daemon off;"]
