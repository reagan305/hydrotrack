#include <WiFi.h>
#include <WiFiManager.h>
#include <Firebase_ESP_Client.h>

#define DATABASE_URL "https://hydrotrack-a91e4-default-rtdb.europe-west1.firebasedatabase.app/"
#define DATABASE_SECRET "YOUR_FIREBASE_DATABASE_SECRET"

#define TRIG_PIN 5
#define ECHO_PIN 18
#define TURBIDITY_PIN 34
#define RELAY_PIN 26

// -------- Ultrasonic Calibration --------
const float EMPTY_DISTANCE = 20.2;   // Tank empty (cm)
const float FULL_DISTANCE  = 6.5;   // Stop filling about 6.5 cm below sensor
const int NUM_SAMPLES = 10;

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

bool pumpStatus = false;
int targetLevel = 0;

void setup() {
  Serial.begin(115200);

  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, HIGH); // Relay off initially (active LOW)

  WiFiManager wm;
  bool res = wm.autoConnect("HydroTrack_Setup");

  Serial.println("Passed Autoconnect");

  if (!res) {
    Serial.println("Failed to connect");
    ESP.restart();
  }

  Serial.println();
  Serial.println("WiFi Connected");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  config.database_url = DATABASE_URL;
  config.signer.tokens.legacy_token = DATABASE_SECRET;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("Firebase Ready");
}

void loop() {
  // ULTRASONIC SENSOR (averaged)
  float distance = 0;

  for (int i = 0; i < NUM_SAMPLES; i++) {
    digitalWrite(TRIG_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIG_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIG_PIN, LOW);

    long duration = pulseIn(ECHO_PIN, HIGH, 30000);
    distance += duration * 0.034 / 2.0;
    delay(10);
  }

  distance /= NUM_SAMPLES;

  int waterLevelPercent = ((EMPTY_DISTANCE - distance) / (EMPTY_DISTANCE - FULL_DISTANCE)) * 100;

  if (waterLevelPercent > 100) waterLevelPercent = 100;
  if (waterLevelPercent < 0)   waterLevelPercent = 0;

  // TURBIDITY SENSOR
  int turbidityValue = analogRead(TURBIDITY_PIN);

  // LAST UPDATED TIME
  unsigned long currentTime = millis() / 1000;

  // SEND SENSOR DATA TO FIREBASE
  Firebase.RTDB.setInt(&fbdo, "/Sensor/WaterLevel", waterLevelPercent);
  Firebase.RTDB.setInt(&fbdo, "/Sensor/Turbidity", turbidityValue);
  Firebase.RTDB.setInt(&fbdo, "/Sensor/lastUpdated", currentTime);
  Firebase.RTDB.setFloat(&fbdo, "/Sensor/Distance", distance);
  Firebase.RTDB.setString(&fbdo, "/Sensor/WiFiStatus", WiFi.status() == WL_CONNECTED ? "Connected" : "Disconnected");
  Firebase.RTDB.setString(&fbdo, "/Sensor/PumpStatus", pumpStatus ? "ON" : "OFF");

  String tankStatus = "Empty";
  if (waterLevelPercent >= 90)      tankStatus = "Full";
  else if (waterLevelPercent >= 70) tankStatus = "High";
  else if (waterLevelPercent >= 40) tankStatus = "Medium";
  else if (waterLevelPercent >= 15) tankStatus = "Low";

  Firebase.RTDB.setString(&fbdo, "/Sensor/TankStatus", tankStatus);

  // READ PUMP STATUS
  if (Firebase.RTDB.getBool(&fbdo, "/Pump/Status")) {
    pumpStatus = fbdo.boolData();
  }

  // READ TARGET LEVEL
  if (Firebase.RTDB.getInt(&fbdo, "/Pump/TargetLevel")) {
    targetLevel = fbdo.intData();
  }

  // WIFI RESET COMMAND
  if (Firebase.RTDB.getBool(&fbdo, "/Settings/ResetWiFi")) {
    if (fbdo.boolData()) {
      Serial.println("WiFi reset requested.");
      Firebase.RTDB.setBool(&fbdo, "/Settings/ResetWiFi", false);

      WiFi.disconnect(true);
      WiFiManager wm;
      wm.resetSettings();
      delay(1000);
      ESP.restart();
    }
  }

  // START OR STOP RELAY
  if (pumpStatus) {
    digitalWrite(RELAY_PIN, LOW); // Relay ON (Active Low)

    // AUTO TARGET STOP
    if (waterLevelPercent >= targetLevel) {
      digitalWrite(RELAY_PIN, HIGH);
      Firebase.RTDB.setBool(&fbdo, "/Pump/Status", false);
      Serial.println("Target reached. Pump stopped.");
    }

    // OVERFLOW PROTECTION
    if (waterLevelPercent >= 100) {
      digitalWrite(RELAY_PIN, HIGH);
      Firebase.RTDB.setBool(&fbdo, "/Pump/Status", false);
      Serial.println("Overflow prevented.");
    }
  } else {
    digitalWrite(RELAY_PIN, HIGH); // Relay OFF
  }

  // SERIAL MONITOR
  Serial.println("------------");
  Serial.print("Water Level: ");
  Serial.print(waterLevelPercent);
  Serial.println("%");

  Serial.print("Turbidity: ");
  Serial.println(turbidityValue);

  Serial.print("Pump: ");
  Serial.println(pumpStatus ? "ON" : "OFF");

  Serial.print("Target: ");
  Serial.print(targetLevel);
  Serial.println("%");

  delay(2000);
}