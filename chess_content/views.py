from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
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
    
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        pieces_by_user = data['piecesByUser']
        transformed_data = []

        for piece_info in pieces_by_user:
            piece_name = piece_info['name']
            left = piece_info['left']
            top = piece_info['top']
            square = position_to_square(left, top)
            transformed_data.append({'name': piece_name, 'square': square})
            print(transformed_data)
        return JsonResponse({'piecesByUser': transformed_data})

    return render(request, 'chess_content/memory_rush.html', 
                  {'black_piece_filenames': black_piece_filenames,
                   'white_piece_filenames': white_piece_filenames
                   })


def get_fen_list(request):
    chessgames = ChessGame.objects.all()
    fen_list = [game.fen_string for game in chessgames]
    return JsonResponse({'fen_list': fen_list})