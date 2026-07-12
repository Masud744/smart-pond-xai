"""
simulate_sensor.py — Smart Pond XAI Sensor Simulator
=====================================================
ESP32 ছাড়াই ব্যাকএন্ড টেস্ট করার জন্য fake sensor data পাঠায়।

Usage:
    # একবার ডেটা পাঠাও
    python simulate_sensor.py

    # প্রতি 10 সেকেন্ডে ডেটা পাঠাও (continuous mode)
    python simulate_sensor.py --continuous --interval 10

    # POOR water quality সিমুলেট করো (alert test)
    python simulate_sensor.py --status POOR

    # সাথে prediction ও trigger করো
    python simulate_sensor.py --predict

    # নির্দিষ্ট মান দিয়ে পাঠাও
    python simulate_sensor.py --ph 7.2 --temp 28.5 --turbidity 15

    # ১০টি batch ডেটা পাঠাও (ভ্যারিয়েশন সহ)
    python simulate_sensor.py --batch 10

How to stop:
    Ctrl+C চাপলে বন্ধ হয়ে যাবে।

How to switch back to real ESP32:
    এই স্ক্রিপ্ট বন্ধ করলেই হবে। ESP32 firmware যখন
    POST /api/sensor এ ডেটা পাঠাবে, সেটা সরাসরি কাজ করবে।
    কোনো config পরিবর্তন করা লাগবে না।
"""

import requests
import time
import random
import argparse
import sys
from datetime import datetime

# ── Config ──
API_BASE = "http://127.0.0.1:8000/api"

# Realistic default ranges for Bangladesh pond conditions
DEFAULTS = {
    "ph_min": 6.5,    "ph_max": 8.5,
    "temp_min": 25.0, "temp_max": 32.0,
    "turb_min": 5,    "turb_max": 30,
}


def generate_sensor_data(ph=None, temp=None, turbidity=None, status=None):
    """Realistic sensor values generate করে"""
    data = {
        "ph":          round(ph or random.uniform(DEFAULTS["ph_min"], DEFAULTS["ph_max"]), 2),
        "temperature": round(temp or random.uniform(DEFAULTS["temp_min"], DEFAULTS["temp_max"]), 2),
        "turbidity":   int(turbidity if turbidity is not None else random.randint(DEFAULTS["turb_min"], DEFAULTS["turb_max"])),
    }

    # Force a particular status by adjusting values
    if status == "POOR":
        data["ph"] = round(random.uniform(4.0, 5.5), 2)       # Too acidic
        data["turbidity"] = random.randint(65, 95)             # Very turbid
    elif status == "MODERATE":
        data["ph"] = round(random.uniform(6.0, 6.4), 2)       # Slightly off
        data["turbidity"] = random.randint(35, 55)             # Moderate turbidity

    return data


def send_sensor_data(data):
    """POST /api/sensor এ ডেটা পাঠায়"""
    try:
        resp = requests.post(f"{API_BASE}/sensor", json=data, timeout=10)
        result = resp.json()
        status_icon = {"GOOD": "[GOOD]", "MODERATE": "[WARN]", "POOR": "[POOR]"}.get(
            result.get("status", ""), "[?]"
        )
        print(
            f"  {status_icon} Sensor -> "
            f"pH:{data['ph']:.2f}  Temp:{data['temperature']:.1f} C  "
            f"Turb:{data['turbidity']}%  "
            f"Status:{result.get('status', '?')}  "
            f"[{resp.status_code}]"
        )
        return result
    except requests.ConnectionError:
        print("  [ERROR] Backend offline! Run: python -m uvicorn app.main:app --port 8000")
        return None
    except Exception as e:
        print(f"  [ERROR] Exception: {e}")
        return None


def send_prediction():
    """POST /api/predict/auto — latest sensor data দিয়ে prediction trigger করে"""
    try:
        resp = requests.post(f"{API_BASE}/predict/auto", timeout=15)
        if resp.status_code == 200:
            result = resp.json()
            print(
                f"  [ML] Prediction -> Fish:{result.get('recommended_fish', '?')}  "
                f"Confidence:{result.get('confidence', 0)*100:.1f}%  "
                f"Quality:{result.get('water_quality', '?')}"
            )
        elif resp.status_code == 404:
            print("  [WARN] No sensor data for prediction (send sensor data first)")
        else:
            print(f"  [WARN] Prediction error: {resp.status_code} — {resp.text[:100]}")
    except Exception as e:
        print(f"  [ERROR] Prediction error: {e}")


def send_feeding(mode="auto"):
    """POST /api/feed — feeding trigger করে"""
    try:
        resp = requests.post(
            f"{API_BASE}/feed",
            json={"mode": mode, "duration": 5, "reason": f"Simulated {mode} feeding"},
            timeout=10
        )
        if resp.status_code == 200:
            result = resp.json()
            print(f"  [FEED] Feeding -> {result.get('feeding_status', '?')} ({mode})")
        else:
            print(f"  [WARN] Feeding error: {resp.status_code} — {resp.text[:100]}")
    except Exception as e:
        print(f"  [ERROR] Feeding error: {e}")



def main():
    global API_BASE
    parser = argparse.ArgumentParser(
        description="Smart Pond XAI — Sensor Simulator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python simulate_sensor.py                          # Send one reading
  python simulate_sensor.py --batch 10               # Send 10 readings
  python simulate_sensor.py --continuous              # Send every 30s
  python simulate_sensor.py --status POOR --predict   # Simulate POOR + predict
  python simulate_sensor.py --ph 7.5 --temp 29       # Custom values
        """
    )
    parser.add_argument("--ph",         type=float, help="Fixed pH value (0-14)")
    parser.add_argument("--temp",       type=float, help="Fixed temperature °C (0-50)")
    parser.add_argument("--turbidity",  type=int,   help="Fixed turbidity %% (0-100)")
    parser.add_argument("--status",     choices=["GOOD", "MODERATE", "POOR"],
                        help="Force a water quality status")
    parser.add_argument("--predict",    action="store_true",
                        help="Also trigger ML prediction after sending")
    parser.add_argument("--feed",       action="store_true",
                        help="Also trigger a feeding action")
    parser.add_argument("--batch",      type=int, default=1,
                        help="Number of readings to send (default: 1)")
    parser.add_argument("--continuous", action="store_true",
                        help="Send data continuously until Ctrl+C")
    parser.add_argument("--interval",   type=int, default=30,
                        help="Seconds between sends in continuous mode (default: 30)")
    parser.add_argument("--url",        type=str, default=API_BASE,
                        help=f"Backend API URL (default: {API_BASE})")

    args = parser.parse_args()

    API_BASE = args.url


    print("=" * 60)
    print("  Smart Pond XAI — Sensor Simulator")
    print("=" * 60)
    print(f"  Backend : {API_BASE}")
    print(f"  Mode    : {'Continuous' if args.continuous else f'Batch ({args.batch})'}")
    if args.status:
        print(f"  Status  : Forcing {args.status}")
    print()

    count = 0
    try:
        while True:
            count += 1
            now = datetime.now().strftime("%H:%M:%S")
            print(f"[{now}] Reading #{count}")

            data = generate_sensor_data(
                ph=args.ph, temp=args.temp,
                turbidity=args.turbidity, status=args.status
            )
            result = send_sensor_data(data)

            if result and args.predict:
                send_prediction()

            if result and args.feed:
                send_feeding()

            if not args.continuous and count >= args.batch:
                break

            if args.continuous:
                print(f"  Next in {args.interval}s... (Ctrl+C to stop)\n")
                time.sleep(args.interval)

    except KeyboardInterrupt:
        print(f"\n\n  Simulator stopped. Sent {count} readings.")
        sys.exit(0)

    print(f"\n  Done! Sent {count} reading(s).")
    print(f"  Check dashboard: http://localhost:5173")
    print(f"  Check API docs:  http://127.0.0.1:8000/docs")



if __name__ == "__main__":
    main()
