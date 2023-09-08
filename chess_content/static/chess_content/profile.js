document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".game").forEach(element => {
        const img = document.createElement("img");
        img.src = "static/chess_content/assets/board.png"

        img.alt = "Chess Board";
        img.width = 250;
        img.height = 250;
        img.draggable = false;
        img.style.userSelect = 'none'; 
        img.style.webkitUserDrag = 'none'; 
        img.classList.add('board');

        // Append the image to the current .game element
        element.appendChild(img);
    });
});

boardFromFEN = fenToBoard("k7/8/8/8/8/8/8/K7 w - - 0 1");
placePiecesUsingFen(boardFromFEN);


function placePiecesUsingFen(board) {
    if (!board) {
        return;
    }
    const boardContainer = document.querySelector(".game");
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
                duplicate.classList.add("chess_pieces");
                duplicate.setAttribute("draggable", "false");
                boardContainer.appendChild(duplicate);
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
