from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, ChessGame, ChessGameBatch, PlayedGame, AttemptHistory

class ChessGameBatchForm(forms.ModelForm):
    fen_strings = forms.CharField(widget=forms.Textarea, required=False)
    
    class Meta:
        model = ChessGameBatch
        fields = "__all__"

class ChessGameBatchAdmin(admin.ModelAdmin):
    form = ChessGameBatchForm
    
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        fen_strings = form.cleaned_data.get('fen_strings', "").strip()
        
        if fen_strings:
            fens = fen_strings.split("\n")
            for fen in fens:
                ChessGame.objects.create(batch=obj, fen_string=fen.strip())

# For display purposes inside the PlayedGame module
class PlayedGameAdmin(admin.ModelAdmin):
    list_display = ('user', 'chess_game', 'get_status_display', 'chosenDifficulty', 'played_at',)
    list_filter = ('user', 'success', 'played_at')
    search_fields = ('user__username', 'chess_game__fen_string')

    def get_status_display(self, obj):
        return obj.get_status()
    get_status_display.short_description = 'Status'

# View and manage PlayedGame records directly from the User's admin page
class PlayedGameInline(admin.TabularInline):
    model = PlayedGame
    extra = 0

# Show related PlayedGame records when viewing a User in the admin page
class CustomUserAdmin(UserAdmin):
    inlines = [PlayedGameInline]

admin.site.register(User, CustomUserAdmin)
admin.site.register(ChessGameBatch, ChessGameBatchAdmin)
admin.site.register(ChessGame)
admin.site.register(PlayedGame, PlayedGameAdmin)
admin.site.register(AttemptHistory)