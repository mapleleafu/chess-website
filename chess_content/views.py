from django.shortcuts import render
from django.http import HttpResponse


def index(request):
    return render(request, "chess_content/index.html")

def memory_rush(request):
    white_piece_filenames = ['wk.png', 'wq.png', 'wr.png', 'wb.png', 'wn.png', 'wp.png']
    black_piece_filenames=  ['bk.png', 'bq.png', 'br.png', 'bb.png', 'bn.png', 'bp.png']
    
    return render(request, 'chess_content/memory_rush.html', 
                  {'black_piece_filenames': black_piece_filenames,
                   'white_piece_filenames': white_piece_filenames
                   })