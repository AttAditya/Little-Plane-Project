// Dictionary to track the current state of key presses
let keysPressed = {};

// Flag to check if the sprint mode is active
let sprinting = false;

// Flag to determine if the canvas needs a redraw
let needsRedraw = false;

//Unit Vector for direction
let dx = 0;
let dy = -1;

//player Angle for plane's yaw 
let playerAngle = -3.14 / 2;
let yawStrength = 0.02; //the strength of rotation

//constant flight toggle
let constantFlight = false;

//pause
let pause = true;
    
let t = 0;
let cooldown = 0;

// speed of the plane
let minSpeed = 0.5;
let maxSpeed = 1.5;
let throttlePower = 0.5;

// altitude based
let minAltitude = 100;
let maxAltitude = 1000;
let altSpeed = 1;

//update dx and dy based on player angle
const updateDirection = () => {
    dx = Math.cos(playerAngle);
    dy = Math.sin(playerAngle);
}

// Defining constants for keys to improve readability
const KEYS = {
    W: 'w',
    A: 'a',
    S: 's',
    D: 'd',
    ARROW_UP: 'ArrowUp',
    ARROW_DOWN: 'ArrowDown',
    ARROW_LEFT: 'ArrowLeft',
    ARROW_RIGHT: 'ArrowRight',
    LT_SQ_BRACKET: "[",
    RT_SQ_BRACKET: "]",
    ToggleForward: 'e',
};

// Registering keypress and release events
document.addEventListener("keydown", registerKeyPress);
document.addEventListener("keyup", deregisterKeyPress);

// Handler for key press events
function registerKeyPress(e) {
    if (handler.isFocused) return; // Makes sure commands aren't being typed
    keysPressed[formatKey(e.key)] = true;
}

// Handler for key release events
function deregisterKeyPress(e) {
    keysPressed[formatKey(e.key)] = false;
}

function formatKey(key) {
    return key.startsWith("Arrow") ? key : key.toLowerCase();
}

// Elevate the sea level
function elevateAltitude(dz) {
    let oldCamHeight = cameraHeight(altitudeFromGround);

    altitudeFromGround += dz;
    altitudeFromGround = clamp(
        altitudeFromGround,
        minAltitude,
        maxAltitude
    );

    let newCamHeight = cameraHeight(altitudeFromGround);
    let camHeightRatio = newCamHeight / oldCamHeight;
    
    posX /= camHeightRatio;
    posY /= camHeightRatio;

    needsRedraw = true;
    altimeterUpdate();
}

function clamp(value, min, max) {
    if (value < min) {
        return min;
    }

    if (value > max) {
        return max;
    }

    return value;
}

function speedometerUpdate() {
    $speed.innerHTML = `Speed: ${speed}`;

    let speedometerNeedleAnglePercent = (speed - minSpeed);
    speedometerNeedleAnglePercent /= (maxSpeed - minSpeed);
    speedometerNeedleAnglePercent *= 100;

    updateSpeedometerNeedle(speedometerNeedleAnglePercent);
}

function altimeterUpdate() {
    let displayAltitude = Math.round(altitudeFromGround);
    $altitude.innerHTML = "Altitude = " + displayAltitude;
    $settingsAltitude.innerHTML = "Altitude: " + displayAltitude;

    let altimeterNeedleAnglePercent = (altitudeFromGround - minAltitude);
    altimeterNeedleAnglePercent /= (maxAltitude - minAltitude);
    altimeterNeedleAnglePercent = altimeterNeedleAnglePercent;
    altimeterNeedleAnglePercent *= 100;

    let adjustedShadowHeight = 1.01 - (altimeterNeedleAnglePercent / 100);
    adjustedShadowHeight *= adjustedShadowHeight * adjustedShadowHeight;

    plane.setShadowHeight(adjustedShadowHeight);
    updateAltimeterNeedle(altimeterNeedleAnglePercent * 1.5);
}

function throttleChange(updateFn) {
    let shouldClamp = true;

    if (minSpeed > speed || speed > maxSpeed) {
        shouldClamp = false;
    }

    speed = updateFn(speed, throttlePower / 100);
    if (shouldClamp) {
        speed = clamp(speed, minSpeed, maxSpeed);
    }

    speedometerUpdate();
}

// Movement Rotation
function moveRotate(dx, dy , keyPressedFlag) {

    // Update the position of plane based on the direction of movement, only if any of the keys is pressed
    if (keyPressedFlag) {
        posX += dx * speed * 10 + 30 * dx * t;
        posY += dy * speed * 10 + 30 * dy * t;
        // console.log(t);
    }
    // // Rotate the plane based on the direction of movement

    if(dx === 0 && dy === 0) /*Blank case*/;
    else if(dx >= 0) plane.rotate(Math.atan(dy/dx) + Math.PI/2);
    else plane.rotate(Math.atan(dy/dx) - Math.PI/2);
    // console.log(Math.atan(-dy/dx)*180/Math.PI);

    // Set the flag to redraw the canvas
    needsRedraw = true;
}

// Dictionary to map input keys to change the playerAngle
const horizontalMapping = {
    [KEYS.A]: () => { playerAngle -= yawStrength , updateDirection()},
    [KEYS.ARROW_LEFT]: () => { playerAngle -= yawStrength , updateDirection()},
    [KEYS.D]: () => { playerAngle += yawStrength , updateDirection()},
    [KEYS.ARROW_RIGHT]: () => { playerAngle += yawStrength , updateDirection()},
};

// Dictionary to map input keys to toggle throttle
const verticalMapping = {
    [KEYS.W]: () => { throttleChange((s, tp) => s + tp) },
    [KEYS.ARROW_UP]: () => { throttleChange((s, tp) => s + tp) },
    [KEYS.S]: () => { throttleChange((s, tp) => s - tp) },
    [KEYS.ARROW_DOWN]: () => { throttleChange((s, tp) => s - tp) },
};

// Function to initialize the game
function gameInit() {
    // update instruments
    speedometerUpdate();
    altimeterUpdate();
}

// Game loop to handle movement and rendering
function gameLoop() {
    if (pause) {
        keysPressed = {};
    }

    let keyPressedFlag;

    if (keysPressed[KEYS.ToggleForward]){
        constantFlight=!constantFlight;
        keysPressed[KEYS.ToggleForward]=false;
    }
    constantFlight ? keyPressedFlag=true : keyPressedFlag=false;

    // Check if any of the keys are pressed and update dx
    for(let key in horizontalMapping){
        if (keysPressed[key]) {
            horizontalMapping[key]();
            keyPressedFlag = true;
        }
    }

    // Check if any of the keys are pressed and update dy and change the flag to true
    for(let key in verticalMapping){
        if (keysPressed[key]) {
            verticalMapping[key]();
            keyPressedFlag = true;
        }
    }

    if(keysPressed[KEYS.LT_SQ_BRACKET]){
        elevateAltitude(-altSpeed);
    }
    else if(keysPressed[KEYS.RT_SQ_BRACKET]){
        elevateAltitude(altSpeed);
    }

    moveRotate(dx, dy , keyPressedFlag)

    // Update displayed coordinates
    let coordFactor = altitudeFactor / (altitudeFromGround * 10);
    let coordX = Math.round(posX / coordFactor);
    let coordY = Math.round(posY / -coordFactor);

    $coords.innerHTML = `X = ${coordX} Y = ${coordY}`;
    $coordinates.innerHTML =
        `Coordinates: X= ${coordX} Y= ${coordY}`;

  // Redraw the canvas if needed
  if (needsRedraw) {
    ctx.clearRect(0, 0, $canvas.width, $canvas.height);
    draw();
    needsRedraw = false; // Reset the flag after drawing
  }

  requestAnimationFrame(gameLoop); // Queue the next iteration
}

gameInit(); // Initialize the game
gameLoop(); // Initiate the game loop
