FROM node:12 as build

WORKDIR /app
RUN curl -o- -L https://yarnpkg.com/install.sh | bash

COPY package.json .
COPY tsconfig.json .
COPY yarn.lock .
RUN yarn --pure-lockfile --dev

COPY src ./src
RUN yarn run build

FROM node:12
WORKDIR /app
ENV DEBUG "true"
ENV BUCKET_NAME "default"
ENV CLUSTER_LOCATION "db:8091?detailed_errcodes=1"
ENV DB_LOGIN "DBAdmin"
ENV DB_PASSWORD "admin123"
COPY --from=build /app/package.json .
COPY --from=build /app/yarn.lock .
COPY --from=build /app/dist/. ./src

RUN yarn --pure-lockfile --production
USER node