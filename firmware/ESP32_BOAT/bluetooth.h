#ifndef BLUETOOTH_H
#define BLUETOOTH_H

#include "BluetoothSerial.h"
#include "motors.h"
#include "servo_control.h"

BluetoothSerial SerialBT;
extern WaterStatus currentWaterStatus; // main file থেকে নেওয়া

void bluetoothSetup()
{
  SerialBT.begin("ESP32_BOAT");
  Serial.println("[BT] Ready — Device: ESP32_BOAT");
}

void handleBluetooth()
{
  if (!SerialBT.available())
    return;

  char cmd = SerialBT.read();
  Serial.println("[BT] CMD: " + String(cmd));

  switch (cmd)
  {
  // ── Motor ──
  case 'F':
    forward();
    SerialBT.println("FORWARD");
    break;
  case 'B':
    backward();
    SerialBT.println("BACKWARD");
    break;
  case 'L':
    turnLeft();
    SerialBT.println("LEFT");
    break;
  case 'R':
    turnRight();
    SerialBT.println("RIGHT");
    break;
  case 'S':
    stopBoat();
    SerialBT.println("STOP");
    break;

  // ── Servo Manual ──
  case 'U':
    servoUp();
    SerialBT.println("SERVO UP");
    break;
  case 'D':
    servoDown();
    SerialBT.println("SERVO DOWN");
    break;
  case 'M':
    servoCenter();
    SerialBT.println("SERVO CENTER");
    break;

  // ── Manual Feed ──
  case 'E':
    feedFish(currentWaterStatus);
    SerialBT.println("FEED TRIGGERED");
    break;

  default:
    SerialBT.println("INVALID CMD");
    break;
  }
}

#endif