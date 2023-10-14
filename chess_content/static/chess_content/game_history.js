document.addEventListener("DOMContentLoaded", () => {
    // Detect if the device is a touch device
    if ('ontouchstart' in document.documentElement) {
        document.body.classList.add('touch-device');
    }

    document.querySelectorAll(".game").forEach((element) => {
        const boardContainer = element.querySelector(".board_container");
        const pieceContainer = element.querySelector(".piece_container");

        // Create and append the chessboard image to each game
        const img = document.createElement("img");
        img.src = "static/chess_content/assets/memory_rush_items/board.svg";
        img.alt = "chess_board";
        const dimensionValues = 240;
        img.width = dimensionValues;
        img.height = dimensionValues;
        img.draggable = false;
        img.style.userSelect = "none";
        img.style.webkitUserDrag = "none";
        img.classList.add("profile_board");
        boardContainer.appendChild(img);

        // Get the FEN for each game
        let fenData = element.getAttribute("data-fen");
        const isOngoing =
            element.querySelector(".game_info").getAttribute("data-is-on") ===
            "True";
        const copyButton = element.querySelector(".copy");
        if (isOngoing && copyButton) {
            copyButton.remove();
            fenData = randomFEN();
        }
        // Convert FEN to board and place pieces
        const boardFromFEN = fenToBoard(fenData);
        placePiecesFromFEN(boardFromFEN, pieceContainer, dimensionValues);
    });

    let newestFirst = true; // Initialize the variable to true

    const toggleButton = document.getElementById("toggleOrder");
    if (toggleButton) {
        toggleButton.addEventListener("click", function () {
            const profileGames = document.querySelector(".profile_games");
            const games = Array.from(profileGames.querySelectorAll(".game"));

            games.reverse().forEach((game) => profileGames.appendChild(game));

            newestFirst = !newestFirst; // Toggle the flag
            toggleButton.textContent = newestFirst ? "Oldest" : "Newest";
        });
    }

    document.querySelectorAll(".attempt_icon").forEach((element) => {
        element.addEventListener("click", () => {
            openModal(element);
        });

        document.addEventListener("mouseover", function(event) {
            if (event.target.closest('.attempt_icon')) {
                const closestGameInfo = event.target.closest('.game_info');
                if (closestGameInfo) {
                    closestGameInfo.classList.add('no-hover');
                }
            }
        });
        
        document.addEventListener("mouseout", function(event) {
            if (event.target.closest('.attempt_icon')) {
                const closestGameInfo = event.target.closest('.game_info');
                if (closestGameInfo) {
                    closestGameInfo.classList.remove('no-hover');
                }
            }
        });
    });

    showMessageOnLoad();

    // If there is a message, make the attempt icon clickable
    const messageElements = document.querySelectorAll(
        ".message_container .error, .message_container .success"
    );
    const attemptIconWithGameNumber1 = document.querySelector(
        '.attempt_icon[game_number="1"]'
    );

    if (messageElements.length > 0) {
        attemptIconClick(attemptIconWithGameNumber1, messageElements);
    }
});

function attemptIconClick(attemptIconWithGameNumber1, messageElements) {
    const imgElement = attemptIconWithGameNumber1.querySelector("img");
    if (imgElement) {
        imgElement.classList.add("spin");
    }
    messageElements.forEach((messageElement) => {
        messageElement.style.cursor = "pointer";
        messageElement.addEventListener("click", () => {
            if (attemptIconWithGameNumber1) {
                attemptIconWithGameNumber1.click();
            }
        });
    });
    attemptIconWithGameNumber1.addEventListener("click", () => {
        imgElement.classList.remove("spin");
    });
}

// Function to open the modal
function openModal(element) {
    fetch(`/get_attempt_history?fen_string=${encodeURIComponent(element.id)}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => response.json())
        .then((data) => {
            loadModalContent(data);
        })
        .catch((error) => {
            console.log("Error:", error);
        });

    const modalSection = document.querySelector(".modal-section");
    modalSection.style.display = "flex";

    modalSection.addEventListener("click", () => {
        hideModal();
    });
}

function loadModalContent(data) {
    hideModal();
    const modalSection = document.querySelector(".modal-section");
    modalSection.style.display = "flex";

    const innerModal = document.createElement("div");
    innerModal.classList.add("inner-modal");

    const innerFlexContainer = document.createElement("div");
    innerFlexContainer.classList.add("inner-flex-container");

    innerModal.appendChild(innerFlexContainer);

    modalSection.appendChild(innerModal);

    for (let i = 0; i < data.round_data.length; i++) {
        const boardContainer = document.createElement("div");
        boardContainer.classList.add("board_container");
        boardContainer.classList.add("modal_board");

        const img = document.createElement("img");
        img.src = "static/chess_content/assets/memory_rush_items/board.svg";
        img.alt = "history_chess_board";
        const dimensionValues = 240;
        img.width = dimensionValues;
        img.height = dimensionValues;
        img.draggable = false;
        boardContainer.appendChild(img);

        const pieceContainer = document.createElement("div");
        pieceContainer.classList.add("piece_container");
        pieceContainer.classList.add("modal_piece");
        boardContainer.appendChild(pieceContainer);

        const infoDiv = document.createElement("div");
        // Add claslist info-section correct if success is true in datainfo, add info-section wrong if success is false
        infoDiv.classList.add("info-section");
        if (data.round_data[i].success) {
            infoDiv.classList.add("info-section-correct");
        } else if (data.round_data[i].fen_string === "abandoned") {
            infoDiv.classList.add("info-section-abandoned");

            const abandonedText = document.createElement("div");
            abandonedText.classList.add("abandoned-text");
            abandonedText.innerText = "ABANDONED\n THE GAME";
            boardContainer.appendChild(abandonedText);
        } else {
            infoDiv.classList.add("info-section-wrong");
        }

        const textContainer = document.createElement("div");
        textContainer.classList.add("text-container");
        infoDiv.appendChild(textContainer);

        const roundNumber = document.createElement("p");
        roundNumber.innerText = `Round ${data.round_data[i].round_number}`;
        textContainer.appendChild(roundNumber);

        const playedAt = document.createElement("p");
        const playedAtStr = data.round_data[i].played_at;
        const [time, date] = playedAtStr.split(" ");
        const [day, month, year] = date.split("-").map(Number);
        const [hour, minute] = time.split(":").map(Number);

        // Showing correct time in the modal depending on user's timezone
        const fullDateObj = new Date(Date.UTC(2000 + year, month - 1, day, hour, minute));
        const shortDate = `${fullDateObj.getDate()}/${fullDateObj.getMonth() + 1}`;

        const dateOptions = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        };
        const timeOptions = {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
        };
        const longDate = `${fullDateObj.toLocaleDateString(
            "en-US",
            dateOptions
        )} at ${fullDateObj.toLocaleTimeString("en-US", timeOptions)}`;

        playedAt.dataset.fullDate = longDate;
        playedAt.innerText = shortDate;
        playedAt.title = longDate;
        textContainer.appendChild(playedAt);

        const boardWrapper = document.createElement("div");
        boardWrapper.classList.add("board-wrapper");
        boardWrapper.appendChild(boardContainer);
        boardWrapper.appendChild(infoDiv);

        innerFlexContainer.appendChild(boardWrapper);

        // Prevent the modal from closing when clicking on the board
        const boardWrappers = document.querySelectorAll(".board-wrapper");

        boardWrappers.forEach((wrapper) => {
            wrapper.addEventListener("click", (e) => {
                e.stopPropagation();
            });
        });

        const fenData = data.round_data[i].fen_string;
        const boardFromFEN = fenToBoard(fenData);
        placePiecesFromFEN(boardFromFEN, pieceContainer, dimensionValues);
    }
}

function hideModal() {
    const elements = document.querySelectorAll(".inner-modal");
    for (let i = 0; i < elements.length; i++) {
        elements[i].remove();
    }
    document.querySelector(".modal-section").style.display = "none";
}

function showMessageOnLoad() {
    const errorInfoStr = localStorage.getItem("errorInfo");
    let errorMessage = null;
    let errorMessageSecond = null;

    if (errorInfoStr) {
        const errorInfo = JSON.parse(errorInfoStr);
        errorMessage = errorInfo.message;
        errorMessageSecond = errorInfo.countdownNumber;
    } else {
        errorMessage = localStorage.getItem("errorMessage");
    }

    const successMessage = localStorage.getItem("successMessage");

    if (errorMessage) {
        displayErrorMessage(errorMessage, errorMessageSecond);
        localStorage.removeItem("errorMessage");
        localStorage.removeItem("errorInfo");
    }

    if (successMessage) {
        displaySuccessMessage();
        localStorage.removeItem("successMessage");
    }
}

function displayErrorMessage(
    errorMessage,
    errorMessageSecond,
    removeAfterTimeout
) {
    if (!errorMessage) return;

    const messagesDiv = document.querySelector(".message_container");

    messagesDiv.style.display = "flex";
    messagesDiv.classList.add("messages");
    messagesDiv.innerHTML = `<li class="error">${errorMessage}</li>`;
    messagesDiv.style.display = "flex";

    if (removeAfterTimeout) {
        setTimeout(() => {
            messagesDiv.innerHTML = "";
        }, errorMessageSecond * 1000);
    }
}

function displaySuccessMessage() {
    const message = localStorage.getItem("successMessage");
    if (!message) return;

    const messagesDiv = document.querySelector(".message_container");

    messagesDiv.style.display = "flex";
    messagesDiv.classList.add("messages");
    messagesDiv.innerHTML = `<li class="success">${message}</li>`;
    messagesDiv.style.display = "flex";

    localStorage.removeItem("successMessage");
}

function randomFEN() {
    const pieces = ["p", "r", "n", "b", "q", "k", "P", "R", "N", "B", "Q", "K"];
    let fen = "";

    for (let row = 0; row < 8; row++) {
        let empty = 0;

        for (let col = 0; col < 8; col++) {
            if (Math.random() > 0.7) {
                if (empty > 0) {
                    fen += empty;
                    empty = 0;
                }
                const randomPiece =
                    pieces[Math.floor(Math.random() * pieces.length)];
                fen += randomPiece;
            } else {
                empty++;
            }
        }

        if (empty > 0) {
            fen += empty;
        }

        if (row < 7) {
            fen += "/";
        }
    }

    fen += " w KQkq - 0 1";
    return fen;
}

function placePiecesFromFEN(board, pieceContainer, dimensionValues) {
    if (!board) {
        return;
    }

    const squareWidth = dimensionValues / 8;
    const squareHeight = dimensionValues / 8;

    // Mapping of FEN pieces to their image URLs
    const pieceToImage = {
        // White pieces
        K: "/static/chess_content/assets/pieces/wk.png",
        Q: "/static/chess_content/assets/pieces/wq.png",
        R: "/static/chess_content/assets/pieces/wr.png",
        N: "/static/chess_content/assets/pieces/wn.png",
        B: "/static/chess_content/assets/pieces/wb.png",
        P: "/static/chess_content/assets/pieces/wp.png",

        // Black pieces
        k: "/static/chess_content/assets/pieces/bk.png",
        q: "/static/chess_content/assets/pieces/bq.png",
        r: "/static/chess_content/assets/pieces/br.png",
        n: "/static/chess_content/assets/pieces/bn.png",
        b: "/static/chess_content/assets/pieces/bb.png",
        p: "/static/chess_content/assets/pieces/bp.png",
    };

    pieceContainer.innerHTML = ""; // Clear any existing pieces in the container
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            const piece = board[y][x];

            if (piece) {
                const duplicate = document.createElement("img");
                duplicate.src = pieceToImage[piece];
                const filename = pieceToImage[piece].split("/").pop();
                duplicate.alt = filename;
                Object.assign(duplicate.style, {
                    position: "absolute",
                    left: `${x * squareWidth}px`,
                    top: `${y * squareHeight}px`,
                    width: `${squareWidth}px`,
                    height: `${squareHeight}px`,
                    zIndex: "9997",
                    pointerEvents: "auto",
                    webkitUserDrag: "none",
                    userSelect: "none",
                    border: "0px",
                });
                duplicate.classList.add("profile_piece");
                duplicate.setAttribute("draggable", "false");
                pieceContainer.appendChild(duplicate);
            }
        }
    }
}

function fenToBoard(fen) {
    if (!fen || fen === "abandoned") {
        return;
    }
    const [fenBoard] = fen.split(" ");

    const fenRanks = fenBoard.split("/");

    const board = [];

    for (const fenRank of fenRanks) {
        const rank = [];
        for (const char of fenRank) {
            if (isNaN(char)) {
                rank.push(char);
            } else {
                const emptySquares = parseInt(char, 10);
                for (let i = 0; i < emptySquares; i++) {
                    rank.push(null);
                }
            }
        }
        board.push(rank);
    }
    return board;
}

function copyToClipboard(text) {
    navigator.clipboard
        .writeText(text)
        .then(function () {
            console.log(`Copied ${text} to clipboard successfully!`);
        })
        .catch(function () {
            console.log("Unable to copy to clipboard!");
        });
}

// Maximizing FEN text to 20 characters, and then it goes to a new line
$(document).ready(function () {
    $(".fen_string").each(function () {
        var text = $(this).text();
        var modifiedText = "";

        for (var i = 0; i < text.length; i++) {
            modifiedText += text[i];
            if ((i + 1) % 25 === 0) {
                modifiedText += "<br>";
            }
        }

        $(this).html(modifiedText);
    });

    $(".copy").click(function () {
        const text = $(this).parent().parent().attr("data-fen");
        copyToClipboard(text);

        $(this).find(".fa-clipboard").hide();
        $(this).find(".fa-check").show();

        setTimeout(() => {
            $(this).find(".fa-check").hide();
            $(this).find(".fa-clipboard").show();
        }, 3000);
    });
});

// Add 'shift-left' to child divs in '.game_info' with '✅', excluding '.copy'
$(document).ready(function () {
    $(".game_info").each(function () {
        if ($(this).find("div:contains('✅')").length > 0) {
            $(this).find("div").not(".copy").addClass("shift-left");
        }
    });
});

let lastIndex = 12;

// More games button
$(document).ready(function () {
    let currentPage = 1;

    $("#loadMoreGames").on("click", function () {
        currentPage++;
        $.get("/game_history?page=" + currentPage, function (data) {
            const parser = new DOMParser();
            const html = parser.parseFromString(data, "text/html");
            const games = html.querySelectorAll(".game");
            const profileGames = document.querySelector(".profile_games");
            games.forEach((game) => profileGames.appendChild(game));

            // Add the board image to the board containers, and add pieces to the piece containers
            games.forEach((game) => {
                const boardContainer = game.querySelector(".board_container");
                const pieceContainer = game.querySelector(".piece_container");

                const img = document.createElement("img");
                img.src =
                    "static/chess_content/assets/memory_rush_items/board.svg";
                img.alt = "chess_board";
                const dimensionValues = 240;
                img.width = dimensionValues;
                img.height = dimensionValues;
                img.draggable = false;
                img.style.userSelect = "none";
                img.style.webkitUserDrag = "none";
                img.classList.add("profile_board");
                boardContainer.appendChild(img);

                // Set the ID of the game
                game.id = "game" + ++lastIndex;

                const attemptIcon = game.querySelector(".attempt_icon");
                attemptIcon.addEventListener("click", () => {
                    openModal(attemptIcon);
                });

                const fenData = game.getAttribute("data-fen");
                const boardFromFEN = fenToBoard(fenData);
                placePiecesFromFEN(
                    boardFromFEN,
                    pieceContainer,
                    dimensionValues
                );

                $(game)
                .find(".copy")
                .click(function () {
                    const text = $(this).parent().parent().attr("data-fen");
                    copyToClipboard(text);

                    $(this).find(".fa-clipboard").hide();
                    $(this).find(".fa-check").show();

                    setTimeout(() => {
                        $(this).find(".fa-check").hide();
                        $(this).find(".fa-clipboard").show();
                    }, 3000);
                });
            });

            // If there are no more games to load, hide the button
            if (games.length === 0) {
                $("#loadMoreGames").hide();
            }
        });
    });
});
