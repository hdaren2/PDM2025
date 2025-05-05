// LED pins
const int LED1 = 3;
const int LED2 = 4;
const int LED3 = 5;
const int BUZZER = 6; // Buzzer connected to pin 5

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
}