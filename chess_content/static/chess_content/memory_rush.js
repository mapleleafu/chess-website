document.addEventListener("DOMContentLoaded", () => {
    // Attaching click event to both chess_pieces and trash
    document.querySelectorAll(".chess_pieces, .trash").forEach((piece) => {
        piece.addEventListener("click", choosePiece);
        piece.addEventListener("click", cursorDisable);
    });

    // Attach mouseenter and click events to cursor
    document.querySelectorAll(".cursor").forEach((cursor) => {
        cursor.addEventListener(
            "mouseenter",
            () => (cursor.style.cursor = "pointer")
        );
        cursor.addEventListener("click", cursorFunct);
    });

    // Clear all pieces (Clear all button)
    document
        .querySelector(".btn.clear")
        .addEventListener("click", clearFunct);

    // Submit your guesses (Submit button)
    document
        .querySelector(".btn.submit")
        .addEventListener("click", submitFunct);

    // FLip the board (Flip board button)
    document
        .querySelector(".btn.flip")
        .addEventListener("click", flipFunct);

    document.querySelectorAll(".hover-play-video").forEach((video) => {
        video.addEventListener("click", videoFunct);
        video.addEventListener(
            "mouseenter",
            () => (video.style.cursor = "pointer")
        );
        video.setAttribute('data-played', 'false');  // Initialize each video as not played
    });

    const videos = document.querySelectorAll(".hover-play-video");

    videos.forEach((video) => {
        let isMouseOver = false;

        // Check if the video should play once automatically
        if (video.getAttribute('data-played') === 'false') {
            video.play();
            video.setAttribute('data-played', 'true');
        }

        video.addEventListener("mouseover", function () {
            isMouseOver = true;
            if (this.paused) {
                this.play();
            }
        });

        video.addEventListener("mouseout", function () {
            isMouseOver = false;
        });

        video.addEventListener("ended", function () {
            if (isMouseOver) {  
                this.currentTime = 0;
                this.play();
            } else {
                this.pause();
                this.currentTime = 0;
            }
        });
    });
});

let randomFEN;
let boardFromFEN;
let chosenDifficultyCountdownNumber;
let chosenDifficulty;
let chosenDifficultyRoundNumber;
let viewportWidth;
let mobileView = false;
let try_count;

async function videoFunct(event) {
    // Getting the fen list from the database
    const response = await fetch("/get_fen_list/");
    
    // If the user is not authenticated
    if (response.status === 401) {
        window.location.href = '/login';
        return;
    }



    const data = await response.json();
    if (data) {
        const fenList = data.fen_list;
        // If the user has seen all the FEN positions
        if (fenList.length === 0) {
            // TODO: Add a logic here 
            window.location.href = '/profile';
        } else {
            randomFEN = fenList[Math.floor(Math.random() * fenList.length)];
            // Convert the random FEN to a board and place the pieces
            boardFromFEN = fenToBoard(randomFEN);
            placePiecesUsingFen(boardFromFEN);
        }
    }
    
    const difficulties = {
        'easy': { countdown: 10, round: 10 },
        'medium': { countdown: 5, round: 5 },
        'hard': { countdown: 3, round: 3 }
    };


    viewportWidth = window.innerWidth;

    // Removing sidebar and making top-sidebar visible if user is on mobile
    if (viewportWidth <= 450) {
        mobileView = true;
        const sidebar = document.querySelector('.sidebar');
        const pagecontainer = document.querySelector('.page-container');
        if (sidebar) {
            pagecontainer.removeChild(sidebar);
        }
         const topsidebar = document.querySelector('.top-sidebar');
         topsidebar.style.visibility = 'visible';
    }
    

    for (const [key, value] of Object.entries(difficulties)) {
        if (event.target.innerHTML.includes(key)) {
            startGame(key);
            chosenDifficultyCountdownNumber = value.countdown;
            chosenDifficultyRoundNumber = value.round;
            try_count = chosenDifficultyRoundNumber
            chosenDifficulty = key;
            break;
        }
    }
}

function listToFEN(pieceList) {
    if (!pieceList) {
        return;
    }

    // Create an 8x8 array filled with empty strings to represent the chess board
    const board = Array.from({ length: 8 }, () => Array(8).fill(""));

    if (mobileView === true) {
        pieceSize = 50;
    } else {
        pieceSize = 90;
    }
    // Populate the board array based on the pieces in pieceList
    pieceList.forEach((piece) => {
        const row = Math.floor(piece.top / pieceSize);
        const col = Math.floor(piece.left / pieceSize);
        const pieceName =
            piece.name.charAt(0) === "w"
                ? piece.name.charAt(1).toUpperCase()
                : piece.name.charAt(1);
        board[row][col] = pieceName;
    });

    // Convert the board array to a FEN string
    let fen = "";
    for (let row = 0; row < 8; row++) {
        let emptyCount = 0;
        for (let col = 0; col < 8; col++) {
            if (board[row][col] === "") {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    fen += emptyCount;
                    emptyCount = 0;
                }
                fen += board[row][col];
            }
        }
        if (emptyCount > 0) {
            fen += emptyCount;
        }
        if (row < 7) {
            fen += "/";
        }
    }

    return fen;
}

function startGame(difficulty) {
    // Removing the welcome page
    var element = document.querySelector(".welcome_page");
    element.parentNode.removeChild(element);

    document.querySelector(".message_container").style.display = "none";

    // Adding memory rush's page
    document.querySelector(".main_wrapper").style.display = "flex";

    // Start the countdown
    startCountdown(difficulty);
}

function startCountdown(difficulty) {
    if (difficulty === "easy") difficulty = 10;
    else if (difficulty === "medium") difficulty = 5;
    else if (difficulty === "hard") difficulty = 3;

    const countdownElement = document.querySelector(".countdown");
    if (countdownElement.style.display != "block")
        countdownElement.style.display = "block"; 

    let counter = difficulty;

    const interval = setInterval(() => {
        countdownElement.textContent = counter;

        // Apply a dynamic scaling based on the counter value
        if (counter >= 0) {
            let scaleValue = Math.max(1, 1 + (5 - counter) * 0.2);
            countdownElement.style.transform = `scale(${scaleValue})`;
        }

        counter--;

        // Countdown end number
        if (counter < 0 && gameOnFlag === false) {
            clearInterval(interval);
            countdownElement.style.display = "none";
            clearFunct();
            countdownElement.textContent = "";
            countdownEndPlacementStart();
        } else if (counter < 0 && gameOnFlag === true) {
            clearInterval(interval);
            countdownElement.style.display = "none";
            userPlayingFEN = fenToBoard(listToFEN(piecesByUser));
            clearFunct();
            placePiecesUsingFen(userPlayingFEN);
            countdownElement.textContent = "";
            countdownEndPlacementStart();
        }
    }, 1000); // Run every second
}

function countdownEndPlacementStart() {
    // Display visibility settings for other buttons and pieces
    document.querySelector(".white_chess_pieces").style.visibility = "visible";
    document.querySelector(".black_chess_pieces").style.visibility = "visible";

    document.querySelector(".control_panel").style.visibility = "visible";
    document.querySelector(".btn.flip").style.display = "block";
    document.querySelector(".btn.submit").style.display = "block";
    document.querySelector(".btn.clear").style.display = "block";

    document.querySelector(".p1.tries").innerHTML = `Remaining tries: <br> <strong>${try_count}</strong>`;
}

let gameOnFlag = false;
let piecesByUser;
let errorCount = 0;

function submitFunct() {
    const csrftoken = getCookie("csrftoken");
    const memoryBoard = document.querySelector(".duplicate_piece_container");
    let gotCorrectRoundNumber = chosenDifficultyRoundNumber - try_count + 1;
    try_count--;
    piecesByUser = Array.from(memoryBoard.children).map((child) => {
        return {
            name: child.alt,
            left: child.offsetLeft,
            top: child.offsetTop,
            mobileView: mobileView
        };
    });

    fetch("/memory_rush", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({
            piecesByUser: piecesByUser,
            boardFromFEN: boardFromFEN,
        }),
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.status === "success") {
                fetch("/record_success/", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrftoken,
                    },
                    body: JSON.stringify({
                        FENcode: randomFEN,
                        gotCorrectRoundNumber: gotCorrectRoundNumber,
                        chosenDifficulty: chosenDifficulty
                    }),
                }).then((response) => response.json())
                  .then((data) => {
                      if(data.status === "Passed") {
                          window.location.href = "/memory_rush";
                          errorCount = 0;
                      }
                  });
            } else if (data.status === "error") {
                // Game not finished if errorCount is lower than the round number
                errorCount++;
                if (errorCount < chosenDifficultyRoundNumber) {
                    displayErrorMessage(data.message, chosenDifficultyCountdownNumber + 1);
                    gameOnFlag = true;
                    gameIsNotOver();

                // Game finished, user couldn't get the correct position
                } else {
                    errorCount = 0;
                    fetch("/record_fail/", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-CSRFToken": csrftoken,
                        },
                        body: JSON.stringify({
                            FENcode: randomFEN,
                            chosenDifficulty: chosenDifficulty
                        }),
                    }).then((response) => response.json())
                      .then((data) => {
                          if(data.status === "Failed") {
                              window.location.href = "/memory_rush";
                              errorCount = 0;
                          }
                      });
                }
            }
        });
}

function gameIsNotOver() {
    // Adding memory rush's page
    document.querySelector(".main_wrapper").style.display = "flex";

    document.querySelector(".white_chess_pieces").style.visibility = "hidden";
    document.querySelector(".black_chess_pieces").style.visibility = "hidden";

    document.querySelector(".control_panel").style.visibility = "hidden";

    // Clearing piece on the cursor and piece section background colors
    if (activePiece) {
        activePiece.remove();
        activePiece = null;
    }
    if (previouslyClickedPiece && previouslyClickedPiece.alt != "trash") {
        previouslyClickedPiece.classList.remove("animate-background");
        previouslyClickedPiece.style.background = "";
        previouslyClickedPiece = null;
    } else if ( previouslyClickedPiece && previouslyClickedPiece.alt === "trash") {
        document
            .querySelectorAll(".trash.animate-background")
            .forEach((element) => {
                element.classList.remove("animate-background");
                element.style.background = "";
                previouslyClickedPiece = null;
            });
    }
    if (cursorModeEnabled === true) cursorDisable();

    // Set up the original position
    clearFunct();
    boardFromFEN = fenToBoard(randomFEN);
    placePiecesUsingFen(boardFromFEN);

    // Start the countdown
    startCountdown(chosenDifficultyCountdownNumber);
}

let errorMessageSecond = 0;

function displayErrorMessage(message, errorMessageSecond) {
    // Find the existing message container
    const messagesDiv = document.querySelector(".message_container");
    messagesDiv.classList.add("messages");
    // Clear existing messages if any
    messagesDiv.innerHTML = "";

    // Create a new list item for the message
    const messageLi = document.createElement("li");
    messageLi.className = "error";
    messageLi.textContent = message;

    // Append the new list item to the message container
    messagesDiv.appendChild(messageLi);

    // Make the message container visible
    messagesDiv.style.display = "flex";

    // Clear the message div after 3 seconds
    setTimeout(() => {
        messagesDiv.innerHTML = "";
    }, errorMessageSecond * 1000);
}

function displaySuccessMessage(message) {
    // Find the existing message container
    const messagesDiv = document.querySelector(".message_container");
    messagesDiv.classList.add("messages");
    // Clear existing messages if any
    messagesDiv.innerHTML = "";

    // Create a new list item for the message
    const messageLi = document.createElement("li");
    messageLi.className = "success";
    messageLi.textContent = message;

    // Append the new list item to the message container
    messagesDiv.appendChild(messageLi);

    // Make the message container visible
    messagesDiv.style.display = "flex";
}

function placePiecesUsingFen(board) {
    if (!board) {
        return;
    }
    const boardContainer = document.querySelector(".duplicate_piece_container");

    // Declaring width and height depending on browser's width
    viewportWidth = window.innerWidth;
    if (viewportWidth <= 450) {
        squareWidth = 50;
        squareHeight = 50;        
    } else {
        squareWidth = 90;
        squareHeight = 90;
    }

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
                duplicate.classList.add("animate-background");
                duplicate.classList.add("duplicate-piece");
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
    // Split the FEN string into its components: board, turn, castling, etc
    const [fenBoard] = fen.split(" ");

    // Split the board part of the FEN string into ranks
    const fenRanks = fenBoard.split("/");

    // Initialize an empty board.
    const board = [];

    // Loop through each rank in the FEN string
    for (const fenRank of fenRanks) {
        const rank = [];
        for (const char of fenRank) {
            if (isNaN(char)) {
                // If the character is not a number, it represents a piece
                rank.push(char);
            } else {
                // If the character is a number, it represents empty squares
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

function clearFunct() {
    const duplicateContainer = document.querySelector(
        ".duplicate_piece_container"
    );
    const elementsToRemove =
        duplicateContainer.querySelectorAll(".duplicate-piece");

    elementsToRemove.forEach((element) => {
        duplicateContainer.removeChild(element);
    });
}

function flipFunct() {
    console.log("Flip Board button clicked");
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== "") {
        const cookies = document.cookie.split(";");
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === name + "=") {
                cookieValue = decodeURIComponent(
                    cookie.substring(name.length + 1)
                );
                break;
            }
        }
    }
    return cookieValue;
}

let cursorModeEnabled = false; // Flag to check if the cursor is clicked

function cursorFunct(event) {
    document.body.style.cursor = "pointer";

    if (activePiece) {
        activePiece.remove();
        activePiece = null;
    }

    // Reset background colors for other elements
    document
        .querySelectorAll(".animate-background, .trash")
        .forEach((element) => (element.style.backgroundColor = ""));

    const cursors = document.querySelectorAll(".cursor");

    // Change the background attributes of cursors
    cursors.forEach((cursor) => {
        cursor.classList.add("animate-background");
        cursor.style.backgroundColor = "#4aa156b0";
    });

    // Handle duplicate container clicks
    const duplicateContainer = document.querySelector(
        ".duplicate_piece_container"
    );

    if (!cursorModeEnabled) {
        duplicateContainerClickListener = (event) => {
            // When you place a piece down on another piece, remove the original one
            if (activePiece != null) {
                // If they're the same piece, remove the piece from the cursor
                if (activePiece.alt === event.target.alt) {
                    activePiece.remove();
                    activePiece = null;
                } else {
                    duplicateContainer.removeChild(event.target);
                    placePiece(event);
                }
            }
            // For moving pieces around on empty squares
            else if (
                event.target.classList.value ===
                "chess_pieces animate-background duplicate-piece"
            ) {
                choosePiece(event);
            }
        };

        duplicateContainer.addEventListener(
            "click",
            duplicateContainerClickListener
        );
        cursorModeEnabled = true; // set flag to true
    }
}

function cursorDisable() {
    const duplicateContainer = document.querySelector(
        ".duplicate_piece_container"
    );
    const cursors = document.querySelectorAll(".cursor");

    if (cursorModeEnabled) {
        duplicateContainer.removeEventListener(
            "click",
            duplicateContainerClickListener
        );
        cursorModeEnabled = false; // set flag back to false

        // Reset the cursor to default
        document.body.style.cursor = "";

        cursors.forEach((element) => {
            element.style.backgroundColor = "";
            element.classList.remove("animate-background");
        });
    }
}

let activePiece = null;
let previouslyClickedPiece = null;

function choosePiece(event) {
    // Get the clicked element
    let clickedPiece = event.target;

    // Check if the clicked piece is already the active piece
    if (clickedPiece?.alt === activePiece?.alt) return;

    // Remove the previous active piece
    if (activePiece) {
        document.removeEventListener("mousemove", movePiece);
        activePiece.remove();
        activePiece = null;
    }

    const trashs = document.querySelectorAll(".trash");

    // Reset the background color of the previously clicked piece and cursor
    if (previouslyClickedPiece) {
        if (previouslyClickedPiece.className == "trash animate-background") {
            trashs.forEach((trash) => {
                trash.classList.remove("animate-background");
                trash.style.backgroundColor = "";
            });
        } else {
            previouslyClickedPiece.style.backgroundColor = "";
            previouslyClickedPiece.classList.remove("animate-background");
        }
    }

    // Different behavior depending on whether the trash bin or a chess piece is clicked
    if (clickedPiece.classList.contains("trash")) {
        trashs.forEach((trash) => {
            trash.classList.add("animate-background");
            trash.style.backgroundColor = "#f57878f6";
        });

        // Reset activePiece if it's trash
        if (activePiece && activePiece.classList.contains("trash")) {
            activePiece = null;
        }
    } else {
        clickedPiece.classList.add("animate-background");
        clickedPiece.style.backgroundColor = "#507ea9";
        clickedPiece.style.borderRadius = "10px";
    }

    // Store the reference to the current clicked piece for future use
    previouslyClickedPiece = clickedPiece;

    // Clone and modify the clicked piece to make it the active piece
    activePiece = clickedPiece.cloneNode(true);

    // Determine the width and height based on the viewport width (mobile/browser)
    const pieceWidth = viewportWidth <= 450 ? "50px" : "90px";
    const pieceHeight = viewportWidth <= 450 ? "50px" : "90px";

    Object.assign(activePiece.style, {
        position: "absolute",
        zIndex: "9998",
        width: pieceWidth,
        height: pieceHeight,
        pointerEvents: "none", // So it doesn't interfere with other events
        backgroundColor: "", // Remove inherited background color
        border: "0px",
    });

    activePiece.setAttribute("draggable", "false");

    // Append the active piece to the body and position it
    document.body.appendChild(activePiece);

    // Piece movement logic, eventlisteners etc.
    movePiece(event); // Position it immediately
    document.addEventListener("mousemove", movePiece);

    let lastMouseEvent = null;

    document.addEventListener("mousemove", (event) => {
        lastMouseEvent = event;
    });

    // Smooth scrolling when a piece is selected
    document.addEventListener("scroll", function () {
        if (activePiece && lastMouseEvent) {
            activePiece.style.left = `${
                lastMouseEvent.clientX + window.scrollX - activePiece.width / 2
            }px`;
            activePiece.style.top = `${
                lastMouseEvent.clientY + window.scrollY - activePiece.height / 2
            }px`;
        }
    });

    function movePiece(event) {
        if (!activePiece) return;
        activePiece.style.left = `${
            event.clientX + window.scrollX - activePiece.width / 2
        }px`;
        activePiece.style.top = `${
            event.clientY + window.scrollY - activePiece.height / 2
        }px`;
    }

    // Placing a piece down on the board
    document
        .querySelector(".memory_board")
        .addEventListener("click", placePiece);

    // If on mobile, activePiece is not visible on the cursor
    if (viewportWidth <= 450) {
        activePiece.remove();
    }
}

let squareWidth;
let squareHeight;

function placePiece(event) {
    if (!activePiece || activePiece.className == "trash animate-background")
        return;

    const boardRect = document
        .querySelector(".memory_board")
        .getBoundingClientRect();

    const boardContainer = document.querySelector(".board_and_duplicates");
    const duplicateContainer = document.querySelector(
        ".duplicate_piece_container"
    );

    const { left: boardX, top: boardY } = boardRect;

    // Use pageX and pageY for coordinates relative to the whole document
    const x = event.clientX,
        y = event.clientY;

    // Mobile piece placement logic
    if (viewportWidth <= 450) {
        squareWidth = 50;
        squareHeight = 50;        
    } else {
        squareWidth = activePiece.width;
        squareHeight = activePiece.height;
    }
    // Check if the coordinates (x, y) are within the boundaries of the chess board
    if (
        x >= boardX &&
        x <= boardX + 8 * squareWidth &&
        y <= boardY + 8 * squareHeight &&
        y >= boardY
    ) {
        // Calculate the grid coordinates (Xcord, Ycord) for the square where the piece should be placed
        const [Xcord, Ycord] = [
            Math.floor((x - boardX) / squareWidth),
            Math.floor((y - boardY) / squareHeight),
        ];

        // Calculate the pixel coordinates of the center of the square
        const squareCenter = [
            Xcord * squareWidth + squareWidth / 2,
            Ycord * squareHeight + squareHeight / 2,
        ];

        const duplicate = activePiece.cloneNode(true);

        const boardContainerRect = boardContainer.getBoundingClientRect();

        // Assign CSS styles to the duplicate piece for proper positioning
        Object.assign(duplicate.style, {
            position: "absolute",
            left: `${
                squareCenter[0] -
                squareWidth / 2 +
                boardX -
                boardContainerRect.left
            }px`,
            top: `${
                squareCenter[1] -
                squareHeight / 2 +
                boardY -
                boardContainerRect.top
            }px`,
            zIndex: "9997",
            pointerEvents: "auto",
        });

        duplicate.classList.add("duplicate-piece");

        duplicate.setAttribute("draggable", "false");

        duplicateContainer.appendChild(duplicate);
    }

    // Logic for a piece selected by cursor to not duplicate after dragging
    if (
        activePiece &&
        activePiece.className ===
            "chess_pieces animate-background duplicate-piece"
    ) {
        activePiece.remove();
        activePiece = null;
    }

    document.addEventListener("click", function (event) {
        if (!activePiece) return;

        if (event.target.classList.contains("duplicate-piece")) {
            // If cursor is enabled, remove the chosen piece from the board
            if (
                cursorModeEnabled &&
                duplicateContainer.contains(event.target)
            ) {
                duplicateContainer.removeChild(event.target);
            } else if (duplicateContainer.contains(event.target)) {
                if (activePiece.src === event.target.src) {
                    duplicateContainer.removeChild(event.target);
                } else if (activePiece) {
                    duplicateContainer.removeChild(event.target);
                    placePiece(event); // Put down the active piece
                }
            }
        }
    });
}
