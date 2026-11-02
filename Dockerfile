FROM nginx:1.31.8-alpine3.24@sha256:785835ea65db4bba6f021acc0f3be91b0fef76a53fe41f8588c6698d2aed0606
ARG REVISION_SHA
LABEL org.opencontainers.image.revision=$REVISION_SHA

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
RUN apk upgrade --no-cache && rm -rf /usr/share/nginx/html/*
COPY *.html *.css *.js *.jpg *.png /usr/share/nginx/html/
COPY image/ /usr/share/nginx/html/image/

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
EXPOSE 8080
