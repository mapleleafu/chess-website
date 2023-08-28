from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json

def index(request):
    return render(request, "chess_content/index.html")

@csrf_exempt
def memory_rush(request):
    white_piece_filenames = ['wk.png', 'wq.png', 'wr.png', 'wb.png', 'wn.png', 'wp.png']
    black_piece_filenames=  ['bk.png', 'bq.png', 'br.png', 'bb.png', 'bn.png', 'bp.png']
    
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        pieces_by_user = data.get('pieces_by_user', [])
        print(pieces_by_user)
        return JsonResponse({'message': 'Success!'})

    return render(request, 'chess_content/memory_rush.html', 
                  {'black_piece_filenames': black_piece_filenames,
                   'white_piece_filenames': white_piece_filenames
                   })
