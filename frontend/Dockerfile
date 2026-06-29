FROM node:16-alpine AS builder

# /api is proxied to the backend by nginx — no hardcoded host needed
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN apk add --no-cache zip

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .

# Bundle the LinkedIn browser extension as a downloadable zip served from public/
COPY browser-extension/ /tmp/browser-extension/
RUN cd /tmp && zip -rq /app/public/careerforge-extension.zip browser-extension

RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
