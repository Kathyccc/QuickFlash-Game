let currentShape = '';
let currentPanel = '';
let currentShapeColor = '';
let score = 0;
let shapeInterval;
let socket = null;

"use strict"

function countdown(seconds, id) {
    let countdown = seconds;

    const interval = setInterval(()=>{
        document.getElementById(id).innerHTML = countdown;
        countdown--;

        if (countdown < 0) {
            clearInterval(interval)
            if (id == "get_ready") {
                document.getElementById(id).innerHTML = "Start!"

                setTimeout(() => {
                    document.getElementById(id).innerHTML = ""
                }, 2000);
            } else if (id == "game_time") {
                document.getElementById(id).innerHTML = "Time's up! Please wait for other players to finish."
            }
        }
    }, 1000)
}

function setupGameInterface(round) {
    let gameContent;

    // Different HTML content setup based on the round
    if (round === 1) {
        // Setup for the first round
        gameContent = `
            <p id="get_ready" class="get_ready_text" style="color: gray;"></p>
            <div class="game-container">
                <p id="game_time" class="font_irish_grover" style="color: gray;"></p>
            </div>
            <div class="square-container">
                <div class="single_square" style=""><p id="panel" style=""></p></div>
            </div>
            <div class="button-container">
                <div class="single-button-container">
                    <button type="submit" style="" class="game-button-left-default" id="circle_button" onclick="checkAnswer('circle', 1)"></button>
                    <button type="submit" style="" class="game-button-right-default" id="triangle_button" onclick="checkAnswer('triangle', 1)"></button>
                </div>
            </div>
        `;
        
    } else {
        // Setup for the second and third rounds
        gameContent = `
            <p id="get_ready" class="get_ready_text" style="color: gray;"></p>
            <div class="game-container">
                <p id="game_time" class="font_irish_grover" style="color: gray;"></p>
            </div>
            <div class="square-container">
                <div class="double_square" style=""><p id="left-panel"></p></div>
                <div class="double_square" style=""><p id="right-panel"></p></div>
            </div>
            <div class="button-container">
                <div class="double-button-container" style=""><button type="submit" style="" class="game-button-left-default" id="circle_button" onclick="checkAnswer('circle', ${round})"></button></div>
                <div class="double-button-container" style=""><button type="submit" style="" class="game-button-right-default" id="triangle_button" onclick="checkAnswer('triangle', ${round})"></button></div>
            </div>
        `;
    }

    // Update the innerHTML of the game area with the content for the appropriate round
    document.getElementById("game_layout").innerHTML = gameContent;
}

function playRound(round) {
    return new Promise((resolve, reject) => {
        console.log(`Round ${round} start`)
        setupGameInterface(round)
        countdown(5, "get_ready")

        setTimeout(() => {
            countdown(10, "game_time"); 
            displayShape(round)
            startShapeInterval(round)

            const interval = setInterval(() => {
                if (document.getElementById("game_time").innerHTML === "Time's up!") {
                    clearInterval(interval)
                    clearInterval(shapeInterval)
                    console.log(`Round ${round} end`)
                    resetCurrentState()

                    clearGameInterface()

                    submit_score(round)

                    if (round < 3) {  
                        displayNextRoundButton(round)
                    }
                    
                    resolve()
                }
            }, 1000)
        }, 6000) // Wait time after "get ready" counter
    });
}

function resetCurrentState() {
    currentShape = '';
    currentPanel = null;
    currentShapeColor = '';
}

function randomShape() {
    let random = Math.round(Math.random())
    return (random === 0)? "triangle" : "circle";
}

function randomSide() {
    let random = Math.round(Math.random())
    return (random === 0)? "left-panel" : "right-panel";
}

function randomShapeColoar() {
    let random = Math.round(Math.random())
    return (random === 0)? "#FABF7A" : "#A6DFFF";
}

function startShapeInterval(round) {
    // Clear existing interval
    if(shapeInterval) {
        clearInterval(shapeInterval); 
    }
    // Start a new interval, setInterval() returns an interval ID, which is a unique identifier for the interval
    shapeInterval = setInterval(() => {
        if (document.getElementById("game_time").innerHTML !== "Time's up!") {
            displayShape(round)
        }
    }, 3000);
}

function displayShape(round) {
    // console.log(`Display round ${round} shape`)
    switch(round) {
        case 1:
            // Create new currentShape
            currentShape = randomShape();
            const panel = document.getElementById("panel")
            if (panel) {
                panel.classList.remove(`${currentShape}`)
                setTimeout(() => {
                    panel.style.display = 'block'
                    panel.setAttribute("class", `${currentShape}`)
                }, 1000)
            }

            break
        
        case 2:
            // Clear currentShape diaplayed on currentSide
            if (currentPanel !== null) {
                document.getElementById(currentPanel).classList.remove(`${currentShape}`)
            }
            // Create new currentShape and currentPanel
            currentShape = randomShape()
            currentPanel = randomSide()
            
            // Check if the element for the current panel exists
            const currentPanelElement = document.getElementById(currentPanel);
            if (currentPanelElement) {
                // If the element has the currentShape class, remove it
                if (currentPanelElement.classList.contains(currentShape)) {
                    currentPanelElement.classList.remove(currentShape);
                }
                setTimeout(() => {
                    // Check again to ensure the element is still there after timeout
                    const elementToUpdate = document.getElementById(currentPanel);
                    if (elementToUpdate) {
                        elementToUpdate.style.display = 'block';
                        elementToUpdate.setAttribute("class", `${currentShape}`);
                    }
                }, 1000);
            }

            break
        
        case 3:
            if (currentShape === "triangle") {
                if (document.getElementsByClassName(currentShape).length > 0 && "style" in document.getElementsByClassName(currentShape)[0]){
                    document.getElementsByClassName(currentShape)[0].style.borderBottomColor = '';
                }
                // document.getElementsByClassName(currentShape)[0].style.borderBottomColor = '';
            } else if (currentShape === "circle") {
                if (document.getElementsByClassName(currentShape).length > 0 && "style" in document.getElementsByClassName(currentShape)[0]){
                    document.getElementsByClassName(currentShape)[0].style.backgroundColor = '';
                }
                // document.getElementsByClassName(currentShape)[0].style.backgroundColor = '';
            }

            if (currentPanel !== null) {
                document.getElementById(currentPanel).classList.remove(`${currentShape}`);
            }
            // Create new currentShape and currentPanel
            currentShape = randomShape();
            currentPanel = randomSide();
            currentShapeColor = randomShapeColoar();
            if(currentPanel) {
                setTimeout(() => {
                    if (document.getElementById(currentPanel) && document.getElementById(currentPanel).style){
                        document.getElementById(currentPanel).style.display = 'block'; //makes it visible on the page
                        document.getElementById(currentPanel).setAttribute("class", `${currentShape}`);
                    }

                    if (currentShape === "triangle") {
                        if (document.getElementsByClassName(currentShape).length > 0 && "style" in document.getElementsByClassName(currentShape)[0]){
                            document.getElementsByClassName(currentShape)[0].style.borderBottomColor = currentShapeColor;
                        }
                    } else if (currentShape === "circle") {
                        if (document.getElementsByClassName(currentShape).length > 0 && "style" in document.getElementsByClassName(currentShape)[0]){
                        document.getElementsByClassName(currentShape)[0].style.backgroundColor = currentShapeColor;
                        }
                    }
                }, 1000)
            }
            
            break
    }
}

function checkAnswer(selectedShape, round) {
    if (document.getElementById("game_time").innerHTML !== "Time's up!") {
        // Corrected the logical AND operator (&&) for the condition
        // console.log("Selected Shape:", selectedShape, "Current Shape:", currentShape);

        // If the shape was hidden, score won't change after clicking the button
        let panel
        if (round == 1) {
            panel = document.getElementById("panel")
        } else if ((round == 2 || round == 3) ) {
            panel = document.getElementById(currentPanel)
        }
        if (panel.getAttribute("class") !== "circle" && panel.getAttribute("class") !== "triangle") {
            console.log("No shape shown")
            return
        }

        if ((selectedShape === 'circle' && currentShape === "circle") || 
            (selectedShape === 'triangle' && currentShape === "triangle")) {
            score += 100;
        }
        console.log("Score after checking:", score);
        displayShape(round)
        startShapeInterval(round)
    }
}

function connectToServer() {
    const accessTokenElement = document.getElementById('access-token');
    const accessToken = accessTokenElement ? accessTokenElement.innerText : null;
    
    // Use wss: protocol if site using https:, otherwise use ws: protocol
    let wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"

    // Create a new WebSocket.
    let url = `${wsProtocol}//${window.location.host}/quickflash/game_room?token=${encodeURIComponent(accessToken)}`

    socket = new WebSocket(url)

    // Handle any errors that occur.
    socket.onerror = function(error) {
        displayMessage("WebSocket Error: " + error)
    }

    // Show a connected message when the WebSocket is opened.
    socket.onopen = function(event) {
        displayMessage("WebSocket Connected")
        addCurrentPlayers();
    }

    // Show a disconnected message when the WebSocket is closed.
    socket.onclose = function(event) {
        displayMessage("WebSocket Disconnected")
    }
    
    // Handle messages received from the server
    socket.onmessage = async function(event) {
        let data = JSON.parse(event.data)

        // print stringified data to console
        console.log(`Received message from server: `)
        console.log(JSON.stringify(data))

        if (data.error) {
            console.error(data.error);
        } else if (data.message === 'player_exit') {
            alert("One player has exited. The game has ended.");
            window.location.href = '/';
            // document.getElementById("join_room_response").innerHTML = "One player has exited. The game has ended."
        } else if ("final_scores" in data) {
            displayScores(data.final_scores);
        } else if (data.message === 3) {
            // Send 'start_game' action to server
            let data = {"action": "start_game"}
            socket.send(JSON.stringify(data))
            document.getElementById("home_page_container").style.display = 'none'
            await playRound(1)

        } else if (data.message > 3) {
            document.getElementById("join_room_response").innerHTML = "The room is full. Please join later."
            disconnect()
        } else if (data.message < 3) {
            document.getElementById("start_game").setAttribute("hidden", "hidden");
            
            document.getElementById("join_room_response").innerHTML = "The room is not full. Please wait for other players."
        } else if (data.type === 'websocket.close') {
            disconnect()
        }
    }
}

function displayMessage(message) {
    let errorElement = document.getElementById("message")
    errorElement.innerHTML = message
}

function displayResponse(response) {
    if ("error" in response) {
        displayError(response.error)
    } else if ("message" in response) {
        displayMessage(response.message)
    } else {
        displayMessage("Unknown response")
    }
}

function displayError(message) {
    let errorElement = document.getElementById("error")
    errorElement.innerHTML = message
}

function joinRoomRequest() {
    if ((socket && socket.readyState === WebSocket.OPEN)) {
        alert("You are already in a room.")
    } else {
        connectToServer();
    }
}

function addCurrentPlayers() {   
    // console.log("addCurrentPlayers")
    let data = {"action": "add_player"}
    socket.send(JSON.stringify(data))
}

function submit_score(round) {
    console.log(`Round ${round} score: ${score} submitted`)
    // send the score of each round to the server
    socket.send(JSON.stringify({action: "submit_score", round_number: round, score: score}))
    score = 0
}

function disconnect() {
    if (socket) {
      socket.close()
    }
}

function displayScores(scores) {
    const scoreboard = document.getElementById('scoreboard');
    scoreboard.innerHTML = '';

    // Initialize an object to store the players' scores
    let playersScores = {}

    scores.forEach((playerScore) => {
        // If the player does not have an entry yet, create one
        if (!playersScores[playerScore.player__username]) {
            playersScores[playerScore.player__username] = {
                round1: 0,
                round2: 0,
                round3: 0,
                total: 0
            }
        }

        // Add the scores for each round and total score
        playersScores[playerScore.player__username].round1 = playerScore.score_round1
        playersScores[playerScore.player__username].round2 = playerScore.score_round2
        playersScores[playerScore.player__username].round3 = playerScore.score_round3
        playersScores[playerScore.player__username].total = playerScore.total
        console.log(playerScore.player__username)
    })

    // Create an HTML table to display the scores
    const table = document.createElement('table');
    table.classList.add('styled-table');

    // Create a header row for the table
    const headerRow = table.insertRow(0);
    for (const header of ['Username', 'Round 1', 'Round 2', 'Round 3', 'Total']) {
        const headerCell = document.createElement('th');
        headerCell.textContent = header;
        headerCell.style.backgroundColor = '#f3c58f';
        headerCell.style.color = 'white';
        headerRow.appendChild(headerCell);
    }

    // Populate the table with player scores
    let rowIndex = 1;
    for (const username in playersScores) {
        const playerData = playersScores[username];
        const row = table.insertRow(rowIndex);
        rowIndex++;

        for (const key of ['round1', 'round2', 'round3', 'total']) {
            const cell = row.insertCell();
            cell.textContent = playerData[key];
        }

        const usernameCell = row.insertCell(0);
        usernameCell.textContent = username;
    }

    // Append the table to the scoreboard element
    scoreboard.appendChild(table);
    document.getElementById("get_ready").setAttribute("hidden", "hidden");
    document.getElementById("game_time").setAttribute("hidden", "hidden");
}

function displayNextRoundButton(round) {
    const nextRoundButton = document.createElement("button");
    nextRoundButton.setAttribute("class", "default-button");
    nextRoundButton.textContent = `Start Round ${round + 1}`;
    nextRoundButton.onclick = function() {
        playNextRound(round + 1);
    };
    document.getElementById("game_layout").appendChild(nextRoundButton);
}

function playNextRound(round) {
    document.getElementById("game_layout").innerHTML = ''; // Clear the current interface
    playRound(round);
}

function clearGameInterface() {
    // Clear the square container
    const squareContainer = document.querySelector('.square-container');
    if (squareContainer) {
        squareContainer.innerHTML = '';
    }

    // Clear the button container
    const buttonContainer = document.querySelector('.button-container');
    if (buttonContainer) {
        buttonContainer.innerHTML = '';
    }
}
