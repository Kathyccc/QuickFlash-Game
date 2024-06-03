from django.urls import path
from quickflash import consumers

websocket_urlpatterns = [
    path('quickflash/game_room', consumers.GameConsumer.as_asgi()),
]
