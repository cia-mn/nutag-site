# Static pages (landing, guide, vendor sign-up, privacy policy, terms) for nutag.fun. No build step — nginx serves the files.
FROM nginx:alpine
COPY index.html ds.css style.css site.js favicon.svg /usr/share/nginx/html/
COPY fonts /usr/share/nginx/html/fonts
COPY img /usr/share/nginx/html/img
COPY en /usr/share/nginx/html/en
COPY ds /usr/share/nginx/html/ds
COPY privacy /usr/share/nginx/html/privacy
COPY terms /usr/share/nginx/html/terms
COPY guide /usr/share/nginx/html/guide
COPY vendor /usr/share/nginx/html/vendor
COPY map /usr/share/nginx/html/map
COPY o /usr/share/nginx/html/o
COPY .well-known /usr/share/nginx/html/.well-known
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
