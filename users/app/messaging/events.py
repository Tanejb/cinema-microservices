"""
User domain events — published to RabbitMQ queue `user.events`.

Worker process consumes messages and appends audit rows to MongoDB `user_audit`.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any

from app.messaging.rabbitmq import publish_json_to_queue

logger = logging.getLogger(__name__)


def publish_user_event(event_type: str, payload: dict[str, Any]) -> None:
    queue_name = os.getenv("RABBITMQ_QUEUE", "user.events")
    message = {
        "event_type": event_type,
        "payload": payload,
        "occurred_at": datetime.now(timezone.utc).isoformat(),
    }
    publish_json_to_queue(queue_name, message)
