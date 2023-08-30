from django.contrib import admin

from .models import ChessGame, ChessGameBatch

# Register your models here.
class ChessGameInline(admin.TabularInline):
    model = ChessGame
    extra = 10  # number of empty forms displayed

class ChessGameBatchAdmin(admin.ModelAdmin):
    inlines = [ChessGameInline]


admin.site.register(ChessGameBatch, ChessGameBatchAdmin)
admin.site.register(ChessGame)