// LED pins
const int LED1 = 3;
const int LED2 = 4;
const int LED3 = 5;
const int BUZZER = 6; 

// Joystick pins
const int X_PIN = A0;
const int Y_PIN = A1;
const int SW_PIN = 2;

void setup()
{
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
    pinMode(SW_PIN, INPUT_PULLUP); 
}

void playHitSound()
{
    // Play a short beep when player gets hit
    tone(BUZZER, 500, 200); 
    delay(200);
    noTone(BUZZER);
}

void loop()
{
    if (Serial.available() > 0)
    {
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
    int swValue = digitalRead(SW_PIN); 

    
    float xNormalized = map(xValue, -512, 1023, -1, 1);
    float yNormalized = map(yValue, 0, 1023, -1, 1);

    Serial.print(xNormalized);
    Serial.print(",");
    Serial.print(yNormalized);
    Serial.print(",");
    Serial.println(swValue);

    delay(20); 
}