#ifndef CONFIG_H
#define CONFIG_H

// ── WiFi Credentials ──
#define WIFI_SSID "BDU-Hostel2"
#define WIFI_PASSWORD "dhaka1213"

// ── Backend ──
#define BACKEND_URL "https://pond-management-backend.onrender.com/api/sensor"

// ── Motor Pins ──
#define IN1 27
#define IN2 26
#define IN3 25
#define IN4 33

#define IN5 14
#define IN6 12
#define IN7 13
#define IN8 15

// ── Servo ──
#define SERVO_PIN 18
#define SERVO_REST 0
#define SERVO_FEED 90
#define SERVO_FEED_TIME 2000

// ── Sensors ──
#define TEMP_PIN 4
#define TURB_PIN 34
#define PH_PIN 35

// ── pH Calibration ──
#define PH_CAL_VOLTAGE_4 2.90
#define PH_CAL_VOLTAGE_7 2.50

// ── Turbidity Calibration ──
#define TURB_CLEAR_RAW 3500
#define TURB_DIRTY_RAW 1500

// ── Water Quality Thresholds ──
#define PH_GOOD_MIN 6.5
#define PH_GOOD_MAX 8.5
#define PH_MOD_MIN 6.0
#define PH_MOD_MAX 9.0
#define TEMP_GOOD_MIN 20.0
#define TEMP_GOOD_MAX 32.0
#define TURB_GOOD_MAX 30
#define TURB_MOD_MAX 60

// ── Timing ──
#define FEED_INTERVAL 32400000UL // ৯ ঘন্টা

#endif
