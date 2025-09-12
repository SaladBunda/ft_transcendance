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

fclean: clean
	@echo "Removing all images..."
	docker rmi -f $$(docker images -q)

re: fclean up
	@echo "Rebuilt and started services."