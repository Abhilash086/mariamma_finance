from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import traceback
from  datetime import datetime
import random
import string
import pytz
import os
import json

app = Flask(__name__)
CORS(app)  # Allows requests from all origins (React frontend)

# MongoDB connection (replace with your actual credentials)
mongo_uri=os.getenv("MONGO_URI")
client = MongoClient(mongo_uri)
db = client.users
collection = db.customers

BASE62_ALPHABET = string.digits + string.ascii_uppercase

def int_to_base62(num):
    if num == 0:
        return BASE62_ALPHABET[0]
    base62 = []
    while num:
        num, rem = divmod(num, 36)
        base62.append(BASE62_ALPHABET[rem])
    return ''.join(reversed(base62))

def generate_secure_id(firstName, lastName,random_length=3):
    # Take first letters uppercase
    initials = (firstName[0] + lastName[0]).upper()
    
    # Get timestamp as YYMMDDHHMM
    dt_str = datetime.now().strftime("%y%m%d%H%M")
    dt_num = int(dt_str)
    
    # Encode timestamp to base62
    encoded_dt = int_to_base62(dt_num)
    
    # Add random suffix for collision safety
    suffix = ''.join(random.choices(BASE62_ALPHABET, k=random_length))
    
    # Combine all parts
    return f"{initials}{encoded_dt}{suffix}"


def is_duplicate_customer(hpNumber,aadhaarOrPan,  email=None, phone=None):
    reasons = []
    # Build the query to match existing customers with same details
    if collection.find_one({"aadhaarOrPan": aadhaarOrPan}):
        reasons.append("aadhaarOrPan already exists")
    # Optionally add more fields to check for better accuracy 
    if email and collection.find_one({"email": email}):
        reasons.append("email already exists")

    if phone and collection.find_one({"phoneNumber": phone}):
        reasons.append("phoneNumber already exists")

    if hpNumber and collection.find_one({"hpNumber": hpNumber}):
        reasons.append("hpNumber already exists")

    if reasons:
        return True, ", ".join(reasons)
    return False, None


def get_ist():
    ist = pytz.timezone('Asia/Kolkata')
    ist_time = datetime.now(ist)
    return ist_time.strftime("%Y-%m-%d %H:%M:%S %Z%z") 

def insert_customer(customer_data):
    is_duplicate, reason = is_duplicate_customer(
        customer_data.get("hpNumber"),
        customer_data.get("aadhaarOrPan"),
        customer_data.get("email"),
        customer_data.get("phoneNumber"),
    )
    if is_duplicate:
        return jsonify({"status": "error", "message": f"Duplicate found: {reason}"}), 409
    else:
        unique_number = generate_secure_id(customer_data["firstName"],customer_data["lastName"])
        customer_data["CustomerID"]= unique_number
        customer_data["InsertedOn"]= get_ist()
        result = collection.insert_one(customer_data)
        customer_data.pop("_id",None)
        return {"insert_id": str(result.inserted_id),"data":customer_data}
    
def serialize_doc(doc):
    doc["_id"] = str(doc["_id"])
    return doc

@app.route('/submit', methods=['POST'])
def submit_data():
    try:
        data = request.get_json(force=True)
        res = insert_customer(data)
        #print(result)
        if "error" in res:
            return jsonify({"status": "error", "message": res["error"]}), 400

        return jsonify({"status": "success", "response":res["data"]}), 200

    except Exception as e:
        
        traceback.print_exc()  # prints full error traceback to logs
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/customers", methods=["GET"])
def get_all_customers():
    customers = list(collection.find())
    serialized_customers = [serialize_doc(doc) for doc in customers]
    return jsonify({"customers_data":serialized_customers,"status":"success"}),200
    
@app.route("/")
def home():
    return jsonify({"message": "API is running"})

if __name__ == '__main__':
    app.run()
