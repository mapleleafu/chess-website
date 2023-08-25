document.addEventListener('DOMContentLoaded', () => {
    // Attaching click event to both chess_pieces and trash
    document.querySelectorAll('.chess_pieces, .trash').forEach(piece => {
        piece.addEventListener('click', choosePiece);
    });

    // Attach mouseenter and click events to cursor
    document.querySelectorAll('.cursor').forEach(cursor => {
        cursor.addEventListener('mouseenter', () => cursor.style.cursor = "pointer");
        cursor.addEventListener('click', cursorFunct);
    });
});



let duplicateContainerClickListener;
let cursorMode = false;

function cursorFunct(event) {
    cursorMode = true;
    document.body.style.cursor = "pointer";

    if (activePiece) {
        activePiece.remove();
        activePiece = null;
    }

    // Reset background colors
    document.querySelectorAll('.animate-background, .trash')
        .forEach(element => element.style.backgroundColor = "");

    // Add color and animation to the cursor
    event.target.classList.add("animate-background");
    event.target.style.backgroundColor = "#16ac2aa1";

    // Handle duplicate container clicks
    const duplicateContainer = document.querySelector(".duplicate_piece_container");

    if (cursorMode === false) {
        duplicateContainer.removeEventListener("click", duplicateContainerClickListener);
    }

    duplicateContainerClickListener = (event) => {
        if (event.target.classList.value === "chess_pieces animate-background duplicate-piece") {
            choosePiece(event);
        }
    };

    duplicateContainer.addEventListener("click", duplicateContainerClickListener);

    // Reset cursorMode for non-cursor original pieces
    document.querySelectorAll('.chess_pieces, .trash')
        .forEach(piece => piece.addEventListener('click', (event) => {
            if (!event.target.classList.contains('duplicate-piece')) {
                cursorMode = false;
            }
        }));

}



let activePiece = null;
let previouslyClickedPiece = null;


function choosePiece(event) {
    // Reset the cursor to default
    document.body.style.cursor = "";

    // Get the clicked element
    let clickedPiece = event.target;

    // If the trash bin is clicked, cursorMode should be set to false
    if (clickedPiece.classList.contains("trash")) {
        cursorMode = false; // <-- Added this line
    }

    // Handle other chess pieces and cursor
    const cursors = document.querySelectorAll('.cursor');

    // Remove the previous active piece
    if (activePiece) {
        document.removeEventListener("mousemove", movePiece);
        activePiece.remove();
        activePiece = null;
    }

    // Reset the background color of the previously clicked piece and cursor
    if (previouslyClickedPiece) {
        previouslyClickedPiece.style.backgroundColor = "";
        previouslyClickedPiece.classList.remove("animate-background");
    }

    // Different behavior depending on whether the trash bin or a chess piece is clicked
    if (clickedPiece.classList.contains("trash")) {
        clickedPiece.classList.add("animate-background");
        clickedPiece.style.backgroundColor = "#f57878f6";
        clickedPiece.setAttribute("draggable", "false");

        // Reset activePiece if it's trash
        if (activePiece && activePiece.classList.contains("trash")) {
            activePiece = null; // <-- Added this line
        }
    } else {
        clickedPiece.classList.add("animate-background");
        clickedPiece.style.backgroundColor = "#16b0df";

        // Reset the cursor background color
        cursors.forEach(element => {
            element.style.backgroundColor = "";
            element.classList.remove("animate-background");
        });
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

    // Append the active piece to the body and position it
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
    // try {console.log(activePiece.className)
    // } catch (error){}
    console.log(cursorMode)
    
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
        
        // Logic for a piece selected by cursor to not duplicate after dragging 
        if(activePiece && activePiece.className === "chess_pieces animate-background duplicate-piece") {
            activePiece.remove();
            // Reset activePiece to null
            activePiece = null;
        }

    }
    
}


document.addEventListener('click', function(event) {
    if (!activePiece) return;
    if (event.target.classList.contains('duplicate-piece')){
        console.log(event.target.className)
        console.log(activePiece)
    }
    if (event.target.classList.contains('duplicate-piece')) {
        const duplicateContainer = document.querySelector(".duplicate_piece_container");

        if (activePiece.src === event.target.src) {
            console.log("1")
            // If the clicked duplicate piece is the same as the active piece
            duplicateContainer.removeChild(event.target);
        } else if (activePiece) {
            console.log("2")
            // If there's an active piece and you click on another duplicate piece
            duplicateContainer.removeChild(event.target);
            placePiece(event); // Put down the active piece
        } else {
            console.log("3")
            // If there's no active piece and you click on a duplicate piece
            duplicateContainer.removeChild(event.target);
        }
    }
});

