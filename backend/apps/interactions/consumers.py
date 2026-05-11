import json

from channels.generic.websocket import AsyncWebsocketConsumer


class ReactionsConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.article_id = self.scope["url_route"]["kwargs"]["article_id"]
        self.group_name = f"reactions_{self.article_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        pass

    async def reaction_update(self, event):
        """Called by channel layer when reaction counts change for this article."""
        await self.send(text_data=json.dumps(event["data"]))
