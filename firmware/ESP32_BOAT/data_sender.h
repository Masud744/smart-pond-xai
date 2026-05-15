#ifndef DATA_SENDER_H
#define DATA_SENDER_H

#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
#include "wifi_manager.h"

bool sendSensorData(float temp, float ph, int turbidity, String status)
{
  if (!isWifiConnected())
  {
    Serial.println("[API] WiFi Not Connected");
    return false;
  }

  String url = String(BACKEND_URL);
  Serial.println("[API] URL = " + url);

  // WiFiClientSecure পয়েন্টার হিসেবে ডিক্লেয়ার করা হলো যাতে ESP32 এর মেমোরি ক্র্যাশ না করে
  WiFiClientSecure *client = new WiFiClientSecure;
  if (!client)
  {
    Serial.println("[API] Memory Error");
    return false;
  }

  client->setInsecure(); // SSL Certificate Certificate Verification Skip করা হলো

  HTTPClient http;
  if (http.begin(*client, url))
  {
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(15000); // টাইমআউট বাড়িয়ে ১৫ সেকেন্ড করা হলো

    StaticJsonDocument<256> doc;
    doc["temperature"] = temp;
    doc["ph"] = ph; // actual pH value পাঠাচ্ছি
    doc["turbidity"] = turbidity;
    doc["status"] = status;

    String body;
    serializeJson(doc, body);

    Serial.println("[API] Sending → " + body);

    int responseCode = http.POST(body);

    if (responseCode == 200 || responseCode == 201)
    {
      Serial.println("[API] Response: " + String(responseCode));
      Serial.println("[API] Sent ✓");
      http.end();
      delete client;
      return true;
    }
    else
    {
      Serial.println("[API] Failed: " + String(responseCode));
      Serial.println("[API] Error Body: " + http.getString());
      http.end();
      delete client;
      return false;
    }
  }
  else
  {
    Serial.println("[API] Connection failed");
    delete client;
    return false;
  }
}

#endif