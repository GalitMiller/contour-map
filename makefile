export HOST=localhost
export PORT=4200

.PHONY: install
install:
	npm install

.PHONY: run
run:
	export HOST=localhost
	npm start

.PHONY: start
start: run

.PHONY: all
all: install run

.PHONY: production
production:
	npm run build
	serve -s build
