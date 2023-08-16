document.addEventListener('DOMContentLoaded', (event) => {
    const board = document.querySelector(".memory_board");
    const boardRect = board.getBoundingClientRect();
    const boardX = boardRect.left;
    const boardY = boardRect.top;
    
    const squareHeight = document.querySelector('.chess_pieces').height;
    const squareWidth = document.querySelector('.chess_pieces').width;
    
    document.addEventListener('click', function(event) {
        const x = event.clientX;
        const y = event.clientY;
        
        
        if (x >= boardX && x <= boardX + 8 * squareWidth && y <= boardY + 8 * squareHeight && y >= boardY) {
            const colIdx = Math.floor((x - boardX) / squareWidth);
            const rowIdx = 7 - Math.floor((y - boardY) / squareHeight); // 7 minus because chess rows start from bottom to top

            const colLetter = String.fromCharCode(65 + colIdx); // Convert 0-7 to A-H
            const rowNumber = rowIdx + 1; // Convert 0-7 to 1-8

            console.log(`${colLetter}${rowNumber}`);

            // Correct Y value
            const Yval = Math.floor((y - boardY) / squareHeight);

            // Get the center of the clicked square
            
            const squareCenterX = colIdx * squareWidth + squareWidth / 2;
            const squareCenterY = Yval * squareHeight + squareHeight / 2;

            console.log(`X:${x} Y:${y}`)
            console.log(`X:${squareCenterX} Y:${squareCenterY}`)
            
            
            
            // Duplicate the image at the center of the clicked square
            const image = document.querySelector(".chess_pieces");
            if (image) {
                const imageDuplicate = image.cloneNode(true);
                imageDuplicate.style.position = "absolute";
                imageDuplicate.style.left = `${squareCenterX - image.width / 2 + boardRect.left}px`;
                imageDuplicate.style.top = `${squareCenterY - image.height / 2 + boardRect.top}px`;                
                imageDuplicate.style.width = "90px"; 
                imageDuplicate.style.height= "90px"; 
                imageDuplicate.style.border = "0px solid"; 
                imageDuplicate.style.zIndex = "9999"; 
                
                const boardContainer = document.querySelector(".board-container");
                // boardContainer.appendChild(imageDuplicate);

            }
        }
    });

    const pieces = document.getElementsByClassName("chess_pieces");
    for (let piece of pieces) {
        piece.addEventListener("mousedown", startDrag);
    }
});



let activePiece = null;

function startDrag(event) {
    if (activePiece) {
        // If an active piece is already being dragged, do nothing.
        return;
    }

    event.target.classList.add("animate-background");

    // Change the background color of the original piece.
    event.target.style.backgroundColor = "#139feb93";

    const original_piece = event.target;

    activePiece = original_piece.cloneNode(true);
    document.body.appendChild(activePiece);

    // Make sure the cloned activePiece doesn't have the red background.
    activePiece.style.backgroundColor = "";

    activePiece.style.position = "absolute";
    activePiece.style.zIndex = "9999";
    movePiece(event); // Position it immediately

    document.addEventListener("mousemove", movePiece);
    document.addEventListener("dblclick", duplicatePiece);
}

function duplicatePiece(event) {
    // Clone the active piece and append it to the body to leave it where it was double-clicked.
    const board = document.querySelector(".memory_board");
    const boardRect = board.getBoundingClientRect();
    
    const squareHeight = activePiece.height;
    const squareWidth = activePiece.width;

    const boardX = boardRect.left;
    const boardY = boardRect.top;

    const x = event.clientX;
    const y = event.clientY;

    const Xcord = Math.floor((x - boardX) / squareWidth);
    const Ycord = Math.floor((y - boardY) / squareHeight);

    const squareCenterX = Xcord * squareWidth + squareWidth / 2;
    const squareCenterY = Ycord * squareHeight + squareHeight / 2;

    const duplicate = activePiece.cloneNode(true);
    duplicate.classList.add("chess_pieces");
    duplicate.style.position = "absolute";
    duplicate.style.left = `${squareCenterX - activePiece.width / 2 + boardRect.left}px`;
    duplicate.style.top = `${squareCenterY - activePiece.height / 2 + boardRect.top}px`;                
    duplicate.style.width = "90px"; 
    duplicate.style.height= "90px"; 
    duplicate.style.border = "0px solid"; 
    duplicate.style.zIndex = "9999"; 
    
    // Ensure the duplicate doesn't inherit any background.
    duplicate.style.backgroundColor = "";
    
    document.body.appendChild(duplicate);


}

function movePiece(event) {
    if (activePiece) {
        activePiece.style.left = `${event.clientX - activePiece.width / 2}px`;
        activePiece.style.top = `${event.clientY - activePiece.height / 2}px`;
    }
}
