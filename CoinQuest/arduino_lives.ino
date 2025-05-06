// LED pins
const int LED1 = 3;
const int LED2 = 4;
const int LED3 = 5;
const int BUZZER = 6; // Buzzer connected to pin 5

// Joystick pins
const int X_PIN = A0;
const int Y_PIN = A1;
const int SW_PIN = 2; // SW button pin

void setup()
{
    // Initialize serial communication
    Serial.begin(9600);

    // Set LED pins as outputs
    pinMode(LED1, OUTPUT);
    pinMode(LED2, OUTPUT);
    pinMode(LED3, OUTPUT);
    pinMode(BUZZER, OUTPUT);

    // Initially turn all LEDs on (3 lives)
    digitalWrite(LED1, HIGH);
    digitalWrite(LED2, HIGH);
    digitalWrite(LED3, HIGH);

    // Initialize joystick pins
    pinMode(X_PIN, INPUT);
    pinMode(Y_PIN, INPUT);
    pinMode(SW_PIN, INPUT_PULLUP); // Enable internal pull-up resistor for SW button
}

void playHitSound()
{
    // Play a short beep when player gets hit
    tone(BUZZER, 1000, 200); // 1000Hz for 200ms
    delay(200);
    noTone(BUZZER);
}

void loop()
{
    if (Serial.available() > 0)
    {
        // Read the byte that represents LED states and hit status
        int data = Serial.read();

        // Check if this is a hit signal (bit 7 is set)
        if (data & 0x80)
        {
            playHitSound();
        }

        // Update LEDs using the lower 3 bits
        digitalWrite(LED1, (data & 0x01) ? HIGH : LOW);
        digitalWrite(LED2, (data & 0x02) ? HIGH : LOW);
        digitalWrite(LED3, (data & 0x04) ? HIGH : LOW);
    }

    // Read joystick values
    int xValue = analogRead(X_PIN);
    int yValue = analogRead(Y_PIN);
    int swValue = digitalRead(SW_PIN); // Read SW button state

    // Convert to -1 to 1 range
    float xNormalized = map(xValue, -512, 1023, -1, 1);
    float yNormalized = map(yValue, 0, 1023, -1, 1);

    // Send data in format "X,Y,SW\n"
    Serial.print(xNormalized);
    Serial.print(",");
    Serial.print(yNormalized);
    Serial.print(",");
    Serial.println(swValue);

    delay(20); // Small delay to prevent overwhelming the serial port
}