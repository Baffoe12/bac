#define JWT_SECRET "bac_d389"

#include <ESP8266WiFi.h>
#include <WiFiClient.h>
#include <ESP8266HTTPClient.h>
#include <FirebaseESP8266.h>
#include <SoftwareSerial.h>

// Software Serial for communication with Arduino Nano
SoftwareSerial nanoSerial(D2, D1); // RX,TX (D2=RX, D1=TX)

// WiFi Configuration
const char* ssid = "YourWiFiSSID";
const char* password = "YourWiFiPassword";

// Firebase Configuration
#define FIREBASE_HOST "your-project-id.firebaseio.com" // Without http:// or https://
#define FIREBASE_AUTH "YourFirebaseSecretOrDatabaseSecret"

// Firebase Data Object
FirebaseData firebaseData;

// System State
bool cloudConnected = false;
unsigned long lastReconnectAttempt = 0;

// API Constants
const char* apiBaseUrl = "https://bac-e72u.onrender.com";
const char* JWT_SECRET="bac_d389";
const char* getDataEndpoint = "/data";
const char* sendCommandEndpoint = "/command";
const char* usageSummaryEndpoint = "/api/usage/summary";
const char* usageDataEndpoint = "/api/usage/data";
const char* usageInsightsEndpoint = "/api/usage/insights";
const char* sensorDataEndpoint = "/api/sensor-data";

void setup() {
  Serial.begin(115200);
  nanoSerial.begin(9600); // Match Nano's baud rate
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  
  // LED setup (inverted logic)
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH); // LED off
  
  // Wait for WiFi connection
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println();
  Serial.println("WiFi connected");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Initialize Firebase
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
  
  // Optional: Set database read timeout
  Firebase.setReadTimeout(firebaseData, 1000 * 60);
  
  // Optional: Set size of HTTP response buffer
  firebaseData.setBSSLBufferSize(1024, 1024);
  
  // Optional: Set size of HTTP response buffer
  Firebase.setwriteSizeLimit(firebaseData, "tiny");
}

void loop() {
  // Handle Nano messages
  if(nanoSerial.available()) {
    String message = nanoSerial.readStringUntil('\n');
    message.trim(); // Remove any whitespace
    processNanoMessage(message);
  }

  // Maintain WiFi connection
  if(WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_BUILTIN, HIGH); // LED off
    cloudConnected = false;
    if(millis() - lastReconnectAttempt > 5000) {
      lastReconnectAttempt = millis();
      Serial.println("Reconnecting to WiFi...");
      WiFi.disconnect();
      WiFi.begin(ssid, password);
    }
  } 
  else if(!cloudConnected) {
    digitalWrite(LED_BUILTIN, LOW); // LED on
    cloudConnected = true;
    Serial.println("WiFi connected");
    Serial.print("IP: ");
    Serial.println(WiFi.localIP());
  }

  // Periodically send heartbeat
  static unsigned long lastHeartbeat = 0;
  if(millis() - lastHeartbeat > 30000 && cloudConnected) {
    sendToFirebase("/system/heartbeat", String(millis()));
    lastHeartbeat = millis();
  }
}

void processNanoMessage(String msg) {
  Serial.println("From Nano: " + msg);
  
  if(msg.startsWith("SENSOR:")) {
    // Format: "SENSOR:voltage,current,power,temperature,humidity"
    String data = msg.substring(7);
    String values[5];
    int index = 0;
    int lastComma = 0;
    
    // Parse comma-separated values
    for(int i = 0; i < data.length(); i++) {
      if(data.charAt(i) == ',' || i == data.length() - 1) {
        values[index] = data.substring(lastComma, i == data.length() - 1 ? i + 1 : i);
        lastComma = i + 1;
        index++;
        if(index >= 5) break;
      }
    }
    
    // Send to Firebase
    sendToFirebase("/sensors/voltage", values[0]);
    sendToFirebase("/sensors/current", values[1]);
    sendToFirebase("/sensors/power", values[2]);
    sendToFirebase("/sensors/temperature", values[3]);
    sendToFirebase("/sensors/humidity", values[4]);
    
    // Also send as a single timestamped event
    String timestampPath = "/sensor_readings/" + String(millis());
    Firebase.setString(firebaseData, timestampPath + "/voltage", values[0]);
    Firebase.setString(firebaseData, timestampPath + "/current", values[1]);
    Firebase.setString(firebaseData, timestampPath + "/power", values[2]);
    Firebase.setString(firebaseData, timestampPath + "/temperature", values[3]);
    Firebase.setString(firebaseData, timestampPath + "/humidity", values[4]);

    // Send to API endpoint
    sendSensorDataToApi(values[0], values[1], values[2], values[3], values[4]);
  }
  else if(msg.startsWith("RELAY1=")) {
    String state = msg.substring(7);
    sendToFirebase("/relays/1", state);
    nanoSerial.println("ACK_RELAY1");
  }
  else if(msg.startsWith("RELAY2=")) {
    String state = msg.substring(7);
    sendToFirebase("/relays/2", state);
    nanoSerial.println("ACK_RELAY2");
  }
  else if(msg == "GET_STATUS") {
    // Check Firebase for commands
    checkFirebaseCommands();
  }
  else if(msg == "ALERT:LIMIT_REACHED") {
    sendToFirebase("/alerts/power_limit", "true");
    // Push notification
    Firebase.setString(firebaseData, "/notifications/power_limit", String(millis()));
  }
}

void sendToFirebase(String path, String value) {
  if(WiFi.status() != WL_CONNECTED) {
    Serial.println("Not connected to WiFi - can't send to Firebase");
    return;
  }
  
  if(Firebase.setString(firebaseData, path, value)) {
    Serial.println("Firebase write success: " + path + " = " + value);
  } else {
    Serial.println("Firebase write failed: " + path);
    Serial.println("Reason: " + firebaseData.errorReason());
  }
}

void sendSensorDataToApi(String voltage, String current, String power, String temperature, String humidity) {
  if(WiFi.status() != WL_CONNECTED) {
    Serial.println("Not connected to WiFi - can't send to API");
    return;
  }

  HTTPClient http;
  String url = String(apiBaseUrl) + String(sensorDataEndpoint);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{";
  jsonPayload += "\"voltage\":\"" + voltage + "\",";
  jsonPayload += "\"current\":\"" + current + "\",";
  jsonPayload += "\"power\":\"" + power + "\",";
  jsonPayload += "\"temperature\":\"" + temperature + "\",";
  jsonPayload += "\"humidity\":\"" + humidity + "\"";
  jsonPayload += "}";

  int httpResponseCode = http.POST(jsonPayload);
  if(httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("API POST Response code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error on sending POST: " + String(httpResponseCode));
  }
  http.end();
}

void sendGetDataRequest() {
  if(WiFi.status() != WL_CONNECTED) {
    Serial.println("Not connected to WiFi - can't send GET request");
    return;
  }

  HTTPClient http;
  String url = String(apiBaseUrl) + String(getDataEndpoint);
  http.begin(url);

  int httpResponseCode = http.GET();
  if(httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("GET /data Response code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error on sending GET: " + String(httpResponseCode));
  }
  http.end();
}

void sendCommandToApi(String command) {
  if(WiFi.status() != WL_CONNECTED) {
    Serial.println("Not connected to WiFi - can't send command");
    return;
  }

  HTTPClient http;
  String url = String(apiBaseUrl) + String(sendCommandEndpoint);
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  String jsonPayload = "{\"command\":\"" + command + "\"}";

  int httpResponseCode = http.POST(jsonPayload);
  if(httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("POST /command Response code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error on sending POST command: " + String(httpResponseCode));
  }
  http.end();
}

void sendUsageSummaryRequest() {
  if(WiFi.status() != WL_CONNECTED) {
    Serial.println("Not connected to WiFi - can't send GET request");
    return;
  }

  HTTPClient http;
  String url = String(apiBaseUrl) + String(usageSummaryEndpoint);
  http.begin(url);

  int httpResponseCode = http.GET();
  if(httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("GET /api/usage/summary Response code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error on sending GET: " + String(httpResponseCode));
  }
  http.end();
}

void sendUsageDataRequest() {
  if(WiFi.status() != WL_CONNECTED) {
    Serial.println("Not connected to WiFi - can't send GET request");
    return;
  }

  HTTPClient http;
  String url = String(apiBaseUrl) + String(usageDataEndpoint);
  http.begin(url);

  int httpResponseCode = http.GET();
  if(httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("GET /api/usage/data Response code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error on sending GET: " + String(httpResponseCode));
  }
  http.end();
}

void sendUsageInsightsRequest() {
  if(WiFi.status() != WL_CONNECTED) {
    Serial.println("Not connected to WiFi - can't send GET request");
    return;
  }

  HTTPClient http;
  String url = String(apiBaseUrl) + String(usageInsightsEndpoint);
  http.begin(url);

  int httpResponseCode = http.GET();
  if(httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("GET /api/usage/insights Response code: " + String(httpResponseCode));
    Serial.println("Response: " + response);
  } else {
    Serial.println("Error on sending GET: " + String(httpResponseCode));
  }
  http.end();
}

void checkFirebaseCommands() {
  // Check for relay commands
  if(Firebase.getString(firebaseData, "/commands/relay1")) {
    String command = firebaseData.stringData();
    if(command == "ON" || command == "OFF") {
      nanoSerial.println("CLOUD_CMD:1 " + command);
      // Clear the command after processing
      Firebase.setString(firebaseData, "/commands/relay1", "");
    }
  }
  
  if(Firebase.getString(firebaseData, "/commands/relay2")) {
    String command = firebaseData.stringData();
    if(command == "ON" || command == "OFF") {
      nanoSerial.println("CLOUD_CMD:2 " + command);
      // Clear the command after processing
      Firebase.setString(firebaseData, "/commands/relay2", "");
    }
  }
  
  // Check for system commands
  if(Firebase.getString(firebaseData, "/commands/system")) {
    String command = firebaseData.stringData();
    if(command == "RESTART") {
      nanoSerial.println("CLOUD_CMD:RESTART");
      // Clear the command after processing
      Firebase.setString(firebaseData, "/commands/system", "");
      delay(1000);
      ESP.restart();
    }
  }
}
