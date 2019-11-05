#WeMaintain tech test

### How to bootstrap 

- Ensure you have docker installed and that you are running Node LTS (`12.13.0` at the time of writing).
- Run `yarn`
- Run `docker-compose up -d`. The Couchbase interface should be reachable on `http://localhost:8091/ui/index.html` once it's up and running.
- Run `npm run setup && npm run apply-fixtures` to bootstrap the Couchbase cluster and create the provided fixtures for this tech test.
- You're all set! Just run `npm start` to run the app. It is served by default on `8080`