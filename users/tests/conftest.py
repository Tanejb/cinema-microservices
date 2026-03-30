import os

# Unit tests must not open real RabbitMQ connections.
os.environ.setdefault("RABBITMQ_ENABLED", "false")
