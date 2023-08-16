document.addEventListener('DOMContentLoaded', () => { 
    const pieces = document.getElementsByClassName("chess_pieces");
    for (let piece of pieces) {
        piece.addEventListener("click", choosePiece);
    }
});

let activePiece = null;
const boardRect = document.querySelector(".memory_board").getBoundingClientRect(); 

let previouslyClickedPiece = null;

function choosePiece(event) {
    if (activePiece) {
        document.removeEventListener("mousemove", movePiece);
        activePiece.remove();
        activePiece = null;  // Make sure to nullify this to prevent lingering references
    }

    const clickedPiece = event.target;

    // Reset the background color of the previously clicked piece
    if (previouslyClickedPiece) {
        previouslyClickedPiece.style.backgroundColor = "";
        previouslyClickedPiece.classList.remove("animate-background");
    }

    clickedPiece.classList.add("animate-background");
    clickedPiece.style.backgroundColor = "#139feb93";
    
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

    activePiece.style.left = `${event.clientX - activePiece.width / 2}px`;
    activePiece.style.top = `${event.clientY - activePiece.height / 2}px`;
}

document.querySelector(".memory_board").addEventListener("click", placePiece);

function placePiece(event) {
    if (!activePiece) return;

    const { left: boardX, top: boardY } = boardRect;
    const x = event.clientX;
    const y = event.clientY;

    const squareWidth = activePiece.width;  
    const squareHeight = activePiece.height;

    if (x >= boardX && x <= boardX + 8 * squareWidth && y <= boardY + 8 * squareHeight && y >= boardY) {
        const [Xcord, Ycord] = [Math.floor((x - boardX) / squareWidth), Math.floor((y - boardY) / squareHeight)];
        const squareCenter = [Xcord * squareWidth + squareWidth / 2, Ycord * squareHeight + squareHeight / 2];
        
        const duplicate = activePiece.cloneNode(true);
        Object.assign(duplicate.style, {
            position: "absolute",
            left: `${squareCenter[0] - squareWidth / 2 + boardX}px`,
            top: `${squareCenter[1] - squareHeight / 2 + boardY}px`,
            zIndex: "9997",
            pointerEvents: "auto"  // <-- Adjusted this to allow events on the duplicate
        });
        
        duplicate.classList.add('duplicate-piece');  // Assign a specific class to each duplicated piece
        
        document.body.appendChild(duplicate);
    }
}


document.addEventListener('dblclick', function(event) {
    if (event.target.classList.contains('duplicate-piece')) {
        document.body.removeChild(event.target);
    }
});