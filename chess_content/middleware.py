from .models import User, ChessGame, PlayedGame
import json
import sys

class AutoFailGameMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)   
        
        if request.session.get('game_in_progress') and 'game_fen' in request.session:
            # Mark the game as failed
            user = request.user
            FENcode = request.session.get('game_fen')
            try:
                chess_game = ChessGame.objects.get(fen_string=FENcode)
            except ChessGame.DoesNotExist:
                return response
            chosenDifficulty = request.session.get('chosenDifficulty', None)  # Use a default value if it's not set

            
            PlayedGame.objects.create(
                user=user, 
                chess_game=chess_game, 
                success=False,
                chosenDifficulty=chosenDifficulty
            )

            # Clear session variables
            request.session['game_in_progress'] = False
            del request.session['game_fen']
        
        return response
