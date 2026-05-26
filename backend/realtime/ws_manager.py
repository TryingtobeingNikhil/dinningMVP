"""
WebSocket Connection Manager — handles real-time group ordering sync.
One dict per table session. Broadcast cart updates to all connected clients.
"""
from fastapi import WebSocket
from typing import DefaultDict
from collections import defaultdict
import json


class ConnectionManager:
    def __init__(self):
        # table_id → list of active WebSocket connections
        self.active_connections: DefaultDict[str, list[WebSocket]] = defaultdict(list)
        # table_id → list of connected user display names
        self.table_users: DefaultDict[str, list[str]] = defaultdict(list)

    async def connect(self, websocket: WebSocket, table_id: str, user_name: str = "Guest") -> None:
        await websocket.accept()
        self.active_connections[table_id].append(websocket)
        if user_name not in self.table_users[table_id]:
            self.table_users[table_id].append(user_name)

        # Notify existing users that someone joined
        await self.broadcast(
            table_id,
            {
                "event": "session:user_joined",
                "data": {
                    "display_name": user_name,
                    "table_id": table_id,
                    "active_users": self.table_users[table_id],
                    "user_count": len(self.table_users[table_id]),
                },
            },
            exclude=websocket,
        )

    def disconnect(self, websocket: WebSocket, table_id: str, user_name: str = "Guest") -> None:
        conns = self.active_connections[table_id]
        if websocket in conns:
            conns.remove(websocket)
        users = self.table_users[table_id]
        if user_name in users:
            users.remove(user_name)

    async def broadcast(self, table_id: str, message: dict, exclude: WebSocket | None = None) -> None:
        """Send a message to all connections on the same table."""
        disconnected = []
        for connection in self.active_connections[table_id]:
            if connection is exclude:
                continue
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.append(connection)

        # Clean up dead connections
        for conn in disconnected:
            if conn in self.active_connections[table_id]:
                self.active_connections[table_id].remove(conn)

    async def send_personal(self, websocket: WebSocket, message: dict) -> None:
        await websocket.send_text(json.dumps(message))

    def get_user_count(self, table_id: str) -> int:
        return len(self.table_users[table_id])

    def get_users(self, table_id: str) -> list[str]:
        return self.table_users[table_id]


# Global singleton
manager = ConnectionManager()
