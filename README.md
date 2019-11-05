# WeMaintain tech test

### How to bootstrap 

- Ensure you have docker installed and that you are running Node LTS (`12.13.0` at the time of writing).
- Run `yarn`
- Run `make setup`.
- The Couchbase interface should be reachable on `http://localhost:8091/ui/index.html` once it's up and running, with `DBAdmin` and `admin123` as login and password. Nothing is persisted beyond the `docker-compose up` in order to not pollute your local machine. If you `docker-compose down`, you need to rerun `make setup`.

### Running tests

- Just run `npm test`. You need your environment to be bootstrapped with `make setup` beforehand.

### Running the app

- You can use `npm run dev` to run the application in a live-reloading `nodemon` daemon.
- Or you can use `npm start` to run the application using `ts-node`.

- Try `curl http://localhost:8080/concerts?latitude=52.5183113&longitude=13.4717676&radius=5 | jq` for a quick example ;)
