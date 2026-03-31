from Block import *
from Blockchain import *
from hashlib import sha256
import os
import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
import pickle
import json
import base64

# Authentication helpers
def hash_password(password):
    """Hash password using SHA256"""
    return sha256(password.encode()).hexdigest()

def load_users():
    """Load users from JSON file"""
    if os.path.exists('users.json'):
        with open('users.json', 'r') as f:
            return json.load(f)
    return {}

def save_users(users):
    """Save users to JSON file"""
    with open('users.json', 'w') as f:
        json.dump(users, f, indent=4)

def user_exists(email):
    """Check if user exists"""
    users = load_users()
    return email in users

def validate_password_strength(password):
    """Validate password strength"""
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    if not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    if not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    if not any(c.isdigit() for c in password):
        return False, "Password must contain at least one number"
    special_chars = "!@#$%^&*()_+-=[]{}';:\"\\|,.<>/?"
    if not any(c in special_chars for c in password):
        return False, "Password must contain at least one special character"
    return True, "Password is strong"

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize blockchain
blockchain = Blockchain()
if os.path.exists('blockchain_contract.txt'):
    with open('blockchain_contract.txt', 'rb') as fileinput:
        blockchain = pickle.load(fileinput)
    fileinput.close()

def get_qrcode_files():
    """Get all QR code files from original_barcodes folder"""
    qrcodes = []
    barcodes_path = 'original_barcodes'
    
    if not os.path.exists(barcodes_path):
        return qrcodes
    
    for filename in os.listdir(barcodes_path):
        if filename.lower().endswith(('.png', '.jpg', '.jpeg', '.gif', '.bmp')):
            filepath = os.path.join(barcodes_path, filename)
            try:
                # Calculate hash of file
                with open(filepath, 'rb') as f:
                    file_hash = sha256(f.read()).hexdigest()
                
                # Read and encode image to base64
                with open(filepath, 'rb') as f:
                    base64_data = base64.b64encode(f.read()).decode('utf-8')
                
                qrcodes.append({
                    'name': filename,
                    'hash': file_hash,
                    'base64': base64_data
                })
            except Exception as e:
                print(f"Error processing {filename}: {e}")
    
    return qrcodes

@app.route('/api/get-qrcodes', methods=['GET'])
def get_qrcodes():
    """Get list of available QR codes"""
    try:
        qrcodes = get_qrcode_files()
        return jsonify({
            'success': True,
            'qrcodes': qrcodes,
            'message': f'Found {len(qrcodes)} QR codes'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/add-product', methods=['POST'])
def add_product():
    """Add a new product to blockchain with QR code"""
    try:
        data = request.json
        pid = data.get('productId')
        name = data.get('productName')
        user = data.get('userName')
        address = data.get('address')
        qrcode_filename = data.get('qrcodeFileName')
        qrcode_hash = data.get('qrcodeHash')
        
        if not all([pid, name, user, address, qrcode_filename, qrcode_hash]):
            return jsonify({'success': False, 'message': 'Please enter all details and select QR code'}), 400
        
        # Check if QR code is already used
        for i in range(len(blockchain.chain)):
            if i > 0:  # Skip genesis block
                b = blockchain.chain[i]
                transaction = b.transactions[0]
                arr = transaction.split("#")
                
                # Check if this QR code hash is already in blockchain
                if len(arr) >= 6 and arr[5] == qrcode_hash:
                    return jsonify({
                        'success': False, 
                        'message': f'⚠️ This QR code is already used!\n\nProduct ID: {arr[0]}\nProduct Name: {arr[1]}\n\nEach QR code can only be used once. Please select a different QR code.'
                    }), 409  # 409 Conflict
        
        current_time = datetime.datetime.now()
        # Store QR code hash with product data for authentication
        transaction_data = pid+"#"+name+"#"+user+"#"+address+"#"+qrcode_filename+"#"+qrcode_hash+"#"+str(current_time)
        
        blockchain.add_new_transaction(transaction_data)
        hash_value = blockchain.mine()
        b = blockchain.chain[len(blockchain.chain)-1]
        
        blockchain.save_object(blockchain, 'blockchain_contract.txt')
        
        response = {
            'success': True,
            'message': 'Product added successfully',
            'blockNo': str(b.index),
            'currentHash': str(b.hash),
            'previousHash': str(b.previous_hash),
            'digitalSignature': qrcode_hash
        }
        return jsonify(response), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/authenticate-by-qrcode', methods=['POST'])
def authenticate_by_qrcode():
    """Authenticate a product by scanning QR code"""
    try:
        data = request.json
        qrcode_hash = data.get('qrcodeHash')
        qrcode_filename = data.get('qrcodeFileName')
        
        if not qrcode_hash:
            return jsonify({'success': False, 'message': 'Invalid QR code'}), 400
        
        # Search through blockchain for matching QR code hash
        for i in range(len(blockchain.chain)):
            if i > 0:  # Skip genesis block
                b = blockchain.chain[i]
                transaction = b.transactions[0]
                arr = transaction.split("#")
                
                # Format: productId#name#user#address#qrcodeFileName#qrcodeHash#timestamp
                if len(arr) >= 6 and arr[5] == qrcode_hash:
                    response = {
                        'success': True,
                        'message': 'Product authenticated successfully',
                        'productId': arr[0],
                        'productName': arr[1],
                        'userName': arr[2],
                        'address': arr[3],
                        'qrcodeFileName': arr[4],
                        'timestamp': arr[6] if len(arr) > 6 else 'N/A',
                        'blockNo': str(i)
                    }
                    return jsonify(response), 200
        
        return jsonify({'success': False, 'message': 'QR code not found in blockchain'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/search-product', methods=['POST'])
def search_product():
    """Search for a product by ID"""
    try:
        data = request.json
        pid = data.get('productId')
        
        if not pid:
            return jsonify({'success': False, 'message': 'Product ID required'}), 400
        
        for i in range(len(blockchain.chain)):
            if i > 0:  # Skip genesis block
                b = blockchain.chain[i]
                transaction = b.transactions[0]
                arr = transaction.split("#")
                
                if len(arr) >= 6 and arr[0] == pid:
                    response = {
                        'success': True,
                        'message': 'Product found',
                        'productId': arr[0],
                        'productName': arr[1],
                        'userName': arr[2],
                        'address': arr[3],
                        'qrcodeFileName': arr[4],
                        'timestamp': arr[6] if len(arr) > 6 else 'N/A',
                        'blockNo': str(i)
                    }
                    return jsonify(response), 200
        
        return jsonify({'success': False, 'message': 'Product ID does not exist'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
# ============== AUTHENTICATION ROUTES ==============

@app.route('/api/auth/signup', methods=['POST'])
def signup():
    """Register a new manufacturer"""
    try:
        data = request.json
        name = data.get('name', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not all([name, email, password]):
            return jsonify({'success': False, 'message': 'All fields are required'}), 400
        
        # Check if user already exists
        if user_exists(email):
            return jsonify({'success': False, 'message': 'Email already registered. Please login instead.'}), 409
        
        # Validate password strength
        is_strong, message = validate_password_strength(password)
        if not is_strong:
            return jsonify({'success': False, 'message': message}), 400
        
        # Hash password and save user
        users = load_users()
        users[email] = {
            'name': name,
            'email': email,
            'password': hash_password(password),
            'created_at': str(datetime.datetime.now())
        }
        save_users(users)
        
        return jsonify({
            'success': True,
            'message': 'Account created successfully!',
            'name': name
        }), 201
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Login a manufacturer"""
    try:
        data = request.json
        email = data.get('email', '').strip()
        password = data.get('password', '')
        
        if not email or not password:
            return jsonify({'success': False, 'message': 'Email and password are required'}), 400
        
        users = load_users()
        
        if email not in users:
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
        user = users[email]
        
        # Check password
        if user['password'] != hash_password(password):
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401
        
        return jsonify({
            'success': True,
            'message': 'Login successful!',
            'name': user['name'],
            'email': email
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    """Get all registered users (Admin endpoint)"""
    try:
        users = load_users()
        user_list = []
        for email, user_data in users.items():
            user_list.append({
                'name': user_data['name'],
                'email': email,
                'created_at': user_data.get('created_at', 'N/A'),
                'password_hash': user_data['password'][:10] + '...'  # Show partial hash
            })
        return jsonify({
            'success': True,
            'total_users': len(user_list),
            'users': user_list
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/users/<email>', methods=['DELETE'])
def delete_user(email):
    """Delete a specific user by email"""
    try:
        users = load_users()
        if email not in users:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        deleted_user = users.pop(email)
        save_users(users)
        
        return jsonify({
            'success': True,
            'message': f'User {email} deleted successfully',
            'deleted_user': {
                'name': deleted_user['name'],
                'email': email
            }
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/admin/users', methods=['DELETE'])
def delete_all_users():
    """Delete all users (Clear all user data)"""
    try:
        save_users({})
        return jsonify({
            'success': True,
            'message': 'All users have been deleted successfully'
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
