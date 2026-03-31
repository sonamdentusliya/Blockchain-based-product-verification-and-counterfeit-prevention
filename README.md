# 🔐 Blockchain-Based Product Verification and Counterfeit Prevention

## 📌 Project Overview

This project is a **Blockchain-based Product Verification System** designed to prevent counterfeit products in the supply chain.

It allows:

* **Manufacturers** to register products securely on a blockchain
* **Customers** to verify product authenticity using QR codes

Each product is linked with a **unique QR code** and stored as a **block in the blockchain**, ensuring transparency, immutability, and security.

---

## 🚀 Features

### 👨‍🏭 Manufacturer

* Secure Signup & Login
* Add new products to blockchain
* Attach unique QR code to each product
* Prevent duplicate QR code usage
* Retrieve product details
* Authenticate products via QR code scan

### 👤 Customer

* Verify product using Product ID
* Authenticate product via QR code
* Detect counterfeit products easily

### 🔗 Blockchain Features

* Custom blockchain implementation
* Proof-of-Work (PoW) consensus
* Immutable product records
* Block hash validation

---

## 🛠️ Technologies Used

### Backend

* Python
* Flask
* SHA-256 Hashing
* Pickle (for blockchain storage)

### Frontend

* HTML
* CSS
* JavaScript

### Other Libraries

* qrcode
* Pillow (PIL)
* Flask-CORS

---

## 📁 Project Structure

```
├── Main.py                # Flask backend (API routes)
├── Blockchain.py         # Blockchain logic
├── Block.py              # Block structure
├── GenerateQRcode.py     # QR code generator
├── index.html            # Frontend UI
├── styles.css            # Styling
├── script.js             # Frontend logic
├── blockchain_contract.txt  # Stored blockchain data
├── users.json            # User database (auto-created)
├── original_barcodes/    # QR code images
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
```

### 2️⃣ Install Dependencies

```bash
pip install flask flask-cors qrcode pillow
```

### 3️⃣ Run the Backend Server

```bash
python Main.py
```

Server will start at:

```
http://localhost:5000
```

### 4️⃣ Open Frontend

Simply open:

```
index.html
```

in your browser.

---

## 📦 How It Works

### 🔹 Step 1: Generate QR Codes

```bash
python GenerateQRcode.py
```

* Generates unique QR codes
* Stored in `original_barcodes/`

### 🔹 Step 2: Manufacturer Workflow

1. Signup/Login
2. Enter product details
3. Select QR code
4. Product is stored in blockchain

### 🔹 Step 3: Customer Verification

* Enter Product ID OR
* Upload QR Code
* System verifies from blockchain

---

## 🔐 Security Features

* SHA-256 hashing for:

  * Passwords
  * QR code verification
* Blockchain immutability
* Unique QR code enforcement
* Password strength validation

---

## 📡 API Endpoints

### Product APIs

* `POST /api/add-product`
* `POST /api/search-product`
* `POST /api/authenticate-by-qrcode`

### Authentication APIs

* `POST /api/auth/signup`
* `POST /api/auth/login`

### Admin APIs

* `GET /api/admin/users`
* `DELETE /api/admin/users`
* `DELETE /api/admin/users/<email>`

---

## 📸 Output Screenshot 


<img width="550" height="550" alt="image" src="https://github.com/user-attachments/assets/8a90b6a3-c52d-44f2-bd8e-ba9ce17b94ae" />
