document.addEventListener("DOMContentLoaded", () => {
    // Attaching click event to both chess_pieces and trash
    document.querySelectorAll(".chess_pieces, .trash").forEach((piece) => {
        piece.addEventListener("click", cursorDisable);
        piece.addEventListener("click", choosePiece);
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
    document.querySelector(".btn.clear").addEventListener("click", clearFunct);

    // Submit your guesses (Submit button)
    document
        .querySelector(".btn.submit")
        .addEventListener("click", submitFunct);

    // Starting Postiion (Starting Position button)
    document
        .querySelector(".btn.start")
        .addEventListener("click", startPositionFunct);

    document.querySelectorAll(".hover-play-video").forEach((video) => {
        video.addEventListener("click", videoFunct);
        video.addEventListener(
            "mouseenter",
            () => (video.style.cursor = "pointer")
        );
        video.setAttribute("data-played", "false"); // Initialize each video as not played
    });

    const videos = document.querySelectorAll(".hover-play-video");

    videos.forEach((video) => {
        let isMouseOver = false;

        // Check if the video should play once automatically
        if (video.getAttribute("data-played") === "false") {
            video.play();
            video.setAttribute("data-played", "true");
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

let randomFEN,
    boardFromFEN,
    chosenDifficultyCountdownNumber,
    chosenDifficulty,
    chosenDifficultyRoundNumber,
    viewportWidth,
    mobileView = false,
    try_count;
errorCount = 0;

async function videoFunct(event) {
    const csrftoken = getCookie("csrftoken");
    const videoElement = event.currentTarget;
    const src = videoElement.querySelector("source").src;
    const videoName = src.split("/").pop().split(".")[0]; // Extract the video name without extension

    // Determine the difficulty level based on the video name
    const difficulties = ["easy", "medium", "hard"];
    chosenDifficulty = difficulties.find((diff) => videoName.includes(diff));

    const response = await fetch("/post_start_game", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({
            chosenDifficulty: chosenDifficulty,
        }),
    });

    // Check for unauthorized status
    if (response.status === 401) {
        window.location.href = "/login";
        return; // Early return
    }
    const data = await response.json();
    if (data) {
        chosenDifficultyCountdownNumber = data.countdown;
        chosenDifficultyRoundNumber = data.round;
        randomFEN = data.random_FEN;
        if (data.error_count) errorCount = data.error_count;
    }
    // Convert the random FEN to a board and place the pieces
    boardFromFEN = fenToBoard(randomFEN);
    placePiecesUsingFen(boardFromFEN);
    try_count = chosenDifficultyRoundNumber - errorCount;

    viewportWidth = window.innerWidth;

    // Removing sidebar and making top-sidebar visible if user is on mobile
    if (viewportWidth <= 450) {
        mobileView = true;
        const sidebar = document.querySelector(".sidebar");
        const pagecontainer = document.querySelector(".page-container");
        if (sidebar) {
            pagecontainer.removeChild(sidebar);
        }
        const topsidebar = document.querySelector(".top-sidebar");
        topsidebar.style.visibility = "visible";
    }
    startGame(chosenDifficultyCountdownNumber);
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

function startGame(chosenDifficultyCountdownNumber) {
    // Removing the welcome page
    var element = document.querySelector(".welcome_page");
    element.parentNode.removeChild(element);

    document.querySelector(".message_container").style.display = "none";

    // Adding memory rush's page
    document.querySelector(".main_wrapper").style.display = "flex";

    // Start the countdown
    startCountdown(chosenDifficultyCountdownNumber);
}

function startCountdown(chosenDifficultyCountdownNumber) {
    const countdownElement = document.querySelector(".countdown");
    countdownElement.style.display = "block";
    
    let counter = chosenDifficultyCountdownNumber;
    const interval = setInterval(() => {
        countdownElement.textContent = counter;
        if (counter >= 0) {
            const scaleValue = Math.max(1, 1 + (5 - counter) * 0.2);
            countdownElement.style.transform = `scale(${scaleValue})`;
        }
        counter--;

        if (counter < 0) {
            clearInterval(interval);
            countdownElement.style.display = "none";
            countdownElement.textContent = "";

            if (gameOnFlag) {
                userPlayingFEN = fenToBoard(listToFEN(piecesByUser));
                placePiecesUsingFen(userPlayingFEN);
            } else {
                clearFunct();
            }
            
            countdownEndPlacementStart();
        }
    }, 1000);
}


function countdownEndPlacementStart() {
    // Show buttons and pieces
    const whitePieces = document.querySelector(".white_chess_pieces");
    const blackPieces = document.querySelector(".black_chess_pieces");
    const controlPanel = document.querySelector(".control_panel");
    const buttons = document.querySelectorAll(".btn.submit, .btn.clear, .btn.start");

    whitePieces.style.visibility = "visible";
    blackPieces.style.visibility = "visible";
    controlPanel.style.visibility = "visible";
    buttons.forEach(btn => btn.style.display = "block");

    document.querySelector(".p1.tries").innerHTML = `Remaining tries: <br> <strong>${try_count}</strong>`;

    // Making sure that startPositionFunct works properly by putting down a piece once
    if (!gameOnFlag) {
        const image = document.querySelector('img[src="/static/chess_content/assets/pieces/wn.png"]');
        image.click();

        const boardRect = document.querySelector(".memory_board").getBoundingClientRect();
        const { left: boardX, top: boardY } = boardRect;
        const memoryBoard = document.querySelector(".memory_board");

        const event = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: boardX + boardX / 2,
            clientY: boardY + boardY / 2,
        });

        memoryBoard.dispatchEvent(event);
        activePiece.remove();
        activePiece = null;
        clearFunct();
        
        image.classList.remove("animate-background");
        image.style.backgroundColor = "";
    }
}
    
let gameOnFlag = false,
    piecesByUser;

function submitFunct() {
    const csrftoken = getCookie("csrftoken");
    const memoryBoard = document.querySelector(".duplicate_piece_container");
    try_count--;
    piecesByUser = Array.from(memoryBoard.children).map((child) => {
        return {
            name: child.alt,
            left: child.offsetLeft,
            top: child.offsetTop,
            mobileView: mobileView,
        };
    });

    fetch("/put_submit_game", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "X-CSRFToken": csrftoken,
        },
        body: JSON.stringify({
            chosenDifficulty: chosenDifficulty,
            piecesByUser: piecesByUser,
        }),
    }).then((response) => {
        if (response.status === 200) {
            localStorage.setItem("successMessage", "Matched the memory!");
            location.reload();
        } else if (response.status === 400) {
            const errorInfo = {
                message: "Pieces Not Correct",
                countdownNumber: chosenDifficultyCountdownNumber + 1,
                removeAfterTimeout: true,
            };
            displayErrorMessage(
                errorInfo.message,
                errorInfo.countdownNumber,
                errorInfo.removeAfterTimeout
            );
            gameOnFlag = true;
            gameIsNotOver();
        } else if (response.status === 403) {
            const errorInfo = {
                message: "Couldn't Match the Memory",
                countdownNumber: 1,
                removeAfterTimeout: false,
            };
            localStorage.setItem("errorInfo", JSON.stringify(errorInfo));
            gameOnFlag = false;
            errorCount = 0;
            location.reload();
        }
    });
}

function gameIsNotOver() {
    // Show/hide elements
    const mainWrapper = document.querySelector(".main_wrapper");
    mainWrapper.style.display = "flex";

    const whitePieces = document.querySelector(".white_chess_pieces");
    const blackPieces = document.querySelector(".black_chess_pieces");
    const controlPanel = document.querySelector(".control_panel");

    whitePieces.style.visibility = "hidden";
    blackPieces.style.visibility = "hidden";
    controlPanel.style.visibility = "hidden";

    // Clear active and previously clicked pieces
    if (activePiece) {
        activePiece.remove();
        activePiece = null;
    }

    if (previouslyClickedPiece) {
        previouslyClickedPiece.classList.remove("animate-background");
        previouslyClickedPiece.style.background = "";

        if (previouslyClickedPiece.alt === "trash") {
            const trashElements = document.querySelectorAll(".trash.animate-background");
            trashElements.forEach(el => {
                el.classList.remove("animate-background");
                el.style.background = "";
            });
        }

        previouslyClickedPiece = null;
    }

    // Disable cursor mode
    if (cursorModeEnabled) cursorDisable();

    // Reset the board
    clearFunct();
    boardFromFEN = fenToBoard(randomFEN);
    placePiecesUsingFen(boardFromFEN);

    // Start countdown
    startCountdown(chosenDifficultyCountdownNumber);
}


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
    messagesDiv.classList.add("messages");
    messagesDiv.innerHTML = `<li class="success">${message}</li>`;
    messagesDiv.style.display = "flex";

    localStorage.removeItem("successMessage");
}


window.addEventListener("load", showMessageOnLoad);

function placePiecesUsingFen(board) {
    if (!board) {
        return;
    }

    const boardContainer = document.querySelector(".duplicate_piece_container");

    // Declare viewport dimensions
    const viewportWidth = window.innerWidth;
    let squareWidth, squareHeight;

    if (viewportWidth <= 450) {
        squareWidth = 50;
        squareHeight = 50;
    } else {
        squareWidth = 90;
        squareHeight = 90;
    }

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
            const left = x * squareWidth;
            const top = y * squareHeight;

            // Check existing elements in the board
            const existingChild = Array.from(boardContainer.children).find(
                (child) => {
                    const childStyle = child.style;
                    const childLeft = parseInt(childStyle.left, 10);
                    const childTop = parseInt(childStyle.top, 10);

                    return childLeft === left && childTop === top;
                }
            );

            // Skip this iteration if an existing child is found at this position
            if (existingChild) {
                continue;
            }

            if (piece) {
                const duplicate = document.createElement("img");
                duplicate.src = pieceToImage[piece];
                const filename = pieceToImage[piece].split("/").pop();
                duplicate.alt = filename;
                Object.assign(duplicate.style, {
                    position: "absolute",
                    left: `${left}px`,
                    top: `${top}px`,
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

let startPositionTriggered = false;

function startPositionFunct() {
    startPositionTriggered = true;
    startingFEN = fenToBoard(
        `rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1`
    );
    placePiecesUsingFen(startingFEN);
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
        .forEach((element) => {
            element.style.backgroundColor = "";
        });

    const cursors = document.querySelectorAll(".cursor");
    cursors.forEach((cursor) => {
        cursor.classList.add("animate-background");
        cursor.style.backgroundColor = "#4aa156b0";
    });

    const duplicateContainer = document.querySelector(
        ".duplicate_piece_container"
    );

    if (!cursorModeEnabled) {
        duplicateContainerClickListener = (event) => {
            event.target.remove();

            // For moving pieces around on empty squares
            choosePiece(event);
        };
        duplicateContainer.addEventListener(
            "mousedown",
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

    if (cursorModeEnabled === true) {
        duplicateContainer.removeEventListener(
            "mousedown",
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

let activePiece = null,
    previouslyClickedPiece = null;

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
        } else if (!cursorModeEnabled) {
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
    } else if (!cursorModeEnabled) {
        clickedPiece.classList.add("animate-background");
        clickedPiece.style.backgroundColor = "#b3f4ff96";
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

    if (cursorModeEnabled) {
        document.addEventListener("mouseup", dropPiece);
    }

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

    // Placing a piece down on the board
    document
        .querySelector(".memory_board")
        .addEventListener("click", placePiece);

    // If on mobile, activePiece is not visible on the cursor
    if (viewportWidth <= 450) {
        activePiece.remove();
    }
}

function dropPiece(event) {
    if (activePiece) {
        placePiece(event);
        document.removeEventListener("mousemove", movePiece);
        document.removeEventListener("mouseup", dropPiece);
        activePiece = null;
    }
}

function movePiece(event) {
    if (!activePiece) return;
    activePiece.style.left = `${
        event.clientX + window.scrollX - activePiece.width / 2
    }px`;
    activePiece.style.top = `${
        event.clientY + window.scrollY - activePiece.height / 2
    }px`;
}

let squareWidth, squareHeight;

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

    // Remove a piece from the board if another piece is placed on it using the cursor
    if (cursorModeEnabled === true) {
        if (duplicateContainer.contains(event.target)) {
            duplicateContainer.removeChild(event.target);
        }
    }

    document.addEventListener("click", function (event) {
        if (!activePiece || !event.target.classList.contains("duplicate-piece")) return;
    
        if (duplicateContainer.contains(event.target)) {
            if (activePiece.src === event.target.src || activePiece) {
                duplicateContainer.removeChild(event.target);
                if (activePiece.src !== event.target.src) {
                    placePiece(event);
                }
            }
        }
    });    
}
