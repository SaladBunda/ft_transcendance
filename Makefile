# Variables
COMPOSE_FILE = docker-compose.yml

# Rules
up:
	@echo "Starting all services..."
	docker-compose -f $(COMPOSE_FILE) up -d

down:
	@echo "Stopping all services..."
	docker-compose -f $(COMPOSE_FILE) down

clean:
	@echo "Removing stopped containers..."
	docker-compose -f $(COMPOSE_FILE) rm -f

fclean: down clean
	@echo "Stopping all running containers..."
	-docker stop $$(docker ps -q) 2>/dev/null || true
	@echo "Removing all containers..."
	-docker rm -f $$(docker ps -aq) 2>/dev/null || true
	@echo "Removing all images..."
	-docker rmi -f $$(docker images -q) 2>/dev/null || true

re: down fclean up
	@echo "Rebuilt and started services."