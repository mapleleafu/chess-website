document.addEventListener('DOMContentLoaded', () => {
    const chessPieces = document.getElementsByClassName("chess_pieces");
    const trashPieces = document.getElementsByClassName("trash");
    
    const allPieces = [...chessPieces, ...trashPieces];

    for (let piece of allPieces) {
        piece.addEventListener("click", choosePiece);
    }
});


let activePiece = null;
let previouslyClickedPiece = null;


function choosePiece(event) {
    const clickedPiece = event.target;
    
    if (activePiece) {
        document.removeEventListener("mousemove", movePiece);
        activePiece.remove();
        activePiece = null;  // Make sure to nullify this to prevent lingering references
    }


    // Reset the background color of the previously clicked piece
    if (previouslyClickedPiece) {
        previouslyClickedPiece.style.backgroundColor = "";
        previouslyClickedPiece.classList.remove("animate-background");
    }

    if (event.target.className != "trash"){
        clickedPiece.classList.add("animate-background");
        clickedPiece.style.backgroundColor = "#16b0df";
    } else if (event.target.className == "trash") {
        clickedPiece.classList.add("animate-background");
        clickedPiece.style.backgroundColor = "#f57878f6";
        clickedPiece.setAttribute("draggable", "false");
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

    const boardContainer = document.querySelector(".board-container");


    const { left: boardX, top: boardY } = boardRect;

    // Use pageX and pageY for coordinates relative to the whole document
    const x = event.pageX; 
    const y = event.pageY; 

    const squareWidth = activePiece.width;  
    const squareHeight = activePiece.height;

    if (x >= boardX && x <= boardX + 8 * squareWidth && y <= boardY + 8 * squareHeight && y >= boardY) {
        const [Xcord, Ycord] = [Math.floor((x - boardX - window.scrollX) / squareWidth), Math.floor((y - boardY - window.scrollY) / squareHeight)];
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
        duplicate.setAttribute("draggable", "true"); // Allow dragging on the duplicate piece
        boardContainer.appendChild(duplicate);

    }
}


document.addEventListener('click', function(event) {
    if (event.target.classList.contains('duplicate-piece')) {
        const boardContainer = document.querySelector(".board-container");

        if (activePiece.src === event.target.src) {
            // If the clicked duplicate piece is the same as the active piece
            boardContainer.removeChild(event.target);
        } else if (activePiece) {
            // If there's an active piece and you click on another duplicate piece
            boardContainer.removeChild(event.target);
            placePiece(event); // Put down the active piece
        } else {
            // If there's no active piece and you click on a duplicate piece
            boardContainer.removeChild(event.target);
        }
    }
});
