from django.db import models
from django.contrib.auth.models import User
import datetime

class GameSession(models.Model):
    players = models.ManyToManyField(User)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)

class PlayerScore(models.Model):
    game_session = models.ForeignKey(GameSession, on_delete=models.CASCADE)
    player = models.ForeignKey(User, on_delete=models.CASCADE)
    score_round1 = models.IntegerField(default=0)
    score_round2 = models.IntegerField(default=0)
    score_round3 = models.IntegerField(default=0)
    completed_round1 = models.DateTimeField(null=True, blank=True)
    completed_round2 = models.DateTimeField(null=True, blank=True)
    completed_round3 = models.DateTimeField(null=True, blank=True)

