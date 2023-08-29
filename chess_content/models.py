from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission


class User(AbstractUser):
    groups = models.ManyToManyField(Group, blank=True, related_name="custom_user_groups")
    user_permissions = models.ManyToManyField(Permission, blank=True, related_name="custom_user_permissions")

class ChessGame(models.Model):
    fen_string = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)