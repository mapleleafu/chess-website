document.addEventListener('DOMContentLoaded', () => { 
    const pieces = document.getElementsByClassName("chess_pieces");
    for (let piece of pieces) {
        piece.addEventListener("mousedown", startDrag);
    }
});

let activePiece = null;
const boardRect = document.querySelector(".memory_board").getBoundingClientRect();  // Get this once

function startDrag(event) {
    if (activePiece) return;

    const originalPiece = event.target;
    originalPiece.classList.add("animate-background");
    originalPiece.style.backgroundColor = "#139feb93";

    activePiece = originalPiece.cloneNode(true);
    Object.assign(activePiece.style, {
        position: "absolute",
        zIndex: "9999",
        backgroundColor: ""  // Ensure no inherited background color
    });
    movePiece(event); // Position it immediately
    document.body.appendChild(activePiece);

    document.addEventListener("mousemove", movePiece);
    document.addEventListener("dblclick", () => duplicatePiece(boardRect));  // Passing boardRect
}

function duplicatePiece({ left: boardX, top: boardY }) {
    const [x, y] = [event.clientX, event.clientY];
    const [Xcord, Ycord] = [Math.floor((x - boardX) / activePiece.width), Math.floor((y - boardY) / activePiece.height)];
    const squareCenter = [Xcord * activePiece.width + activePiece.width / 2, Ycord * activePiece.height + activePiece.height / 2];
    
    const duplicate = activePiece.cloneNode(true);
    Object.assign(duplicate.style, {
        position: "absolute",
        left: `${squareCenter[0] - activePiece.width / 2 + boardX}px`,
        top: `${squareCenter[1] - activePiece.height / 2 + boardY}px`,
        width: "90px",
        height: "90px",
        border: "0px solid",
        zIndex: "9998",
        backgroundColor: ""
    });
    
    document.body.appendChild(duplicate);
}

function movePiece(event) {
    activePiece.style.left = `${event.clientX - activePiece.width / 2}px`;
    activePiece.style.top = `${event.clientY - activePiece.height / 2}px`;
}
