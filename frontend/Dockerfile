# Используем легковесный образ веб-сервера Nginx
FROM nginx:1.21-alpine

# Копируем наши статичные файлы (html, css, js) в папку,
# из которой Nginx будет их раздавать.
COPY . /usr/share/nginx/html