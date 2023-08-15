document.addEventListener('DOMContentLoaded', (event) => {
    const board = document.querySelector(".memory_board");
    const boardRect = board.getBoundingClientRect();
    const boardX = boardRect.left;
    const boardY = boardRect.top;

    const squareWidth = document.querySelector('.chess_pieces').width;
    const squareHeight = document.querySelector('.chess_pieces').height;

    document.addEventListener('click', function(event) {
        const x = event.clientX;
        const y = event.clientY;
        
        console.log(`X:${x} Y:${y}`)
        
        if (x >= boardX && x <= boardX + 8 * squareWidth && y <= boardY + 8 * squareHeight && y >= boardY) {
            const colIdx = Math.floor((x - boardX) / squareWidth);
            const rowIdx = 7 - Math.floor((y - boardY) / squareHeight); // 7 minus because chess rows start from bottom to top

            const colLetter = String.fromCharCode(65 + colIdx); // Convert 0-7 to A-H
            const rowNumber = rowIdx + 1; // Convert 0-7 to 1-8

            console.log(`${colLetter}${rowNumber}`);

            // Correct Y value
            const Yval = Math.floor((y - boardY) / squareHeight);

            // Get the center of the clicked square
            
            const squareCenterX = boardX + colIdx * squareWidth + squareWidth / 2;
            const squareCenterY = boardY + Yval * squareHeight + squareHeight / 2;

            console.log(`X:${squareCenterX} Y:${squareCenterY}`)

            // Duplicate the image at the center of the clicked square
            const image = document.querySelector(".chess_pieces");
            if (image) {
                const imageDuplicate = image.cloneNode(true);
                imageDuplicate.style.position = "absolute";
                imageDuplicate.style.left = `${squareCenterX - image.width / 2 - 5}px`;
                imageDuplicate.style.top = `${squareCenterY - image.height + image.height / 2 - 5}px`;
                imageDuplicate.style.zIndex = "9999"; // To ensure it's above other elements
                
                document.body.appendChild(imageDuplicate);

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
    const duplicate = activePiece.cloneNode(true);
    document.body.appendChild(duplicate);

    board_width = document.querySelector(".memory_board").width;
    board_height = document.querySelector(".memory_board").height;

    

    // Set the left and top styles of the duplicate to match the activePiece's current position.
    duplicate.style.left = activePiece.style.left;
    duplicate.style.top = activePiece.style.top;

    // Ensure the duplicate doesn't inherit any background.
    duplicate.style.backgroundColor = "";
}

function movePiece(event) {
    if (activePiece) {
        activePiece.style.left = `${event.clientX - activePiece.width / 2}px`;
        activePiece.style.top = `${event.clientY - activePiece.height / 2}px`;
    }
}
