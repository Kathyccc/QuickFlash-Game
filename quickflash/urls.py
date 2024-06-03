from django.urls import path, include
# from django.contrib.auth import views as auth_views
from quickflash import views

urlpatterns = [
    path('', views.home),
    path('register', views.register_action, name='register'),  
    path('login', views.login_action, name='login'),  
    path('logout', views.logout_action, name='logout'),
    path('final-scores', views.final_scores, name='final-scores'),
]