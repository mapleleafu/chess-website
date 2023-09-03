from django.shortcuts import render,redirect
from django.http import HttpResponse, JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
from django.contrib import messages
import json

from .models import User, ChessGame


def index(request):
    return render(request, "chess_content/index.html")


def position_to_square(left, top):
    # Calculate the column (letter) based on the left position
    column = chr(ord('a') + (left // 90))
    
    # Calculate the row (number) based on the top position
    row = 8 - (top // 90)
    
    return f'{column}{row}'


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
        Fen_Position = data['boardFromFen']
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
            return JsonResponse({'redirect': 'memory_rush', 'status': 'success'})

        else:
            # Printing missing pieces, delete later
            compare_piece_sets(Fen_position_sorted, transformed_data_sorted)
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
    chessgames = ChessGame.objects.all()
    fen_list = [game.fen_string for game in chessgames]
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
