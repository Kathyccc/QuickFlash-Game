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
            } else if (id == "game_time") {
                document.getElementById(id).innerHTML = "Time's up!"
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
            <p id="get_ready"></p>
            <div class="game-container">
                <p id="game_time"></p>
            </div>
            <div class="square-container">
                <p id="panel" style=""></p>
            </div>
            <div class="button-container">
                <button type="submit" class="game-button-left-default" id="circle_button" onclick="checkAnswer('circle', 1)"></button>
                <button type="submit" class="game-button-right-default" id="triangle_button" onclick="checkAnswer('triangle', 1)"></button>
            </div>
        `;
        
    } else {
        // Setup for the second and third rounds
        gameContent = `
            <p id="get_ready"></p>
            <div class="game-container">
                <p id="game_time"></p>
            </div>
            <div class="square-container">
                <div class="square"><p id="left-panel" style=""></p></div>
                <div class="square"><p id="right-panel" style=""></p></div>
            </div>
            <div class="button-container">
                <button type="submit" style="" class="game-button-left-default" id="circle_button" onclick="checkAnswer('circle', ${round})"></button>
                <button type="submit" style="" class="game-button-right-default" id="triangle_button" onclick="checkAnswer('triangle', ${round})"></button>
            </div>
        `;
    }

    // Update the innerHTML of the game area with the content for the appropriate round
    document.getElementById("join_room_response").innerHTML = gameContent;
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
                const panel = document.getElementById(currentPanel)
                if (panel){
                    panel.classList.remove(`${currentShape}`)
                }
                
            }
            // Create new currentShape and currentPanel
            currentShape = randomShape()
            currentPanel = randomSide()
            if(currentPanel) {
                const panel = document.getElementById(currentPanel);
                if (panel) {
                    setTimeout(() => {
                        panel.style.display = 'block';
                        panel.setAttribute("class", `${currentShape}`);
                    }, 1000);
                }
            }

            break
        
        case 3:
            // Clear currentShape diaplayed on currentSide
            if (currentShape === "triangle") {
                const shape = document.getElementsByClassName(currentShape)
                if (shape.length > 0 && shape[0].style){
                    shape[0].style.borderBottomColor = "";
                }
                
            } else if (currentShape === "circle") {
                const shape = document.getElementsByClassName(currentShape)
                if (shape.length > 0 && shape[0].style){
                    shape[0].style.backgroundColor = "";
                }
                
            }
            if (currentPanel !== null) {
                const panel = document.getElementById(currentPanel)
                if (panel){
                    document.getElementById(currentPanel).classList.remove(`${currentShape}`);
                }
                
            }
            // Create new currentShape and currentPanel
            currentShape = randomShape();
            currentPanel = randomSide();
            currentShapeColor = randomShapeColoar();
            if(currentPanel) {
                setTimeout(() => {
                    const panel = document.getElementById(currentPanel);

                    if (panel) {
                        if (panel.style) {
                            panel.style.display = 'block'; // Make it visible on the page if the style property exists
                        }
                    
                        panel.setAttribute("class", `${currentShape}`);
                    }
                    if (currentShape === "triangle") {
                        document.getElementsByClassName(currentShape)[0].style.borderBottomColor = currentShapeColor;
                    } else if (currentShape === "circle") {
                        document.getElementsByClassName(currentShape)[0].style.backgroundColor = currentShapeColor;
                    }
                }, 1000)
            }
            
            break
    }
}

function checkAnswer(selectedShape, round) {
    if (document.getElementById("game_time").innerHTML !== "Time's up!") {
        // Corrected the logical AND operator (&&) for the condition
        if ((selectedShape === 'circle' && currentShape === "circle") || 
            (selectedShape === 'triangle' && currentShape === "triangle")) {
            score += 100;
        }
        displayShape(round)
        startShapeInterval(round)
    }
}

function connectToServer() {
    // Use wss: protocol if site using https:, otherwise use ws: protocol
    let wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:"

    // Create a new WebSocket.
    let url = `${wsProtocol}//${window.location.host}/quickflash/game_room`
    socket = new WebSocket(url)

    // Handle any errors that occur.
    socket.onerror = function(error) {
        displayMessage("WebSocket Error: " + error)
    }

    // Show a connected message when the WebSocket is opened.
    socket.onopen = function(event) {
        displayMessage("WebSocket Connected")
        // console.log("add players")
        addCurrentPlayers();
    }

    // Show a disconnected message when the WebSocket is closed.
    socket.onclose = function(event) {
        // console.log('WebSocket Closed:', event.code, event.reason)
        displayMessage("WebSocket Disconnected")
    }
    
    // Handle messages received from the server
    socket.onmessage = async function(event) {
        let data = JSON.parse(event.data)

        // console.log(data.message)

        if (data.error) {
            console.error(data.error);
        } else if (data.message === 'game_started') {
            console.log(data.message);           
        } else if (data.message == 3) {
            document.getElementById("start_game").setAttribute("hidden", "hidden")

            // Send 'start_game' action to server
            let data = {"action": "start_game"}
            socket.send(JSON.stringify(data))

            await playRound(1)

        } else if (data.message > 3) {
            document.getElementById("join_room_response").innerHTML = "The room is full. Please join later."
            disconnect()
        } else if (data.message < 3) {
            document.getElementById("start_game").setAttribute("hidden", "hidden");
            document.getElementById("join_room_response").innerHTML = "The room is not full. Please wait for other players."
        } else if (data.type === 'final_scores') {
            console.log("received the final scores")

            window.location.href = '/quickflash/final-scores'
            let data = {"action": "received_scores"}
            socket.send(JSON.stringify(data))
            displayScores(data.scores);
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
    connectToServer();
}

function addCurrentPlayers() {   
    // console.log("addCurrentPlayers")
    let data = {"action": "add_player"}
    socket.send(JSON.stringify(data))
}

function submit_score(round) {
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
    })

}

function displayNextRoundButton(round) {
    const nextRoundButton = document.createElement("button");
    nextRoundButton.textContent = `Start Round ${round + 1}`;
    nextRoundButton.onclick = function() {
        playNextRound(round + 1);
    };
    document.getElementById("join_room_response").appendChild(nextRoundButton);
}

function playNextRound(round) {
    document.getElementById("join_room_response").innerHTML = ''; // Clear the current interface
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
