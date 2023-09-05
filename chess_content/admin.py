from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, ChessGame, ChessGameBatch, PlayedGame

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

admin.site.register(User, UserAdmin)
admin.site.register(ChessGameBatch, ChessGameBatchAdmin)
admin.site.register(ChessGame)
admin.site.register(PlayedGame)
