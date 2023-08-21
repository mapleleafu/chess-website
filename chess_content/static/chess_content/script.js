document.addEventListener('DOMContentLoaded', () => {
    const chessPieces = document.getElementsByClassName("chess_pieces");
    const trashPieces = document.getElementsByClassName("trash");
    const cursorPieces = document.getElementsByClassName("cursor");
    
    const allPieces = [...chessPieces, ...trashPieces];

    for (let piece of allPieces) {
        piece.addEventListener("click", choosePiece);
    }
    
    // Cursor is pointer when cursor image is hovered over
    for (let cursor of cursorPieces) {
        cursor.addEventListener("mouseenter", function() {
            cursor.style.cursor = "pointer";
        });
    }
    
    for (let cursor of cursorPieces) {
        cursor.addEventListener("click", cursorFunct) 
    };

});

// TODO: cursor can only replace a piece once. 
// TODO: the logic if piece put down on top of a different piece should be handled properly 

function cursorFunct(event) {
    document.body.style.cursor = "pointer";

    if (activePiece) {
        activePiece.remove();
        activePiece = null;
    }

    // Reset the background color of the rest of the pieces
    const elementsToReset = document.querySelectorAll('.animate-background, .trash');
    elementsToReset.forEach(element => element.style.backgroundColor = "");

    event.target.classList.add("animate-background");
    event.target.style.backgroundColor = "#16ac2aa1";

    const duplicates = document.getElementsByClassName("chess_pieces animate-background duplicate-piece");
    for (let duplicate of duplicates) {
        duplicate.addEventListener("click", cursor_move_piece);
    }

    function cursor_move_piece(event) {
        choosePiece(event);
    }

}


let activePiece = null;
let previouslyClickedPiece = null;


function choosePiece(event) {    
    document.body.style.cursor = "";

    if (event.target.className === "chess_pieces animate-background duplicate-piece") {
        document.body.style.cursor = "pointer";
    }
    
    const cursors = document.querySelectorAll('.cursor');

    const clickedPiece = event.target;
    
    if (activePiece) {
        document.removeEventListener("mousemove", movePiece);
        activePiece.remove();
        activePiece = null;
    }


    // Reset the background color of the previously clicked piece and cursor
    if (previouslyClickedPiece) {
        previouslyClickedPiece.style.backgroundColor = "";
        previouslyClickedPiece.classList.remove("animate-background");

        cursors.forEach(element => {
            element.style.backgroundColor = "";
            element.classList.remove("animate-background");
        });
    }

    if (event.target.className != "trash"){
        clickedPiece.classList.add("animate-background");
        clickedPiece.style.backgroundColor = "#16b0df";

        cursors.forEach(element => {
            element.style.backgroundColor = "";
            element.classList.remove("animate-background");
        });
        
    } else if (event.target.className == "trash") {
        clickedPiece.classList.add("animate-background");
        clickedPiece.style.backgroundColor = "#f57878f6";
        clickedPiece.setAttribute("draggable", "false");

        cursors.forEach(element => {
            element.style.backgroundColor = "";
            element.classList.remove("animate-background");
        });
    }
    
    previouslyClickedPiece = clickedPiece;  // Store the reference to the current clicked piece for future use


    activePiece = clickedPiece.cloneNode(true);
    Object.assign(activePiece.style, {
        position: "absolute",
        zIndex: "9998",
        width: "90px",
        height: "90px",
        pointerEvents: "none", // So it doesn't interfere with other events
        backgroundColor: "",   // Remove inherited background color
        border: "0px"
    });

    document.body.appendChild(activePiece);
    movePiece(event);  // Position it immediately
    document.addEventListener("mousemove", movePiece);
}


function movePiece(event) {
    if (!activePiece) return;
    activePiece.style.left = `${event.clientX + window.scrollX - activePiece.width / 2}px`;
    activePiece.style.top = `${event.clientY + window.scrollY - activePiece.height / 2}px`;
}


let lastMouseEvent = null;


document.addEventListener('mousemove', (event) => {
    try {console.log(activePiece.className)
    } catch (error){

    }
    lastMouseEvent = event;
});


// Smooth scrolling when a piece is selected
document.addEventListener('scroll', function() {
    if (activePiece && lastMouseEvent) {
        activePiece.style.left = `${lastMouseEvent.clientX + window.scrollX - activePiece.width / 2}px`;
        activePiece.style.top = `${lastMouseEvent.clientY + window.scrollY - activePiece.height / 2}px`;
    }
});


document.querySelector(".memory_board").addEventListener("click", placePiece);

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

    if (x >= boardX && x <= boardX + 8 * squareWidth && y <= boardY + 8 * squareHeight && y >= boardY) {
        const [Xcord, Ycord] = [Math.floor((x - boardX) / squareWidth), Math.floor((y - boardY) / squareHeight)];
        const squareCenter = [Xcord * squareWidth + squareWidth / 2, Ycord * squareHeight + squareHeight / 2];
        
        const duplicate = activePiece.cloneNode(true);

        const boardContainerRect = boardContainer.getBoundingClientRect();
        
        Object.assign(duplicate.style, {
            position: "absolute",
            left: `${squareCenter[0] - squareWidth / 2 + boardX - boardContainerRect.left}px`,  
            top: `${squareCenter[1] - squareHeight / 2 + boardY - boardContainerRect.top}px`,  
            zIndex: "9997",
            pointerEvents: "auto"
        });

        duplicate.classList.add('duplicate-piece');  // Assign a specific class to each duplicated piece
        duplicate.setAttribute("draggable", "false"); // Allow dragging on the duplicate piece

        duplicateContainer.appendChild(duplicate);
        if(activePiece && activePiece.className === "chess_pieces animate-background duplicate-piece") {
            activePiece.remove();
            // Reset activePiece to null
            activePiece = null;
        }

    }
    
}


document.addEventListener('click', function(event) {
    if (!activePiece) return;
    if (event.target.classList.contains('duplicate-piece')) {
        const duplicateContainer = document.querySelector(".duplicate_piece_container");

        if (activePiece.src === event.target.src) {
            // If the clicked duplicate piece is the same as the active piece
            duplicateContainer.removeChild(event.target);
        } else if (activePiece) {
            // If there's an active piece and you click on another duplicate piece
            duplicateContainer.removeChild(event.target);
            placePiece(event); // Put down the active piece
        } else {
            // If there's no active piece and you click on a duplicate piece
            duplicateContainer.removeChild(event.target);
        }
    }
});
