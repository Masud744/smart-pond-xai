#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

// SmartProv macros — #include এর আগে থাকতে হবে
#define SP_AP_PREFIX "POND-BOAT"
#define SP_LED_PIN 2
#define SP_RESET_PIN 0
#define SP_RESET_HOLD_MS 3000
#define SP_RESTART_DELAY_MS 2000

#include <SmartProv.h>

SmartProv prov;

void wifiSetup()
{
  Serial.println("[WIFI] Starting SmartProv...");

  prov.addField("backend_url", "Backend URL", "https://your-app.onrender.com");

  prov.onConnected([]()
                   {
    Serial.println("[WIFI] Connected!");
    Serial.println("[WIFI] IP: " + prov.getIP().toString());
    Serial.println("[WIFI] Backend: " + prov.getField("backend_url")); });

  prov.begin();
}

void wifiHandle()
{
  prov.update();
}

bool isWifiConnected()
{
  return prov.isConnected();
}

String getBackendURL()
{
  String url = prov.getField("backend_url");
  if (url == "")
    return "https://your-app.onrender.com";
  return url;
}

#endif