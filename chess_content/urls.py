from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("memory_rush", views.memory_rush, name="memory_rush"),
    path("game_history", views.game_history, name="game_history"),
    path('put_submit_game', views.put_submit_game, name='put_submit_game'),
    path('post_start_game', views.post_start_game, name='post_start_game'),
    path('get_attempt_history', views.get_attempt_history, name='get_attempt_history'),
]   