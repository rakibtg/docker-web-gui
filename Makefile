IMAGE_NAME ?= docker-web-gui
IMAGE_TAG ?= latest
DOCKERHUB_USER ?=
IMAGE_REPO = $(DOCKERHUB_USER)/$(IMAGE_NAME)

build:
	docker-compose build

up:
	docker-compose up -d

up-non-daemon:
	docker-compose up

start:
	docker-compose start

stop:
	docker-compose stop

restart:
	docker-compose stop && docker-compose start

run-without-compose:
	docker run -p 8080:8080 -v /usr/local/bin/docker:/usr/local/bin/docker -v /var/run/docker.sock:/var/run/docker.sock $(IMAGE_NAME)

build-without-compose:
	docker build . -t $(IMAGE_NAME)

login:
	docker login

check-dockerhub-user:
	@if [ -z "$(DOCKERHUB_USER)" ]; then \
		echo "DOCKERHUB_USER is required (example: make publish DOCKERHUB_USER=yourname)"; \
		exit 1; \
	fi

tag: check-dockerhub-user
	docker tag $(IMAGE_NAME) $(IMAGE_REPO):$(IMAGE_TAG)

push: check-dockerhub-user
	docker push $(IMAGE_REPO):$(IMAGE_TAG)

publish: check-dockerhub-user build-without-compose tag push
