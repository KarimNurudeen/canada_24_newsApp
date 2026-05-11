import json

from channels.generic.websocket import AsyncWebsocketConsumer


class NewsFeedConsumer(AsyncWebsocketConsumer):
    GROUP_NAME = "news_feed"

    async def connect(self):
        await self.channel_layer.group_add(self.GROUP_NAME, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.GROUP_NAME, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # Clients don't send messages on this channel — read-only feed
        pass

    async def news_article(self, event):
        """Called by channel layer when a new article is broadcast."""
        await self.send(text_data=json.dumps(event["article"]))
