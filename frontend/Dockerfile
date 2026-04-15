# -------------------------------------------------------
# Dockerfile for Frontend
#
# We use nginx (a fast web server) to serve the static
# HTML/CSS/JS files. No Node.js is needed at runtime.
# -------------------------------------------------------
FROM nginx:1.25-alpine
# Copy our HTML file into nginx's default serve folder
COPY index.html /usr/share/nginx/html/index.html
EXPOSE 80
# nginx starts automatically — no CMD needed
