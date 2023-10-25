from django.shortcuts import render, redirect
from django.db import IntegrityError
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.urls import reverse
from django.contrib import messages
from django.db.models import Max
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger
import pytz
import json
import random
import datetime

from .models import User, ChessGame, PlayedGame, AttemptHistory

DIFFICULTIES = {
    'easy': {'countdown': 10, 'round': 10},
    'medium': {'countdown': 5, 'round': 5},
    'hard': {'countdown': 3, 'round': 3},
}

def catch_all(request):
    return HttpResponseRedirect(reverse("home"))

def home(request):
    # return redirect(request, "chess_content/memory_rush.html")
    message = request.session.get('message', None)
    message_type = request.session.get('message_type', None)

    if message: 
        del request.session['message']
    if message_type:
        del request.session['message_type']
    return HttpResponseRedirect(reverse("memory_rush"))

def game_history(request):
    # Get the latest attempt for each game
    latest_attempts = AttemptHistory.objects.filter(user=request.user).values('played_game').annotate(latest_played=Max('played_at'))

    # Order the games by the latest attempt
    seen_games = PlayedGame.objects.filter(user=request.user, id__in=[item['played_game'] for item in latest_attempts]).annotate(latest_played=Max('attempts__played_at')).order_by('-latest_played')

    # Create a Paginator object
    paginator = Paginator(seen_games, 12)  # Show 12 games per page

    page = request.GET.get('page')
    try:
        games = paginator.page(page)
    except PageNotAnInteger:
        # If page is not an integer, deliver first page.
        games = paginator.page(1)
    except EmptyPage:
        # If page is out of range, deliver last page of results.
        games = paginator.page(paginator.num_pages)

    fen_data = []
    for game in games:
        attempts = game.attempts.all()
        attempts_data = [
            {
                'round_data': attempt.round_data
            }
            for attempt in attempts
        ]

        if game.game_is_on:
            fen_data.append({
                'success': game.success,
                'played_at': game.played_at,
                'game_is_on': game.game_is_on,
                'error_count': game.error_count,
                'gotCorrectRoundNumber': game.gotCorrectRoundNumber,
                'chosenDifficulty': game.chosenDifficulty,
                'attempts': attempts_data
            })
        else:
            fen_data.append({
                'fen_string': game.chess_game.fen_string,
                'success': game.success,
                'played_at': game.played_at,
                'game_is_on': game.game_is_on,
                'error_count': game.error_count,
                'gotCorrectRoundNumber': game.gotCorrectRoundNumber,
                'chosenDifficulty': game.chosenDifficulty,
                'attempts': attempts_data
            })

    more_games = seen_games.count() > 12
    return render(request, "chess_content/game_history.html", {'fen_data': fen_data, 'page': page, 'more_games': more_games, 'has_next_page': games.has_next()})

def get_attempt_history(request):
    if request.method == 'GET':
        user = request.user
        difficulty = request.GET.get('difficulty', None)
        fen_string = request.GET.get('fen_string', None)

        # Retrieve the AttemptHistory record for ongoing games and finished games
        if (fen_string != None ):
            attempt_history = AttemptHistory.objects.filter(user=user, fen_string=fen_string).first()
        else:
            attempt_history = AttemptHistory.objects.filter(
                user=user, 
                chosenDifficulty=difficulty,
            ).last()
        if attempt_history:
            results = []
            if attempt_history.game_is_on == False:
                new_round_data = []

                for round_info in attempt_history.round_data:
                    new_round = round_info.copy()  # Copy the original round_info to make changes to it
                    user_fen_string = round_info['fen_string']
                    if user_fen_string != "abandoned":
                        user_fen_sorted = fen_to_board(user_fen_string)
                        user_fen_sorted = sorted(user_fen_sorted, key=lambda x: (x['square'], x['name']))

                        correct_fen_sorted = fen_to_board(fen_string)
                        correct_fen_sorted = sorted(correct_fen_sorted, key=lambda x: (x['square'], x['name']))

                        actual_correct_pieces, wrong_pieces, missing_pieces = compare_pieces(user_fen_sorted, correct_fen_sorted)
                        
                        # Convert lists to FEN
                        actual_correct_pieces_fen = list_to_fen(actual_correct_pieces)
                        wrong_pieces_fen = list_to_fen(wrong_pieces)
                        missing_pieces_fen = list_to_fen(missing_pieces)
                        
                        new_round['fen_string'] = f"correct_pieces: {actual_correct_pieces_fen}, wrong_pieces: {wrong_pieces_fen}, missing_pieces: {missing_pieces_fen}"
                    else:
                        # For abandoned rounds, keep the 'fen_string' as "abandoned"
                        new_round['fen_string'] = "abandoned"
                        
                    new_round_data.append(new_round)
            else:
                new_round_data = attempt_history.round_data
            return JsonResponse({
                'round_data': new_round_data,
                'total_round_number': attempt_history.total_round_number,
                'game_is_on': attempt_history.game_is_on,
                'chosenDifficulty': attempt_history.chosenDifficulty
            })
        else:
            return JsonResponse({
                'round_data': [],
            })

def compare_pieces(user_pieces, correct_pieces):
    actual_correct_pieces = [piece for piece in user_pieces if piece in correct_pieces]
    wrong_pieces = [piece for piece in user_pieces if piece not in correct_pieces]
    
    for piece in actual_correct_pieces:
        correct_pieces.remove(piece)
        
    missing_pieces = correct_pieces
    
    return actual_correct_pieces, wrong_pieces, missing_pieces

def memory_rush(request):
    white_piece_filenames = ['wk.png', 'wq.png', 'wr.png', 'wb.png', 'wn.png', 'wp.png']
    black_piece_filenames=  ['bk.png', 'bq.png', 'br.png', 'bb.png', 'bn.png', 'bp.png']
    video_names = ['easy', 'medium', 'hard']

    message = request.session.get('message', None)
    message_type = request.session.get('message_type', None)

    if message: 
        del request.session['message']
    if message_type:
        del request.session['message_type']

    return render(request, 'chess_content/memory_rush.html', 
                  {'black_piece_filenames': black_piece_filenames,
                   'white_piece_filenames': white_piece_filenames,
                   'video_names': video_names,
                   'message': message,
                   'message_type': message_type 
                   })

@csrf_exempt
def post_start_game(request):
    if request.method == 'POST':
        if not request.user.is_authenticated:
            messages.info(request, "You have to log in to play.")
            return JsonResponse({'status': 'unauthenticated'}, status=401)
        
        data = json.loads(request.body.decode('utf-8'))
        user = request.user
        chosenDifficulty = data['chosenDifficulty']
        timezone_offset_minutes = data.get('timezoneOffset')

        if timezone_offset_minutes is not None:
            timezone = pytz.timezone('UTC')
            utc_dt = datetime.datetime.now().replace(tzinfo=timezone)
            local_dt = utc_dt - datetime.timedelta(minutes=timezone_offset_minutes)
        else:
            local_dt = datetime.datetime.now()

        # Check if the user has any games with game_is_on=True and matching chosenDifficulty
        ongoing_games = PlayedGame.objects.filter(user=user, game_is_on=True, chosenDifficulty=chosenDifficulty)
        random_FEN = None
        error_count = 0

        # If no ongoing games exist, proceed with creating a new game.
        if not ongoing_games.exists():
            # Get random unseen ChessGame's FEN string for the user
            fen_list = [game.fen_string for game in ChessGame.objects.exclude(
                id__in=PlayedGame.objects.filter(user=request.user).values_list('chess_game_id', flat=True)
            )]
            random_FEN = random.choice(fen_list) if fen_list else None
            chess_game = ChessGame.objects.get(fen_string=random_FEN)
            round_number = DIFFICULTIES.get(chosenDifficulty, {}).get('round', 'unknown')
            ongoing_game = PlayedGame.objects.create(
                user=user, 
                chess_game=chess_game, 
                success=False,
                game_is_on=True,
                round_number=round_number,
                error_count=error_count,
                chosenDifficulty=chosenDifficulty,
                fen_str=random_FEN,
                played_at=local_dt
            )
        else:
            # Retrieve fen_str from the ongoing game
            ongoing_game = ongoing_games.filter(chosenDifficulty=chosenDifficulty).first()
            
            random_FEN = ongoing_game.fen_str
            error_count = ongoing_game.error_count

            # Fetch the corresponding AttemptHistory record for ongoing_game
            attempt_history = AttemptHistory.objects.get(
                user=user,
                played_game=ongoing_game
            )

            # Initialize the variable to hold the latest fen_string that's not 'abandoned'
            latest_attempt_fen = None

            # Loop through the round_data list starting from the last element
            for round_info in reversed(attempt_history.round_data):
                if round_info['fen_string'] != 'abandoned':
                    latest_attempt_fen = round_info['fen_string']
                    break
                
        error_for_json = error_count
        countdown = DIFFICULTIES.get(chosenDifficulty, {}).get('countdown', 'unknown')
        round_number = DIFFICULTIES.get(chosenDifficulty, {}).get('round', 'unknown')

        # Increment the error count by 1 to account for potential game abandonment by the user
        request.session['game_fen'] = ongoing_game.fen_str
        ongoing_game.error_count += 1
        ongoing_game.save()
        if (ongoing_game.error_count == ongoing_game.round_number):
            ongoing_game.success = False
            ongoing_game.game_is_on = False
            ongoing_game.save()

        # Fetch existing or create new AttemptHistory record
        attempt_history, created = AttemptHistory.objects.get_or_create(
            user=user,
            played_game=ongoing_game,
            defaults={
                'fen_string': random_FEN,
                'game_is_on': True,
                'total_round_number': ongoing_game.round_number,
                'chosenDifficulty': chosenDifficulty,
                'round_data': []
            }
        )

        set_round_data = {
            'round_number': ongoing_game.error_count,
            'fen_string': "abandoned", 
            'success': False,
            'played_at': local_dt.strftime('%H:%M %d-%m-%y')
        }
        attempt_history.round_data.append(set_round_data)
        attempt_history.played_at = datetime.datetime.now()
        attempt_history.save()

        # Set game_is_on to False to prevent for potential game abandonment by the user
        if (ongoing_game.error_count == ongoing_game.round_number):
            attempt_history.game_is_on = False
            attempt_history.save()

        response_data = {
            'countdown': countdown,
            'round': round_number,
            'random_FEN': random_FEN,
            'error_count': error_for_json
        }

        if 'latest_attempt_fen' in locals():
            response_data['latest_attempt_fen'] = latest_attempt_fen

        return JsonResponse(response_data)

def put_submit_game(request):
    if request.method == 'PUT':
        user = request.user
        data = json.loads(request.body.decode('utf-8'))
        pieces_by_user = data['piecesByUser']
        mobileView = data.get('mobileView', False)
        chosenDifficulty = data['chosenDifficulty']
        timezone_offset_minutes = data.get('timezoneOffset')

        if timezone_offset_minutes is not None:
            timezone = pytz.timezone('UTC')
            utc_dt = datetime.datetime.now().replace(tzinfo=timezone)
            local_dt = utc_dt - datetime.timedelta(minutes=timezone_offset_minutes)
        else:
            local_dt = datetime.datetime.now()

        # User sent a PUT request; decrement the error count by 1 to reverse the previous increment meant for handling game abandonment
        game_fen = request.session.get('game_fen')
        if game_fen:
            game = PlayedGame.objects.filter(user=user, fen_str=game_fen).first()
            if game:
                if game.error_count == game.round_number:
                    game.game_is_on = True
                    game.save()
                game.error_count -= 1
                game.save()

        ongoing_games = PlayedGame.objects.filter(user=user, game_is_on=True, chosenDifficulty=chosenDifficulty)
        ongoing_game = ongoing_games.filter(chosenDifficulty=chosenDifficulty).first()
        fen_str = ongoing_game.fen_str
        error_count = ongoing_game.error_count
        chosenDifficulty = ongoing_game.chosenDifficulty
        round_number = DIFFICULTIES.get(chosenDifficulty, {}).get('round', 'unknown')

        transformed_data = []

        # Fetch the corresponding AttemptHistory record for ongoing_game
        attempt_history = AttemptHistory.objects.get(
            user=user,
            played_game=ongoing_game
        )

        for piece_info in pieces_by_user:
            piece_name = piece_info['name']
            left = piece_info['left']
            top = piece_info['top']
            square = position_to_square(left, top, mobileView)
            transformed_data.append({'name': piece_name, 'square': square})

        fen_position_sorted = fen_to_board(fen_str)
        transformed_data_sorted = sorted(transformed_data, key=lambda x: (x['square'], x['name']))
        # Sort fen_position_sorted before comparison
        fen_position_sorted = sorted(fen_position_sorted, key=lambda x: (x['square'], x['name']))

        # Add the new round data to the round_data list
        new_round_data = {
            'round_number': ongoing_game.error_count + 1,
            'fen_string': list_to_fen(transformed_data_sorted), 
            'played_at': local_dt.strftime('%H:%M %d-%m-%y')
        }

        # Initialize flag for existing round data
        round_data_exists = False

        # Check if round_data exists
        for existing_round in attempt_history.round_data:
            if existing_round['round_number'] == ongoing_game.error_count + 1:
                round_data_exists = True
                if existing_round['fen_string'] == "abandoned":
                    existing_round['fen_string'] = list_to_fen(transformed_data_sorted)
                    existing_round['played_at'] = local_dt.strftime('%H:%M %d-%m-%y')
                break

        # If round data with this round number does not exist, append new one
        if not round_data_exists:
            new_round_data = {
                'round_number': ongoing_game.error_count + 1,
                'fen_string': list_to_fen(transformed_data_sorted),
                'played_at': local_dt.strftime('%H:%M %d-%m-%y')
            }

            if attempt_history.round_data is None:
                attempt_history.round_data = []

            attempt_history.round_data.append(new_round_data)

        attempt_history.played_at = datetime.datetime.now()
        attempt_history.save()

        # If the user piece positions are correct
        if fen_position_sorted == transformed_data_sorted:
            ongoing_game.success = True
            ongoing_game.game_is_on = False
            ongoing_game.gotCorrectRoundNumber = error_count + 1
            ongoing_game.save()

            # Update success value for the current round in attempt_history
            for existing_round in attempt_history.round_data:
                if existing_round['round_number'] == ongoing_game.error_count + 1:
                    existing_round['success'] = True
                    break

            attempt_history.game_is_on = False
            attempt_history.save()

            if 'game_fen' in request.session:
                del request.session['game_fen']
            return HttpResponseRedirect(reverse("memory_rush"))
        else:
            # If the user piece positions are wrong and has no tries left
            if (error_count + 1 == round_number):
                ongoing_game.success = False
                ongoing_game.game_is_on = False
                ongoing_game.error_count = error_count + 1
                ongoing_game.save()

                attempt_history.game_is_on = False
                attempt_history.save()

                if 'game_fen' in request.session:
                    del request.session['game_fen']
                return HttpResponse(status=403)
            else:
            # If the user piece positions are wrong and still has tries left
                ongoing_game.game_is_on = True
                ongoing_game.error_count = error_count + 1
                ongoing_game.save()
                if 'game_fen' in request.session:
                    del request.session['game_fen']

                attempt_history.game_is_on = True
                attempt_history.save()
                return HttpResponse(status=400)

def list_to_fen(input_list):
    board = [[" " for _ in range(8)] for _ in range(8)]
    
    fen_map = {
        'br.png': 'r',
        'bn.png': 'n', 
        'bb.png': 'b', 
        'bq.png': 'q', 
        'bk.png': 'k', 
        'bp.png': 'p', 

        'wr.png': 'R', 
        'wn.png': 'N', 
        'wb.png': 'B', 
        'wq.png': 'Q', 
        'wk.png': 'K', 
        'wp.png': 'P'  
    }
    
    for piece in input_list:
        col, row = ord(piece['square'][0]) - ord('a'), int(piece['square'][1]) - 1
        board[8 - row - 1][col] = fen_map[piece['name']]
    
    fen_rows = []
    for row in board:
        empty_count = 0
        fen_row = ""
        for square in row:
            if square == " ":
                empty_count += 1
            else:
                if empty_count > 0:
                    fen_row += str(empty_count)
                fen_row += square
                empty_count = 0
        
        if empty_count > 0:
            fen_row += str(empty_count)
        
        fen_rows.append(fen_row)
    
    fen_code = "/".join(fen_rows)
    
    fen_code += " w - - 0 1"
    
    return fen_code

def fen_to_board(fen):
    board_str, to_move, castling, en_passant, halfmove, fullmove = fen.split(' ')
    
    rows = board_str.split('/')
    board = []
    row_labels = list(range(8, 0, -1))
    col_labels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    
    for row_index, row in enumerate(rows):
        col_index = 0
        for char in row:
            if char.isdigit():
                col_index += int(char)
            else:
                square = col_labels[col_index] + str(row_labels[row_index])
                piece = ""
                if char == 'r':
                    piece = "br.png"
                elif char == 'n':
                    piece = "bn.png"
                elif char == 'b':
                    piece = "bb.png"
                elif char == 'q':
                    piece = "bq.png"
                elif char == 'k':
                    piece = "bk.png"
                elif char == 'p':
                    piece = "bp.png"
                elif char == 'R':
                    piece = "wr.png"
                elif char == 'N':
                    piece = "wn.png"
                elif char == 'B':
                    piece = "wb.png"
                elif char == 'Q':
                    piece = "wq.png"
                elif char == 'K':
                    piece = "wk.png"
                elif char == 'P':
                    piece = "wp.png"
                
                board.append({'name': piece, 'square': square})
                col_index += 1
                
    return board

def position_to_square(left, top, mobileView):
    if (mobileView == True):
        pieceSize = 50
    elif (mobileView == False):
        pieceSize = 90
    # Calculate the column (letter) based on the left position
    column = chr(ord('a') + (left // pieceSize))
    
    # Calculate the row (number) based on the top position
    row = 8 - (top // pieceSize)
    
    return f'{column}{row}'

def login_view(request):
    if request.method == "POST":    
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            messages.success(request, "Successfully logged in.")
            return HttpResponseRedirect(reverse("home"))
        else:
            messages.error(request, "Invalid username and/or password.")
            return HttpResponseRedirect(reverse('login'))
    else:
        return render(request, "chess_content/login.html")

def logout_view(request):
    logout(request)
    messages.info(request, "Logged out.")
    return HttpResponseRedirect(reverse("home"))

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        try:
            validate_password(password)
        except ValidationError as e:
            messages.error(request, str(e))
            return HttpResponseRedirect(reverse('register'))
        
        if password != confirmation:
            messages.error(request, "Passwords must match.")
            return HttpResponseRedirect(reverse('register'))
        try:
            user = User.objects.create_user(username=username, password=password)
            user.save()
        except IntegrityError:
            messages.error(request, "Username already taken.")
            return HttpResponseRedirect(reverse('register'))
        login(request, user)
        messages.success(request, "Registration successful.")
        return HttpResponseRedirect(reverse("home"))
    else:
        return render(request, "chess_content/register.html")
