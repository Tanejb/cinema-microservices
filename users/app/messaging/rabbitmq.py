"""
RabbitMQ helpers — publish JSON to a durable queue (default exchange).
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import pika

logger = logging.getLogger(__name__)


def _rabbitmq_enabled() -> bool:
    v = os.getenv("RABBITMQ_ENABLED", "true").lower()
    return v not in ("0", "false", "no", "off")


def _connection_params() -> pika.ConnectionParameters:
    url = os.getenv("RABBITMQ_URL", "").strip()
    if url:
        return pika.URLParameters(url)
    host = os.getenv("RABBITMQ_HOST", "localhost")
    port = int(os.getenv("RABBITMQ_PORT", "5672"))
    user = os.getenv("RABBITMQ_USER", "guest")
    password = os.getenv("RABBITMQ_PASSWORD", "guest")
    vhost = os.getenv("RABBITMQ_VHOST", "/")
    credentials = pika.PlainCredentials(user, password)
    return pika.ConnectionParameters(
        host=host,
        port=port,
        virtual_host=vhost,
        credentials=credentials,
        connection_attempts=2,
        retry_delay=1,
        socket_timeout=5,
    )


def publish_json_to_queue(queue_name: str, body: dict[str, Any]) -> None:
    if not _rabbitmq_enabled():
        logger.debug("RabbitMQ disabled, skip publish: %s", body)
        return

    params = _connection_params()
    connection = pika.BlockingConnection(params)
    try:
        channel = connection.channel()
        channel.queue_declare(queue=queue_name, durable=True)
        channel.basic_publish(
            exchange="",
            routing_key=queue_name,
            body=json.dumps(body, default=str),
            properties=pika.BasicProperties(
                content_type="application/json",
                delivery_mode=2,
            ),
        )
        logger.info("Published message to queue %s", queue_name)
    except Exception:
        logger.exception("Failed to publish to RabbitMQ; event not delivered")
    finally:
        try:
            connection.close()
        except Exception:
            pass
