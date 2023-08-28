document.addEventListener('DOMContentLoaded', () => {
    // Attaching click event to both chess_pieces and trash
    document.querySelectorAll('.chess_pieces, .trash').forEach(piece => {
        piece.addEventListener('click', choosePiece);
        piece.addEventListener('click', cursorDisable);
    });

    // Attach mouseenter and click events to cursor
    document.querySelectorAll('.cursor').forEach(cursor => {
        cursor.addEventListener('mouseenter', () => cursor.style.cursor = "pointer");
        cursor.addEventListener('click', cursorFunct);
    });

    const playButton = document.querySelector('.btn.btn-info');

    playButton.addEventListener("click", function() {
        const csrftoken = getCookie('csrftoken');
        const memoryBoard = document.querySelector(".duplicate_piece_container")

        const piecesByUser = Array.from(memoryBoard.children).map(child => {
            return {
                left: child.left,
            };
        });

        // POST request to Django
        fetch('/memory_rush', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            },
            body: JSON.stringify({
                memoryBoard: memoryBoard,
                }),
        })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.log('Error:', error));
    });
});

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
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
    document.querySelectorAll('.animate-background, .trash')
        .forEach(element => element.style.backgroundColor = "");

    const cursors = document.querySelectorAll('.cursor');

    // Change the background attributes of cursors
    cursors.forEach(cursor => {
        cursor.classList.add("animate-background");
        cursor.style.backgroundColor = "#16ac2aa1";
    });

    // Handle duplicate container clicks
    const duplicateContainer = document.querySelector(".duplicate_piece_container");

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
                    placePiece(event)
                }
            }
            // For moving pieces around on empty squares
            else if (event.target.classList.value === "chess_pieces animate-background duplicate-piece") {
                choosePiece(event);
            }
        };
        
        duplicateContainer.addEventListener("click", duplicateContainerClickListener);
        cursorModeEnabled = true; // set flag to true
    }
}


function cursorDisable() {
    const duplicateContainer = document.querySelector(".duplicate_piece_container");
    const cursors = document.querySelectorAll('.cursor');

    if (cursorModeEnabled) {
        duplicateContainer.removeEventListener("click", duplicateContainerClickListener);
        cursorModeEnabled = false; // set flag back to false

        // Reset the cursor to default
        document.body.style.cursor = "";
        
        cursors.forEach(element => {
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

    const trashs = document.querySelectorAll('.trash');

    // Reset the background color of the previously clicked piece and cursor
    if (previouslyClickedPiece) {
        if (previouslyClickedPiece.className == "trash animate-background") {
            trashs.forEach(trash => {
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
        trashs.forEach(trash => {
            trash.classList.add("animate-background");
            trash.style.backgroundColor = "#f57878f6";
        });

        // Reset activePiece if it's trash
        if (activePiece && activePiece.classList.contains("trash")) {
            activePiece = null; 
        }
    } else {
        clickedPiece.classList.add("animate-background");
        clickedPiece.style.backgroundColor = "#16b0df";
    }

    // Store the reference to the current clicked piece for future use
    previouslyClickedPiece = clickedPiece;

    // Clone and modify the clicked piece to make it the active piece
    activePiece = clickedPiece.cloneNode(true);
    Object.assign(activePiece.style, {
        position: "absolute",
        zIndex: "9998",
        width: "90px",
        height: "90px",
        pointerEvents: "none",  // So it doesn't interfere with other events
        backgroundColor: "",    // Remove inherited background color
        border: "0px"
    });

    activePiece.setAttribute("draggable", "false");

    // Append the active piece to the body and position it
    document.body.appendChild(activePiece);

    // Piece movement logic, eventlisteners etc.

    movePiece(event);  // Position it immediately
    document.addEventListener("mousemove", movePiece);

    let lastMouseEvent = null;
    
    document.addEventListener('mousemove', (event) => {
        lastMouseEvent = event;
    });
    
    
    // Smooth scrolling when a piece is selected
    document.addEventListener('scroll', function() {
        if (activePiece && lastMouseEvent) {
            activePiece.style.left = `${lastMouseEvent.clientX + window.scrollX - activePiece.width / 2}px`;
            activePiece.style.top = `${lastMouseEvent.clientY + window.scrollY - activePiece.height / 2}px`;
        }
    });
    
    function movePiece(event) {
        if (!activePiece) return;
        activePiece.style.left = `${event.clientX + window.scrollX - activePiece.width / 2}px`;
        activePiece.style.top = `${event.clientY + window.scrollY - activePiece.height / 2}px`;
    }
    
    // Placing a piece down on the board
    document.querySelector(".memory_board").addEventListener("click", placePiece);
}


function placePiece(event) {
    if (!activePiece || activePiece.className == "trash animate-background") return;
    
    const boardRect = document.querySelector(".memory_board").getBoundingClientRect();

    const boardContainer = document.querySelector(".board_and_duplicates");
    const duplicateContainer = document.querySelector(".duplicate_piece_container");

    const { left: boardX, top: boardY } = boardRect;

    // Use pageX and pageY for coordinates relative to the whole document
    const x = event.clientX, y = event.clientY;

    const squareWidth = activePiece.width;  
    const squareHeight = activePiece.height;

    // Check if the coordinates (x, y) are within the boundaries of the chess board
    if (x >= boardX && x <= boardX + 8 * squareWidth && y <= boardY + 8 * squareHeight && y >= boardY) {

        // Calculate the grid coordinates (Xcord, Ycord) for the square where the piece should be placed
        const [Xcord, Ycord] = [Math.floor((x - boardX) / squareWidth), Math.floor((y - boardY) / squareHeight)];

        // Calculate the pixel coordinates of the center of the square
        const squareCenter = [Xcord * squareWidth + squareWidth / 2, Ycord * squareHeight + squareHeight / 2];
        
        const duplicate = activePiece.cloneNode(true);

        const boardContainerRect = boardContainer.getBoundingClientRect();
        
        // Assign CSS styles to the duplicate piece for proper positioning
        Object.assign(duplicate.style, {
            position: "absolute",
            left: `${squareCenter[0] - squareWidth / 2 + boardX - boardContainerRect.left}px`,  
            top: `${squareCenter[1] - squareHeight / 2 + boardY - boardContainerRect.top}px`,  
            zIndex: "9997", 
            pointerEvents: "auto"  
        });

        duplicate.classList.add('duplicate-piece');

        duplicate.setAttribute("draggable", "false");

        duplicateContainer.appendChild(duplicate);
    }
        
        // Logic for a piece selected by cursor to not duplicate after dragging 
        if(activePiece && activePiece.className === "chess_pieces animate-background duplicate-piece") {
            activePiece.remove();
            activePiece = null;
        }

        document.addEventListener('click', function(event) {
            if (!activePiece) return;
            
            if (event.target.classList.contains('duplicate-piece')) {
                // If cursor is enabled, remove the chosen piece from the board
                if (cursorModeEnabled && duplicateContainer.contains(event.target)) {
                    duplicateContainer.removeChild(event.target);
                }
                else if (duplicateContainer.contains(event.target)) { 
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
