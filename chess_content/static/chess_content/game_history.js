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
        let fenData = element.getAttribute('data-fen');
        const isOngoing = element.querySelector('.game_info').getAttribute('data-is-on') === "True";
        const copyButton = element.querySelector('.copy');
        if (isOngoing && copyButton) {
            copyButton.remove();
            fenData = randomFEN();
        }
        // Convert FEN to board and place pieces
        const boardFromFEN = fenToBoard(fenData);
        placePiecesFromFEN(boardFromFEN, pieceContainer);
    });
    
    let newestFirst = true;  // Initialize the variable to true

    const toggleButton = document.getElementById('toggleOrder');
    if (toggleButton) {
        toggleButton.addEventListener('click', function() {
            const profileGames = document.querySelector('.profile_games');
            const games = Array.from(profileGames.querySelectorAll('.game'));
            
            games.reverse().forEach(game => profileGames.appendChild(game));
            
            newestFirst = !newestFirst; // Toggle the flag
            toggleButton.textContent = newestFirst ? "Oldest" : "Newest";
        });
    }
    showMessageOnLoad();
});

function showMessageOnLoad() {
    const errorInfoStr = localStorage.getItem("errorInfo");
    let errorMessage = null;
    let errorMessageSecond = null;

    if (errorInfoStr) {
        const errorInfo = JSON.parse(errorInfoStr);
        errorMessage = errorInfo.message;
        errorMessageSecond = errorInfo.countdownNumber;
    } else {
        errorMessage = localStorage.getItem("errorMessage");
    }

    const successMessage = localStorage.getItem("successMessage");

    if (errorMessage) {
        displayErrorMessage(errorMessage, errorMessageSecond);
        localStorage.removeItem("errorMessage");
        localStorage.removeItem("errorInfo");
    }

    if (successMessage) {
        displaySuccessMessage();
        localStorage.removeItem("successMessage");
    }
}

function displayErrorMessage(errorMessage, errorMessageSecond, removeAfterTimeout) {
    if (!errorMessage) return;

    const messagesDiv = document.querySelector(".message_container");

    messagesDiv.style.display = "flex";
    messagesDiv.classList.add("messages");
    messagesDiv.innerHTML = `<li class="error">${errorMessage}</li>`;
    messagesDiv.style.display = "flex";

    if (removeAfterTimeout) {
        setTimeout(() => {
            messagesDiv.innerHTML = "";
        }, errorMessageSecond * 1000);
    }
} 

function displaySuccessMessage() {
    const message = localStorage.getItem("successMessage");
    if (!message) return;

    const messagesDiv = document.querySelector(".message_container");

    messagesDiv.style.display = "flex";
    messagesDiv.classList.add("messages");
    messagesDiv.innerHTML = `<li class="success">${message}</li>`;
    messagesDiv.style.display = "flex";

    localStorage.removeItem("successMessage");
}

function randomFEN() {
    const pieces = ['p', 'r', 'n', 'b', 'q', 'k', 'P', 'R', 'N', 'B', 'Q', 'K'];
    let fen = "";
  
    for (let row = 0; row < 8; row++) {
      let empty = 0;
  
      for (let col = 0; col < 8; col++) {
        if (Math.random() > 0.7) { // Adjust probability as you like
          if (empty > 0) {
            fen += empty;
            empty = 0;
          }
          const randomPiece = pieces[Math.floor(Math.random() * pieces.length)];
          fen += randomPiece;
        } else {
          empty++;
        }
      }
  
      if (empty > 0) {
        fen += empty;
      }
  
      if (row < 7) {
        fen += "/";
      }
    }
  
    fen += " w KQkq - 0 1"; // Adding some default values for the rest of the FEN parts
    return fen;
  }

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


function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        console.log(`Copied ${text} to clipboard successfully!`);
    }).catch(function() {
        console.log("Unable to copy to clipboard!");
    });
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

    $(".copy").click(function() {
        const text = $(this).parent().parent().attr('data-fen');
        copyToClipboard(text);

        $(this).find('.fa-clipboard').hide();
        $(this).find('.fa-check').show();

        setTimeout(() => {
            $(this).find('.fa-check').hide();
            $(this).find('.fa-clipboard').show();
        }, 3000);
    });
});