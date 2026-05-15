#ifndef DATA_SENDER_H
#define DATA_SENDER_H

#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "wifi_manager.h"

bool sendSensorData(float temp, float ph, int turbidity, String status)
{
  if (!isWifiConnected())
  {
    Serial.println("[API] WiFi Not Connected");
    return false;
  }

  String url = getBackendURL() + "/api/sensor";

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.setTimeout(10000);

  StaticJsonDocument<256> doc;
  doc["temperature"] = temp;
  doc["ph"] = ph; // actual pH value পাঠাচ্ছি
  doc["turbidity"] = turbidity;
  doc["status"] = status;

  String body;
  serializeJson(doc, body);

  Serial.println("[API] Sending → " + body);

  int responseCode = http.POST(body);
  http.end();

  if (responseCode > 0)
  {
    Serial.println("[API] Response: " + String(responseCode));
    return true;
  }
  else
  {
    Serial.println("[API] Failed: " + String(responseCode));
    return false;
  }
}

#endif