from django.db import models
from django.contrib.auth.models import AbstractUser, Group, Permission


class User(AbstractUser):
    groups = models.ManyToManyField(Group, blank=True, related_name="custom_user_groups")
    user_permissions = models.ManyToManyField(Permission, blank=True, related_name="custom_user_permissions")

class ChessGameBatch(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    # Displayed name in the Django Admin Panel categories
    class Meta:
        verbose_name = "Multiple Fen Strings"
        verbose_name_plural = "Add Multiple Fen Strings"

    def __str__(self):
        formatted_timestamp = self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        return f"[ {self.name} ] [ Created at: {formatted_timestamp} ]"

class ChessGame(models.Model):
    batch = models.ForeignKey(ChessGameBatch, related_name='games', on_delete=models.CASCADE, null=True)
    fen_string = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    # Displayed name in the Django Admin Panel categories
    class Meta:
        verbose_name = "a Fen String"
        verbose_name_plural = "FEN STRINGS"    

    def __str__(self):
        formatted_timestamp = self.created_at.strftime("%Y-%m-%d %H:%M:%S")
        return f"[ {self.fen_string} ] [ Created at: {formatted_timestamp} ]"

class PlayedGame(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    chess_game = models.ForeignKey(ChessGame, related_name='played_games', on_delete=models.CASCADE)
    success = models.BooleanField(default=False)
    game_is_on = models.BooleanField(default=False)
    played_at = models.DateTimeField(null=True, blank=True)
    error_count =  models.IntegerField(null=True, blank=True)
    round_number =  models.IntegerField(null=True, blank=True)
    gotCorrectRoundNumber = models.IntegerField(null=True, blank=True)
    chosenDifficulty = models.CharField(max_length=100, blank=True)
    fen_str = models.CharField(max_length=250, blank=True)

    def get_status(self):
        if self.game_is_on:
            return f"Game is on, error count: {self.error_count}"
        elif not self.game_is_on and not self.success:
            return f"Success: ❌ Game is over"
        elif not self.game_is_on and self.success:
            return f"Success: ✅, Got successful in {self.gotCorrectRoundNumber} rounds"

    def __str__(self):
        return f"User: {self.user.username}, Game: {self.chess_game.fen_string}, Status: {self.get_status()}, Difficulty: {self.chosenDifficulty}"

class AttemptHistory(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    played_game = models.ForeignKey(PlayedGame, related_name='attempts', on_delete=models.CASCADE)
    fen_string = models.CharField(max_length=100)
    success = models.BooleanField(default=False)
    game_is_on = models.BooleanField(default=False)
    played_at = models.DateTimeField(null=True, blank=True)
    total_round_number =  models.IntegerField(null=True, blank=True)
    chosenDifficulty = models.CharField(max_length=100, blank=True)
    round_data = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.played_game}"
