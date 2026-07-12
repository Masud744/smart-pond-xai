import os
from dotenv import load_dotenv
from influxdb_client import InfluxDBClient

load_dotenv()

URL = os.getenv("INFLUXDB_URL", "https://us-east-1-1.aws.cloud2.influxdata.com")
TOKEN = os.getenv("INFLUXDB_TOKEN", "")
ORG = os.getenv("INFLUXDB_ORG", "Team_Plan_B")
BUCKET = os.getenv("INFLUXDB_BUCKET", "smart_pond_db")
POND = os.getenv("POND_ID", "pond_01")

client = InfluxDBClient(url=URL, token=TOKEN, org=ORG)
query_api = client.query_api()

print("--- Querying Raw water_sensor_data ---")
query = f'''
from(bucket: "{BUCKET}")
|> range(start: -24h)
|> filter(fn: (r) => r._measurement == "water_sensor_data")
|> filter(fn: (r) => r.pond_id == "{POND}")
'''
tables = query_api.query(query, org=ORG)
print(f"Number of tables returned: {len(tables)}")
for i, table in enumerate(tables):
    print(f"\nTable {i}:")
    for j, record in enumerate(table.records[:3]):
        print(f"  Record {j}: time={record.get_time()}, field={record.get_field()}, value={record.get_value()}, tags={ {k: record.values.get(k) for k in ['status', 'device_id', 'pond_id']} }")

print("\n--- Querying with last() and pivot() ---")
query_pivot = f'''
from(bucket: "{BUCKET}")
|> range(start: -24h)
|> filter(fn: (r) => r._measurement == "water_sensor_data")
|> filter(fn: (r) => r.pond_id == "{POND}")
|> last()
|> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
'''
tables_pivot = query_api.query(query_pivot, org=ORG)
print(f"Number of pivoted tables returned: {len(tables_pivot)}")
for i, table in enumerate(tables_pivot):
    print(f"\nPivoted Table {i}:")
    for j, record in enumerate(table.records):
        print(f"  Record {j}: time={record.get_time()}, values={record.values}")
