from unittest.mock import MagicMock, patch

from app.messaging.rabbitmq import publish_json_to_queue


@patch("app.messaging.rabbitmq.pika.BlockingConnection")
def test_publish_json_sends_to_queue(mock_conn, monkeypatch):
    monkeypatch.setenv("RABBITMQ_ENABLED", "true")
    mock_ch = MagicMock()
    mock_conn.return_value.channel.return_value = mock_ch

    publish_json_to_queue("test.q", {"a": 1})

    mock_ch.queue_declare.assert_called_once_with(queue="test.q", durable=True)
    mock_ch.basic_publish.assert_called_once()
    args, kwargs = mock_ch.basic_publish.call_args
    assert kwargs["routing_key"] == "test.q"
    body = kwargs["body"]
    if isinstance(body, bytes):
        body = body.decode("utf-8")
    assert '"a": 1' in body


def test_publish_skipped_when_disabled(monkeypatch):
    monkeypatch.setenv("RABBITMQ_ENABLED", "false")
    with patch("app.messaging.rabbitmq.pika.BlockingConnection") as mock_conn:
        publish_json_to_queue("test.q", {"x": 1})
    mock_conn.assert_not_called()
