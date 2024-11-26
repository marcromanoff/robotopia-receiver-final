radio.setGroup(1) // Ensure both micro:bits use the same group
let isRainbowMode = true // Start with rainbow mode
let isRedMode = Math.randomBoolean() // Randomly choose Red or Blue for the first switch press
let countdownTime = 0 // Tracks countdown time in seconds
let countdownActive = false // Tracks if countdown is active
let flashingActive = false // Tracks if flashing is active
let gameOver = false // Tracks if the game is over
let purpleModeActive = false // Tracks if Purple Mode is active
let lastColor = isRedMode ? neopixel.colors(NeoPixelColors.Red) : neopixel.colors(NeoPixelColors.Blue) // Default random color
let purpleColor = neopixel.hsl(270, 100, 50) // Adjusted more violet-like purple color

// Setup pull-up resistor for the tilt switch on P2
pins.setPull(DigitalPin.P2, PinPullMode.PullUp)

// Redirect audio to external speaker on P1
music.setBuiltInSpeakerEnabled(false) // Disable internal speaker
pins.analogSetPitchPin(AnalogPin.P1) // Route sound to P1

function applyBrightness(brightness: number) {
    np.setBrightness(brightness) // Apply brightness
    np.showColor(lastColor) // Set to the last selected color
    np.show()
}

// Rainbow chasing effect
function rainbowChase() {
    while (isRainbowMode) {
        for (let j = 0; j < 16; j++) {
            if (!isRainbowMode) return // Exit if mode changes
            np.clear()
            for (let i = 0; i < 16; i++) {
                let hue = ((i + j) * 360) / 16 // Calculate hue for each LED
                np.setPixelColor(i, neopixel.hsl(hue, 100, 50))
            }
            np.show()
            basic.pause(100) // Adjust speed of the rainbow
        }
    }
}

// Set NeoPixel ring to red and play laser sound
function setRed() {
    isRainbowMode = false
    isRedMode = true
    lastColor = neopixel.colors(NeoPixelColors.Red)
    applyBrightness(255)
    control.inBackground(() => playLaserSound())
}

// Set NeoPixel ring to blue and play inverse laser sound
function setBlue() {
    isRainbowMode = false
    isRedMode = false
    lastColor = neopixel.colors(NeoPixelColors.Blue)
    applyBrightness(255)
    control.inBackground(() => playInverseLaserSound())
}

// Activate Purple Mode
function activatePurpleMode() {
    purpleModeActive = true // Activate Purple Mode
    np.showColor(purpleColor) // Set NeoPixels to violet
    np.show()
    basic.pause(10000) // Stay purple for 10 seconds
    purpleModeActive = false // Exit Purple Mode after timeout
    np.showColor(lastColor) // Revert to last color
    np.show()
}

// Handle color change and play corresponding laser sound
function toggleColorFromPurple() {
    let newColor = Math.randomBoolean() ? neopixel.colors(NeoPixelColors.Red) : neopixel.colors(NeoPixelColors.Blue)
    lastColor = newColor // Update the last color
    np.showColor(newColor) // Set new color
    radio.sendString(newColor === neopixel.colors(NeoPixelColors.Red) ? "red" : "blue") // Broadcast color to other receivers
    np.show()
    // Play appropriate laser sound
    if (newColor === neopixel.colors(NeoPixelColors.Red)) {
        control.inBackground(() => playLaserSound())
    } else {
        control.inBackground(() => playInverseLaserSound())
    }
}

// Toggle between Red and Blue colors
function toggleColor() {
    if (isRedMode) {
        setBlue()
    } else {
        setRed()
    }
}

// Randomly choose between Red and Blue for the first press
function setRandomColor() {
    if (Math.randomBoolean()) {
        setRed()
    } else {
        setBlue()
    }
}

// Flashing NeoPixels for the last 10 seconds
function flashNeoPixels() {
    flashingActive = true // Indicate flashing is active
    for (let i = 0; i < 20; i++) { // Flash for 10 seconds (20 cycles at 250ms each)
        if (!countdownActive) return // Stop if countdown ends prematurely
        np.showColor(lastColor) // Turn on NeoPixels
        basic.pause(250)
        np.clear() // Turn off NeoPixels
        np.show()
        basic.pause(250)
    }
    flashingActive = false // Indicate flashing is complete
    if (countdownActive) {
        endCountdown() // Immediately transition to the end countdown
    }
}

// Countdown Timer Function
function startCountdown(seconds: number) {
    countdownActive = true
    control.runInBackground(() => runSnakePattern(seconds + 14)) // Run snake pattern for countdown + flashing + off
    for (let i = seconds; i > 0; i--) {
        if (i == 10) {
            control.inBackground(() => flashNeoPixels()) // Flash in the last 10 seconds
        }
        basic.pause(1000) // 1-second delay
    }
    // Ensure the end sequence triggers after countdown
    if (countdownActive) {
        endCountdown()
    }
}

// Run Snake Pattern
function runSnakePattern(duration: number) {
    let position = 0 // LED grid position
    for (let i = 0; i < duration * 20; i++) { // Ensure it runs for the extended duration
        if (!countdownActive) break // Stop if the countdown is no longer active
        displaySnake(position)
        position = (position + 1) % 25
        basic.pause(50) // Speed up snake pattern
    }
}

// Snake pattern for LED grid
function displaySnake(position: number) {
    let x = position % 5
    let y = Math.floor(position / 5)
    basic.clearScreen()
    if (y % 2 == 0) {
        // Even rows light up left-to-right
        led.plot(x, y)
    } else {
        // Odd rows light up right-to-left
        led.plot(4 - x, y)
    }
}

// End Countdown: Turn off LEDs, display "X", and play buzzer
function endCountdown() {
    countdownActive = false // Stop the snake pattern
    flashingActive = false // Ensure flashing stops
    gameOver = true // Game is over, deactivate microswitch immediately
    np.clear()
    np.show() // Turn off NeoPixels
    displayX() // Show "X" on the LED grid
    control.inBackground(() => playGameOverSound()) // Play buzzer sound
    basic.pause(4000) // Wait for buzzer to complete
    np.setBrightness(64) // Set NeoPixels to low brightness (25%)
    np.showColor(lastColor) // Restore NeoPixels to last color
    np.show()
}

// Display "X" on the LED grid
function displayX() {
    basic.clearScreen()
    for (let i = 0; i < 5; i++) {
        led.plot(i, i) // Top-left to bottom-right diagonal
        led.plot(i, 4 - i) // Top-right to bottom-left diagonal
    }
}

// Laser sound effect for Red mode
function playLaserSound() {
    for (let freq = 1000; freq > 200; freq -= 50) {
        music.playTone(freq, music.beat(BeatFraction.Sixteenth)) // Rapid descending tones
    }
}

// Inverse laser sound effect for Blue mode
function playInverseLaserSound() {
    for (let freq = 200; freq <= 1000; freq += 50) {
        music.playTone(freq, music.beat(BeatFraction.Sixteenth)) // Rapid ascending tones
    }
}

// Play game-over dramatic buzzer sound
function playGameOverSound() {
    for (let i = 0; i < 3; i++) {
        music.playTone(330, music.beat(BeatFraction.Quarter)) // Low E
        music.playTone(440, music.beat(BeatFraction.Quarter)) // Middle A
        music.playTone(554, music.beat(BeatFraction.Quarter)) // High C#
        music.playTone(440, music.beat(BeatFraction.Half))    // Middle A held longer
        basic.pause(200)
    }
    music.playTone(220, music.beat(BeatFraction.Double)) // Deep final tone (Low A)
}

// Initiate random purple mode periodically
function initiateRandomPurple() {
    while (true) {
        if (!gameOver && countdownActive) {
            basic.pause(Math.randomRange(15000, 30000)) // Random delay between 15-30 seconds
            activatePurpleMode()
        } else {
            basic.pause(1000) // Check periodically if game is active
        }
    }
}

// Handle received radio messages
radio.onReceivedString(function (receivedString) {
    if (receivedString == "purple") {
        activatePurpleMode() // Activate Purple Mode when signal is received
    } else if (receivedString == "red") {
        lastColor = neopixel.colors(NeoPixelColors.Red)
        np.showColor(lastColor)
    } else if (receivedString == "blue") {
        lastColor = neopixel.colors(NeoPixelColors.Blue)
        np.showColor(lastColor)
    } else if (receivedString == "reset") {
        basic.showString("R")
        isRainbowMode = true
        gameOver = false
        countdownActive = false
        flashingActive = false
        purpleModeActive = false
        control.inBackground(() => rainbowChase())
    } else if (receivedString == "start" && countdownTime > 0 && !countdownActive) {
        basic.showString("S")
        control.inBackground(() => startCountdown(countdownTime))
    } else if (receivedString == "one") {
        countdownTime = 60
        basic.showNumber(1)
    } else if (receivedString == "two") {
        countdownTime = 120
        basic.showNumber(2)
    } else if (receivedString == "three") {
        countdownTime = 180
        basic.showNumber(3)
    } else if (receivedString == "four") {
        countdownTime = 240
        basic.showNumber(4)
    }
})

// Monitor the tilt switch
basic.forever(function () {
    if (gameOver) return // Immediately exit if the game is over
    if (pins.digitalReadPin(DigitalPin.P2) == 0) {
        if (purpleModeActive) {
            purpleModeActive = false // Disable Purple Mode
            toggleColorFromPurple() // Handle Purple Mode toggle
        } else if (isRainbowMode) {
            setRandomColor() // First press: Random Red or Blue
            isRainbowMode = false // Exit rainbow mode
        } else {
            toggleColor() // Subsequent presses: Toggle Red and Blue
        }
        basic.pause(500) // Debounce delay
        while (pins.digitalReadPin(DigitalPin.P2) == 0) {
            // Wait for switch release
        }
    }
})

// Start the rainbow mode on startup
let np = neopixel.create(DigitalPin.P0, 16, NeoPixelMode.RGB) // 16-LED ring
control.inBackground(() => rainbowChase())
control.inBackground(() => initiateRandomPurple()) // Periodically activate Purple Mode
basic.showIcon(IconNames.Heart) // Display heart on startup
