# Web (React compilado, servido con nginx). Contexto de construcción: raíz del repositorio.
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
RUN npm ci -w apps/web --include-workspace-root
COPY apps/web apps/web
COPY content content

ARG GIT_COMMIT=dev
ARG BUILD_DATE=
ENV GIT_COMMIT=$GIT_COMMIT BUILD_DATE=$BUILD_DATE
RUN npm run build -w apps/web

FROM nginx:1.29-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
