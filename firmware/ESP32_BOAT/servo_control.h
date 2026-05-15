#ifndef SERVO_CONTROL_H
#define SERVO_CONTROL_H

#include <ESP32Servo.h>
#include "config.h"
#include "status.h"

Servo myServo;
int servoAngle = SERVO_REST; // default বন্ধ (0 degree)

void servoSetup()
{
  myServo.attach(SERVO_PIN);
  myServo.write(SERVO_REST);
  Serial.println("[SERVO] Ready - Position: " + String(SERVO_REST));
}

// Manual control — 0 থেকে 90 এর মধ্যে থাকবে
void servoUp()
{
  servoAngle = constrain(servoAngle + 15, SERVO_REST, SERVO_FEED);
  myServo.write(servoAngle);
  Serial.println("[SERVO] Angle: " + String(servoAngle));
}

void servoDown()
{
  servoAngle = constrain(servoAngle - 15, SERVO_REST, SERVO_FEED);
  myServo.write(servoAngle);
  Serial.println("[SERVO] Angle: " + String(servoAngle));
}

void servoCenter()
{
  servoAngle = SERVO_FEED / 2; // 45 degree (মাঝামাঝি)
  myServo.write(servoAngle);
  Serial.println("[SERVO] Center: " + String(servoAngle));
}

// ── Auto Feeding ──
void feedFish(WaterStatus status)
{
  if (status == POOR)
  {
    Serial.println("[FEED] Water POOR → Feeding Cancelled");
    return;
  }

  Serial.println("[FEED] Feeding Fish...");

  // ০ থেকে ৯০ এ যাবে (খুলবে)
  myServo.write(SERVO_FEED);
  delay(SERVO_FEED_TIME);

  // আবার ০ এ ফিরে আসবে (বন্ধ)
  myServo.write(SERVO_REST);
  servoAngle = SERVO_REST;

  // Jitter বন্ধ করতে detach
  delay(500);
  myServo.detach();
  delay(100);
  myServo.attach(SERVO_PIN);

  Serial.println("[FEED] Done");
}

#endif