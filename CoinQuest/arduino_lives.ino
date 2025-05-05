// LED pins
const int LED1 = 2;
const int LED2 = 3;
const int LED3 = 4;

void setup()
{
    // Initialize serial communication
    Serial.begin(9600);

    // Set LED pins as outputs
    pinMode(LED1, OUTPUT);
    pinMode(LED2, OUTPUT);
    pinMode(LED3, OUTPUT);

    // Initially turn all LEDs on (3 lives)
    digitalWrite(LED1, HIGH);
    digitalWrite(LED2, HIGH);
    digitalWrite(LED3, HIGH);
}

void loop()
{
    if (Serial.available() > 0)
    {
        // Read the byte that represents LED states
        int ledState = Serial.read();

        // Update each LED based on the corresponding bit
        digitalWrite(LED1, (ledState & 0x01) ? HIGH : LOW);
        digitalWrite(LED2, (ledState & 0x02) ? HIGH : LOW);
        digitalWrite(LED3, (ledState & 0x04) ? HIGH : LOW);
    }
}