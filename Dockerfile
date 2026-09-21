# Static pages (guide, privacy policy, terms) for nutag.fun. No build step — nginx serves the files.
FROM nginx:alpine
COPY index.html style.css /usr/share/nginx/html/
COPY privacy /usr/share/nginx/html/privacy
COPY terms /usr/share/nginx/html/terms
COPY guide /usr/share/nginx/html/guide
COPY vendor /usr/share/nginx/html/vendor
EXPOSE 80
