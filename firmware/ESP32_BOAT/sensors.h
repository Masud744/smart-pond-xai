#ifndef SENSORS_H
#define SENSORS_H

#include <OneWire.h>
#include <DallasTemperature.h>
#include "config.h"
#include "status.h"

OneWire oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);

void sensorsSetup()
{
  tempSensor.begin();
  pinMode(TURB_PIN, INPUT);
  pinMode(PH_PIN, INPUT);
  Serial.println("[SENSOR] Ready");
}

// ── Temperature ──
float getTemperature()
{
  tempSensor.requestTemperatures();
  float temp = tempSensor.getTempCByIndex(0);
  if (temp == -127.0)
  {
    Serial.println("[TEMP] Sensor Error!");
    return -1;
  }
  return temp;
}

// ── Turbidity ──
// 0 = পরিষ্কার, 100 = ঘোলা
int getTurbidity()
{
  long sum = 0;
  for (int i = 0; i < 100; i++)
  {
    sum += analogRead(TURB_PIN);
    delay(2);
  }
  int raw = sum / 100;

  // বেশি raw = পরিষ্কার পানি, কম raw = ঘোলা পানি
  int turbidity = map(raw, TURB_DIRTY_RAW, TURB_CLEAR_RAW, 100, 0);
  return constrain(turbidity, 0, 100);
}

// ── pH ──
// Voltage থেকে actual pH calculate করা হচ্ছে
// Linear interpolation: pH 4 আর pH 7 এর voltage দিয়ে
float getPH()
{
  long sum = 0;
  for (int i = 0; i < 50; i++)
  {
    sum += analogRead(PH_PIN);
    delay(5);
  }
  float raw = sum / 50.0;
  float voltage = raw * (3.3 / 4095.0);

  // Two-point calibration formula
  float slope = (7.0 - 4.0) / (PH_CAL_VOLTAGE_7 - PH_CAL_VOLTAGE_4);
  float ph = 7.0 + slope * (PH_CAL_VOLTAGE_7 - voltage);

  return constrain(ph, 0.0, 14.0);
}

// ── Water Status ──
// pH + Temperature + Turbidity তিনটাই দিয়ে status ঠিক হবে
WaterStatus getWaterStatus(float ph, float temp, int turbidity)
{

  bool phGood = (ph >= PH_GOOD_MIN && ph <= PH_GOOD_MAX);
  bool tempGood = (temp >= TEMP_GOOD_MIN && temp <= TEMP_GOOD_MAX);
  bool turbGood = (turbidity <= TURB_GOOD_MAX);

  bool phMod = (ph >= PH_MOD_MIN && ph <= PH_MOD_MAX);
  bool turbMod = (turbidity <= TURB_MOD_MAX);

  // তিনটাই ঠিক থাকলে GOOD
  if (phGood && tempGood && turbGood)
    return GOOD;

  // দুইটা মোটামুটি ঠিক থাকলে MODERATE
  else if (phMod && turbMod)
    return MODERATE;

  // নাহলে POOR
  else
    return POOR;
}

String waterStatusToString(WaterStatus status)
{
  switch (status)
  {
  case GOOD:
    return "GOOD";
  case MODERATE:
    return "MODERATE";
  default:
    return "POOR";
  }
}

#endif