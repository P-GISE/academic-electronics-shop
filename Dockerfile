FROM nginx:1.30.6-alpine3.24@sha256:47928bf67eb62a1863cb08d9ecb52d3e704304ba614eaee17884204677702951
ARG REVISION_SHA
LABEL org.opencontainers.image.revision=$REVISION_SHA

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
RUN apk upgrade --no-cache && rm -rf /usr/share/nginx/html/*
COPY *.html *.css *.js *.jpg *.png /usr/share/nginx/html/
COPY image/ /usr/share/nginx/html/image/

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
EXPOSE 8080
