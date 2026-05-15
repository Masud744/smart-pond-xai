#include "config.h"
#include "status.h"
#include "wifi_manager.h"
#include "ota_update.h"
#include "sensors.h"
#include "motors.h"
#include "servo_control.h"
#include "bluetooth.h"
#include "data_sender.h"

unsigned long lastSendTime = 0;
unsigned long lastFeedTime = 0;
bool otaStarted = false;

WaterStatus currentWaterStatus = GOOD;

unsigned long getSendInterval()
{
  switch (currentWaterStatus)
  {
  case POOR:
    return 10000UL; // ১০ সেকেন্ড
  case MODERATE:
    return 30000UL; // ৩০ সেকেন্ড
  default:
    return 60000UL; // ১ মিনিট
  }
}

void setup()
{
  Serial.begin(115200);
  Serial.println("====================");
  Serial.println("  ESP32 BOAT BOOT   ");
  Serial.println("====================");

  motorsSetup();
  servoSetup();
  sensorsSetup();
  bluetoothSetup();
  wifiSetup();

  stopBoat();
  Serial.println("[SYSTEM] Ready");
}

void loop()
{
  // SmartProv handle
  wifiHandle();

  if (isWifiConnected())
  {

    // WiFi connect হওয়ার পর একবারই OTA setup হবে
    if (!otaStarted)
    {
      otaSetup();
      otaStarted = true;
    }

    otaHandle();

    // Sensor read + data send
    if (millis() - lastSendTime >= getSendInterval())
    {
      lastSendTime = millis();

      float temp = getTemperature();
      float ph = getPH();
      int turbidity = getTurbidity();
      currentWaterStatus = getWaterStatus(ph, temp, turbidity);
      String statusText = waterStatusToString(currentWaterStatus);

      Serial.println("──────── SENSOR ────────");
      Serial.println("Temp      : " + String(temp, 1) + " °C");
      Serial.println("pH        : " + String(ph, 2));
      Serial.println("Turbidity : " + String(turbidity) + " %");
      Serial.println("Status    : " + statusText);
      Serial.println("────────────────────────");

      bool sent = sendSensorData(temp, ph, turbidity, statusText);
      Serial.println(sent ? "[API] Sent ✓" : "[API] Failed ✗");
    }

    // Auto feeding schedule
    if (millis() - lastFeedTime >= FEED_INTERVAL)
    {
      lastFeedTime = millis();
      feedFish(currentWaterStatus);
    }
  }

  // Bluetooth সবসময় চলবে
  handleBluetooth();

  delay(10);
}