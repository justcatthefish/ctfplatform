FROM node:13 as builder
WORKDIR /frontend
COPY ./frontend/package.json /frontend/package.json
RUN yarn
COPY ./frontend /frontend
RUN npm run build:prod


FROM openresty/openresty:alpine
RUN rm /etc/nginx/conf.d/default.conf
COPY ./nginx/web.conf /etc/nginx/conf.d/web.conf
COPY ./nginx/admin.conf /etc/nginx/conf.d/admin.conf
COPY --from=builder /frontend/dist /frontend
