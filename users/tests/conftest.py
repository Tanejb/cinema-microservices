import os
import sys
from pathlib import Path

# Unit tests must not open real RabbitMQ connections.
os.environ.setdefault("RABBITMQ_ENABLED", "false")

# Ensure `from app ...` imports work in local and CI runs.
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
