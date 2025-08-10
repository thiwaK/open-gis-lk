import sqlite3
import pandas as pd

# Load CSV files
province_df = pd.read_csv("province.csv")
district_df = pd.read_csv("district.csv")
dsd_df = pd.read_csv("dsd.csv")
gnd_df = pd.read_csv("gnd.csv")

duplicates = gnd_df[gnd_df.duplicated(subset="admin_code", keep=False)]
print("Duplicates:\n", duplicates)

# Clean column names if needed
province_df.columns = [c.strip().replace("'", "") for c in province_df.columns]

# Connect to SQLite (creates a new DB file)
conn = sqlite3.connect("admin_divisions.db")
cursor = conn.cursor()

# Create tables
cursor.execute("""
CREATE TABLE province (
    prov_code TEXT PRIMARY KEY,
    prov_name TEXT
)
""")

cursor.execute("""
CREATE TABLE district (
    dist_code TEXT PRIMARY KEY,
    prov_code TEXT,
    dist_name TEXT,
    gid INTEGER,
    sp_id TEXT,
    FOREIGN KEY (prov_code) REFERENCES province(prov_code)
)
""")

cursor.execute("""
CREATE TABLE dsd (
    dsd_code TEXT PRIMARY KEY,
    prov_code TEXT,
    dist_code TEXT,
    dsd_name TEXT,
    gid INTEGER,
    sp_id TEXT,
    FOREIGN KEY (prov_code) REFERENCES province(prov_code),
    FOREIGN KEY (dist_code) REFERENCES district(dist_code)
)
""")

cursor.execute("""
CREATE TABLE gnd (
    admin_code TEXT PRIMARY KEY,
    prov_code TEXT,
    dist_code TEXT,
    dsd_code TEXT,
    gnd_name TEXT,
    gnd_code TEXT,
    gid INTEGER,
    sp_id TEXT,
    FOREIGN KEY (prov_code) REFERENCES province(prov_code),
    FOREIGN KEY (dist_code) REFERENCES district(dist_code),
    FOREIGN KEY (dsd_code) REFERENCES dsd(dsd_code)
)
""")

# Insert data
province_df.to_sql("province", conn, if_exists="append", index=False)
district_df.to_sql("district", conn, if_exists="append", index=False)
dsd_df.to_sql("dsd", conn, if_exists="append", index=False)
gnd_df.to_sql("gnd", conn, if_exists="append", index=False)

# Commit and close
conn.commit()
conn.close()
