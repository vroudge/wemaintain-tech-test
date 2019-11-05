setup:
	docker-compose up -d
	@sleep 15s;
	@echo "Setting up Couchbase cluster..."
	@./util/db-setup.sh
	@echo "Done!"
	@echo "Waiting 30s for cluster rebalance to be done..."
	@sleep 30s;
	@echo "Done!"
	@echo "Creating indexes and inserting fixtures..."
	@CLI=true ./node_modules/.bin/ts-node util/fixtures/insert-fixtures.ts
	@echo "Done! All set and ready to go! 🚀"
	@echo "Run 'npm test' to run the tests or 'npm start' to run the server."