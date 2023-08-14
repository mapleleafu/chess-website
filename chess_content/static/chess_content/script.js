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
        
        if (x >= boardX && x <= boardX + 8 * squareWidth && y <= boardY + 8 * squareHeight && y >= boardY) {
            const colIdx = Math.floor((x - boardX) / squareWidth);
            const rowIdx = 7 - Math.floor((y - boardY) / squareHeight); // 7 minus because chess rows start from bottom to top

            const colLetter = String.fromCharCode(65 + colIdx); // Convert 0-7 to A-H
            const rowNumber = rowIdx + 1; // Convert 0-7 to 1-8

            console.log(`${colLetter}${rowNumber}`);
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

    // Change the background color of the original piece.
    event.target.style.backgroundColor = "#139feb";

    const originalPiece = event.target;

    activePiece = originalPiece.cloneNode(true);
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
