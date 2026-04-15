build:
    npx rolldown -c

format:
    npx prettier -w .

lint:
    npx eslint
    npx prettier -c .
    npx tsc --noEmit
    just build
    npx web-ext lint -s dist --self-hosted

run:
    just build
    cd dist && npx web-ext run --start-url www.scribblehub.com --devtools
