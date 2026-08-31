#ifndef DATA_SENDER_H
#define DATA_SENDER_H

#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include <BluetoothSerial.h>
#include "wifi_manager.h"

extern BluetoothSerial SerialBT; // bluetooth.h te define kora

bool sendSensorData(float temp, float ph, int turbidity, String status)
{
  if (!isWifiConnected())
  {
    Serial.println("[API] WiFi Not Connected");
    return false;
  }

  String url = String(BACKEND_URL);
  Serial.println("[API] URL = " + url);

  // WiFiClientSecure pointer use kora holo jate ESP32 er memory crash na kore
  WiFiClientSecure *client = new WiFiClientSecure;
  if (!client)
  {
    Serial.println("[API] Memory Error");
    return false;
  }

  client->setInsecure(); // SSL Certificate Verification Skip kora holo

  // TLS handshake specifically koto shomoy wait korbe (seconds) -- newer
  // arduino-esp32 core e ei setting na thakle kichu server er shathe
  // handshake fail kore, eta ekta known workaround
  client->setHandshakeTimeout(30);

  // handshake nijei koto khon wait korbe shetao alada kore barano holo (cold-start er jonno)
  client->setTimeout(20000);

  Serial.println("[API] Free Heap before connect: " + String(ESP.getFreeHeap()));

  HTTPClient http;
  http.setConnectTimeout(20000); // TCP+TLS connect timeout
  if (http.begin(*client, url))
  {
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(20000); // timeout barano holo 20 second (Render cold-start shohyo korar jonno)

    StaticJsonDocument<256> doc;
    doc["temperature"] = temp;
    doc["ph"] = ph;
    doc["turbidity"] = turbidity;
    doc["status"] = status;
    doc["device_id"] = "esp32_01";

    String body;
    serializeJson(doc, body);

    Serial.println("[API] Sending -> " + body);

    int responseCode = http.POST(body);

    if (responseCode == 200 || responseCode == 201)
    {
      Serial.println("[API] Response: " + String(responseCode));
      Serial.println("[API] Sent OK");
      http.end();
      delete client;
      return true;
    }
    else
    {
      // responseCode negative hole eta HTTPClient/TLS-level error (connect e problem)
      // responseCode positive (like 404/500) hole eta server thekei asha response
      Serial.println("[API] Failed, code: " + String(responseCode));
      Serial.println("[API] Error meaning: " + http.errorToString(responseCode));
      if (responseCode > 0)
      {
        Serial.println("[API] Error Body: " + http.getString());
      }
      http.end();
      delete client;
      return false;
    }
  }
  else
  {
    Serial.println("[API] http.begin() failed - URL/client setup problem");
    delete client;
    return false;
  }
}

// ── Wrapper: Bluetooth-er RAM samoyikbhabe free kore TLS handshake er jonno ──
// Karon: BluetoothSerial (Classic BT) heap-ke fragment kore fele, ferole
// mbedTLS-er handshake-er jonno protyashito boro continuous free block pawa jay na
// (MbedTLS "-32512 Memory allocation failed" ei karonei ashe).
bool sendSensorDataSafely(float temp, float ph, int turbidity, String status)
{
  SerialBT.end();
  delay(200); // BT stack fully free hote shomoy deya

  Serial.println("[API] Free Heap after BT stop: " + String(ESP.getFreeHeap()));

  bool result = sendSensorData(temp, ph, turbidity, status);

  SerialBT.begin("ESP32_BOAT"); // BT abar chalu kora holo
  delay(100);

  return result;
}

#endif