from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("memory_rush", views.memory_rush, name="memory_rush"),
    path('get_fen_list/', views.get_fen_list, name='get_fen_list')
]