# Static pages (privacy policy, terms) for nutag.mn. No build step — nginx serves the files.
FROM nginx:alpine
COPY index.html style.css /usr/share/nginx/html/
COPY privacy /usr/share/nginx/html/privacy
COPY terms /usr/share/nginx/html/terms
EXPOSE 80
