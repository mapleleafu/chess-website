document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".game").forEach(element => {
        const boardContainer = element.querySelector(".board_container");
        const pieceContainer = element.querySelector(".piece_container");

        // Create and append the chessboard image to each game
        const img = document.createElement("img");
        img.src = "static/chess_content/assets/board.png";
        img.alt = "chess_board";
        img.width = 240;
        img.height = 240;
        img.draggable = false;
        img.style.userSelect = 'none';
        img.style.webkitUserDrag = 'none';
        img.classList.add('profile_board');
        boardContainer.appendChild(img);

        // Get the FEN for each game
        const fenData = element.getAttribute('data-fen');

        // Convert FEN to board and place pieces
        const boardFromFEN = fenToBoard(fenData);
        placePiecesFromFEN(boardFromFEN, pieceContainer);
    });
    
    let newestFirst = true;  // Initialize the variable to true

    const toggleButton = document.getElementById('toggleOrder');
    toggleButton.addEventListener('click', function() {
        const profileGames = document.querySelector('.profile_games');
        const games = Array.from(profileGames.querySelectorAll('.game'));
        
        games.reverse().forEach(game => profileGames.appendChild(game));
        
        newestFirst = !newestFirst; // Toggle the flag
        toggleButton.textContent = newestFirst ? "Oldest" : "Newest";
    });
});

function placePiecesFromFEN(board, pieceContainer) {
    if (!board) {
        return;
    }

    const squareWidth = 30;
    const squareHeight = 30;

    // Mapping of FEN pieces to their image URLs
    const pieceToImage = {
        // White pieces
        K: "/static/chess_content/assets/pieces/wk.png",
        Q: "/static/chess_content/assets/pieces/wq.png",
        R: "/static/chess_content/assets/pieces/wr.png",
        N: "/static/chess_content/assets/pieces/wn.png",
        B: "/static/chess_content/assets/pieces/wb.png",
        P: "/static/chess_content/assets/pieces/wp.png",

        // Black pieces
        k: "/static/chess_content/assets/pieces/bk.png",
        q: "/static/chess_content/assets/pieces/bq.png",
        r: "/static/chess_content/assets/pieces/br.png",
        n: "/static/chess_content/assets/pieces/bn.png",
        b: "/static/chess_content/assets/pieces/bb.png",
        p: "/static/chess_content/assets/pieces/bp.png",
    };

    pieceContainer.innerHTML = '';  // Clear any existing pieces in the container
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            const piece = board[y][x];

            if (piece) {
                const duplicate = document.createElement("img");
                duplicate.src = pieceToImage[piece];
                const filename = pieceToImage[piece].split("/").pop();
                duplicate.alt = filename;
                Object.assign(duplicate.style, {
                    position: "absolute",
                    left: `${x * squareWidth}px`,
                    top: `${y * squareHeight}px`,
                    width: `${squareWidth}px`,
                    height: `${squareHeight}px`,
                    zIndex: "9997",
                    pointerEvents: "auto",
                    webkitUserDrag: "none",
                    userSelect: "none",
                    border: "0px",
                });
                duplicate.classList.add("profile_piece");
                duplicate.setAttribute("draggable", "false");
                pieceContainer.appendChild(duplicate);
            }
        }
    }
}

function fenToBoard(fen) {
    if (!fen) {
        return;
    }
    // Split the FEN string into its components: board, turn, castling, etc.
    const [fenBoard] = fen.split(" ");

    // Split the board part of the FEN string into ranks.
    const fenRanks = fenBoard.split("/");

    // Initialize an empty board.
    const board = [];

    // Loop through each rank in the FEN string.
    for (const fenRank of fenRanks) {
        const rank = [];
        for (const char of fenRank) {
            if (isNaN(char)) {
                // If the character is not a number, it represents a piece.
                rank.push(char);
            } else {
                // If the character is a number, it represents empty squares.
                const emptySquares = parseInt(char, 10);
                for (let i = 0; i < emptySquares; i++) {
                    rank.push(null);
                }
            }
        }
        board.push(rank);
    }
    return board;
}

// Maximizing FEN text to 20 characters, and then it goes to a new line
$(document).ready(function() {
    $(".fen_string").each(function() {
        var text = $(this).text();
        var modifiedText = '';
        
        for (var i = 0; i < text.length; i++) {
            modifiedText += text[i];
            if ((i + 1) % 25 === 0) {
                modifiedText += '<br>';
            }
        }
        
        $(this).html(modifiedText);
    });
});