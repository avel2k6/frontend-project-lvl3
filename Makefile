install:
	npm install

publish:
	npm publish --dry-run

lint:
	npx eslint .

test:
	npm test

watch:
	npx jest --watch

build:
	npm run build
