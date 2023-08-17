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

document.addEventListener('scroll', function() {
    if (activePiece && lastMouseEvent) {
        activePiece.style.left = `${lastMouseEvent.clientX + window.scrollX - activePiece.width / 2}px`;
        activePiece.style.top = `${lastMouseEvent.clientY + window.scrollY - activePiece.height / 2}px`;
    }
});


document.querySelector(".memory_board").addEventListener("click", placePiece);

function placePiece(event) {
    if (!activePiece || activePiece.className == "trash animate-background") return;

    // Calculate the boardRect here, inside the placePiece function
    const boardRect = document.querySelector(".memory_board").getBoundingClientRect();

    const { left: boardX, top: boardY } = boardRect;

    // Use pageX and pageY for coordinates relative to the whole document
    const x = event.pageX; 
    const y = event.pageY; 

    const squareWidth = activePiece.width;  
    const squareHeight = activePiece.height;

    if (x >= boardX + window.scrollX && x <= boardX + window.scrollX + 8 * squareWidth && y <= boardY + window.scrollY + 8 * squareHeight && y >= boardY + window.scrollY) {
        const [Xcord, Ycord] = [Math.floor((x - boardX - window.scrollX) / squareWidth), Math.floor((y - boardY - window.scrollY) / squareHeight)];
        const squareCenter = [Xcord * squareWidth + squareWidth / 2, Ycord * squareHeight + squareHeight / 2];
        
        const duplicate = activePiece.cloneNode(true);
        Object.assign(duplicate.style, {
            position: "absolute",
            left: `${squareCenter[0] - squareWidth / 2 + boardX + window.scrollX}px`,
            top: `${squareCenter[1] - squareHeight / 2 + boardY + window.scrollY}px`,
            zIndex: "9997",
            pointerEvents: "auto"  // Allow events on the duplicate
        });
        
        duplicate.classList.add('duplicate-piece');  // Assign a specific class to each duplicated piece
        
        document.body.appendChild(duplicate);
    }
}





document.addEventListener('click', function(event) {
    if (event.target.classList.contains('duplicate-piece')) {
        document.body.removeChild(event.target);
    }
});
