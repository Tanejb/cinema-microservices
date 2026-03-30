"""
Consumes JSON messages from RabbitMQ and inserts audit documents into MongoDB.
"""

from __future__ import annotations

import json
import logging
import os
import signal
import sys
import time
from datetime import datetime, timezone

import pika
from pymongo import MongoClient

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("users-worker")


def _mongo_client() -> MongoClient:
    uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    return MongoClient(uri)


def _rabbit_params() -> pika.ConnectionParameters:
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
        heartbeat=600,
        blocked_connection_timeout=300,
    )


def main() -> None:
    queue_name = os.getenv("RABBITMQ_QUEUE", "user.events")
    db_name = os.getenv("DB_NAME", "users_db")

    mongo = _mongo_client()
    audit = mongo[db_name]["user_audit"]

    connection = None
    channel = None
    while connection is None:
        try:
            connection = pika.BlockingConnection(_rabbit_params())
            channel = connection.channel()
            channel.queue_declare(queue=queue_name, durable=True)
            channel.basic_qos(prefetch_count=10)
        except Exception as exc:
            logger.warning("RabbitMQ not ready yet, retrying in 2s: %s", exc)
            time.sleep(2)

    def on_message(
        ch: pika.channel.Channel,
        method: pika.spec.Basic.Deliver,
        _properties: pika.spec.BasicProperties,
        body: bytes,
    ) -> None:
        try:
            data = json.loads(body.decode("utf-8"))
            event_type = data.get("event_type", "unknown")
            payload = data.get("payload", {})
            occurred_at = data.get("occurred_at")

            doc = {
                "event_type": event_type,
                "payload": payload,
                "source_occurred_at": occurred_at,
                "received_at": datetime.now(timezone.utc),
            }
            audit.insert_one(doc)
            logger.info("Audit stored: %s user_id=%s", event_type, payload.get("user_id"))
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception:
            logger.exception("Failed to process message")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    channel.basic_consume(queue=queue_name, on_message_callback=on_message)
    logger.info("Worker consuming queue=%s db=%s", queue_name, db_name)

    def handle_sig(_signum, _frame):
        logger.info("Stopping consumer...")
        channel.stop_consuming()

    signal.signal(signal.SIGINT, handle_sig)
    signal.signal(signal.SIGTERM, handle_sig)

    try:
        channel.start_consuming()
    finally:
        try:
            connection.close()
        except Exception:
            pass
        mongo.close()
        logger.info("Worker stopped")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(0)
