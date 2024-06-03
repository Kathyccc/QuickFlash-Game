"""
ASGI config for webapps project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
"""

import os

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'webapps.settings')

application = get_asgi_application()

import quickflash.routing

application = ProtocolTypeRouter({
    "http": application,
    # urls.py routes for http are added by default
    'websocket': AuthMiddlewareStack(
        URLRouter( quickflash.routing.websocket_urlpatterns
        ) 
    ),
})