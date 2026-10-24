FROM nginx:1.28-alpine
ARG REVISION_SHA
LABEL org.opencontainers.image.revision=$REVISION_SHA

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
RUN rm -rf /usr/share/nginx/html/*
COPY *.html *.css *.js *.jpg *.png /usr/share/nginx/html/
COPY image/ /usr/share/nginx/html/image/

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
EXPOSE 8080
