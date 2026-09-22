# Static pages (landing, guide, vendor sign-up, privacy policy, terms) for nutag.fun. No build step — nginx serves the files.
FROM nginx:alpine
COPY index.html style.css site.js favicon.svg /usr/share/nginx/html/
COPY fonts /usr/share/nginx/html/fonts
COPY img /usr/share/nginx/html/img
COPY en /usr/share/nginx/html/en
COPY privacy /usr/share/nginx/html/privacy
COPY terms /usr/share/nginx/html/terms
COPY guide /usr/share/nginx/html/guide
COPY vendor /usr/share/nginx/html/vendor
EXPOSE 80
