from django.shortcuts import render, redirect
from django.db import IntegrityError
from django.contrib.auth import authenticate, login, logout
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.urls import reverse
from django.contrib import messages
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.password_validation import validate_password
from email_validator import validate_email, EmailNotValidError
from django.core.exceptions import ValidationError
import json

from .models import User, ChessGame, PlayedGame


def home(request):
    return render(request, "chess_content/home.html")

def game_history(request):
    seen_games = PlayedGame.objects.filter(user=request.user).select_related('chess_game')

    fen_data = [
        {
            'fen_string': game.chess_game.fen_string,
            'success': game.success,
            'played_at': game.played_at.strftime("%Y-%m-%d %H:%M:%S"),
        }
        for game in seen_games
    ]

    return render(request, "chess_content/game_history.html", 
                  {'fen_data': fen_data})


@csrf_exempt
def record_success(request):
    if request.method == "POST":
        user = request.user
        data = json.loads(request.body.decode('utf-8'))
        FENcode = data.get('FENcode')
        
        chess_game = ChessGame.objects.get(fen_string=FENcode)

        PlayedGame.objects.create(user=user, chess_game=chess_game, success=True)
        return JsonResponse({"status": "Passed"})

@csrf_exempt
def record_fail(request):
    if request.method == "POST":
        user = request.user
        data = json.loads(request.body.decode('utf-8'))
        FENcode = data.get('FENcode')
        
        chess_game = ChessGame.objects.get(fen_string=FENcode)

        PlayedGame.objects.create(user=user, chess_game=chess_game, success=False)
        return JsonResponse({"status": "Failed"})

@csrf_exempt
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

    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        pieces_by_user = data['piecesByUser']
        Fen_Position = data['boardFromFEN']
        Fen_position_sorted = sorted(transform_board_to_square_data(Fen_Position), key=lambda x: (x['square'], x['name']))
    
        transformed_data = []

        for piece_info in pieces_by_user:
            piece_name = piece_info['name']
            left = piece_info['left']
            top = piece_info['top']
            square = position_to_square(left, top)
            transformed_data.append({'name': piece_name, 'square': square})

        transformed_data_sorted = sorted(transformed_data, key=lambda x: (x['square'], x['name']))

        # Logic to show which pieces are wrong or correct. 
        if Fen_position_sorted == transformed_data_sorted:
            request.session['message'] = 'Matched the Memory!'
            request.session['message_type'] = 'success'
            return JsonResponse({'status': 'success'})

        else:
            # Printing missing pieces, delete later
            compare_piece_sets(Fen_position_sorted, transformed_data_sorted)
            request.session['message'] = "Couldn't Match the Memory"
            request.session['message_type'] = 'error'
            return JsonResponse({'message': 'Pieces Not Correct', 'status': 'error'})

    return render(request, 'chess_content/memory_rush.html', 
                  {'black_piece_filenames': black_piece_filenames,
                   'white_piece_filenames': white_piece_filenames,
                   'video_names': video_names,
                   'message': message,
                   'message_type': message_type 
                   })

#TODO: Delete later
def compare_piece_sets(Fen_position_sorted, transformed_data_sorted):
    test_set = set(tuple(d.items()) for d in Fen_position_sorted)
    transformed_data_set = set(tuple(d.items()) for d in transformed_data_sorted)

    added_pieces = transformed_data_set - test_set
    removed_pieces = test_set - transformed_data_set

    if added_pieces:
        print("NOT Needed pieces:", [dict(t) for t in added_pieces])
    if removed_pieces:
        print("Needed pieces:", [dict(t) for t in removed_pieces])

# Get FEN lists from the database
def get_fen_list(request):
    if not request.user.is_authenticated:
        messages.error(request, "You have to log in to play.")
        return JsonResponse({'status': 'unauthenticated'}, status=401)

    # Get IDs of ChessGame instances already seen by the user
    seen_game_ids = PlayedGame.objects.filter(user=request.user).values_list('chess_game_id', flat=True)
  
    # Exclude seen ChessGames
    unseen_chessgames = ChessGame.objects.exclude(id__in=seen_game_ids)
  
    fen_list = [game.fen_string for game in unseen_chessgames]
    return JsonResponse({'fen_list': fen_list})

def transform_board_to_square_data(boardFromFen):
    square_data = []
    piece_to_image = {
        'K': 'wk.png',
        'Q': 'wq.png',
        'R': 'wr.png',
        'N': 'wn.png',
        'B': 'wb.png',
        'P': 'wp.png',
        'k': 'bk.png',
        'q': 'bq.png',
        'r': 'br.png',
        'n': 'bn.png',
        'b': 'bb.png',
        'p': 'bp.png'
    }
    
    for row_index, row in enumerate(reversed(boardFromFen)):  # Reverse because 1st row in FEN is 8th row in real board
        for col_index, piece in enumerate(row):
            if piece:  # Skip None (empty squares)
                square = chr(97 + col_index) + str(row_index + 1) 
                square_data.append({
                    'name': piece_to_image[piece],
                    'square': square
                })

    return square_data

def position_to_square(left, top):
    # Calculate the column (letter) based on the left position
    column = chr(ord('a') + (left // 90))
    
    # Calculate the row (number) based on the top position
    row = 8 - (top // 90)
    
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
        email = request.POST["email"]
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        try:
            validate_password(password)
        except ValidationError as e:
            messages.error(request, str(e))
            return HttpResponseRedirect(reverse('register'))
        try:
            validate_email(email)
        except EmailNotValidError as e:
            messages.error(request, str(e))
            return HttpResponseRedirect(reverse('register'))
        
        if password != confirmation:
            messages.error(request, "Passwords must match.")
            return HttpResponseRedirect(reverse('register'))
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            messages.error(request, "Username already taken.")
            return HttpResponseRedirect(reverse('register'))
        login(request, user)
        messages.success(request, "Registration successful.")
        return HttpResponseRedirect(reverse("home"))
    else:
        return render(request, "chess_content/register.html")