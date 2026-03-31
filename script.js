const API_BASE_URL = 'http://localhost:5000/api';
let selectedQRCode = null;
let currentProductData = null;
let currentUser = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('manufacturerUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('homeScreen').style.display = 'none';
        document.getElementById('manufacturerSection').style.display = 'block';
    }

    // Add password strength checker
    document.getElementById('signupPassword')?.addEventListener('input', checkPasswordStrength);
});

// ============== HOME SCREEN NAVIGATION ==============

function startAsManufacturer() {
    // Check if user is logged in
    const savedUser = localStorage.getItem('manufacturerUser');
    if (savedUser) {
        // User already logged in, go straight to dashboard
        currentUser = JSON.parse(savedUser);
        document.getElementById('homeScreen').style.display = 'none';
        document.getElementById('manufacturerSection').style.display = 'block';
    } else {
        // User not logged in, show auth page
        document.getElementById('homeScreen').style.display = 'none';
        document.getElementById('authScreen').style.display = 'block';
    }
}

function startAsCustomer() {
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('customerSection').style.display = 'block';
}

function toggleAuthForm() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    loginForm.style.display = loginForm.style.display === 'none' ? 'block' : 'none';
    signupForm.style.display = signupForm.style.display === 'none' ? 'block' : 'none';
}

function goBackToHome() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('homeScreen').style.display = 'block';
    
    // Reset auth forms
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('signupName').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('signupConfirmPassword').value = '';
    document.getElementById('loginOutput').innerHTML = '';
    document.getElementById('signupOutput').innerHTML = '';
}

function goHome() {
    document.getElementById('homeScreen').style.display = 'block';
    document.getElementById('manufacturerSection').style.display = 'none';
    document.getElementById('customerSection').style.display = 'none';
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('manufacturerOutput').innerHTML = '';
    document.getElementById('customerOutput').innerHTML = '';
}

function checkPasswordStrength() {
    const password = document.getElementById('signupPassword').value;
    const strengthDiv = document.getElementById('passwordStrength');
    const strengthIndicator = document.getElementById('strengthIndicator');
    const strengthText = document.getElementById('strengthText');

    if (password.length === 0) {
        strengthDiv.style.display = 'none';
        return;
    }

    strengthDiv.style.display = 'block';

    let strength = 0;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLongEnough = password.length >= 8;

    if (hasUppercase) strength++;
    if (hasLowercase) strength++;
    if (hasNumber) strength++;
    if (hasSpecial) strength++;
    if (isLongEnough) strength++;

    strengthIndicator.classList.remove('weak', 'fair', 'good');

    if (strength <= 2) {
        strengthIndicator.classList.add('weak');
        strengthText.textContent = '❌ Weak: Add more complexity';
    } else if (strength <= 3) {
        strengthIndicator.classList.add('fair');
        strengthText.textContent = '⚠️ Fair: Add uppercase, numbers, and special characters';
    } else if (strength >= 4) {
        strengthIndicator.classList.add('good');
        strengthText.textContent = '✓ Strong: Good password!';
    }
}

function validatePassword(password) {
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    const isLongEnough = password.length >= 8;

    if (!isLongEnough) {
        return { valid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!hasUppercase) {
        return { valid: false, message: 'Password must contain at least one uppercase letter' };
    }
    if (!hasLowercase) {
        return { valid: false, message: 'Password must contain at least one lowercase letter' };
    }
    if (!hasNumber) {
        return { valid: false, message: 'Password must contain at least one number' };
    }
    if (!hasSpecial) {
        return { valid: false, message: 'Password must contain at least one special character (!@#$%^&*)' };
    }

    return { valid: true, message: 'Password is strong' };
}

async function manufacturerSignup() {
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const outputDiv = document.getElementById('signupOutput');

    // Validation
    if (!name || !email || !password || !confirmPassword) {
        showAuthOutput('Please fill in all fields', outputDiv, false);
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showAuthOutput('Please enter a valid email address', outputDiv, false);
        return;
    }

    // Password validation
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
        showAuthOutput(passwordCheck.message, outputDiv, false);
        return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
        showAuthOutput('Passwords do not match', outputDiv, false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                email,
                password
            })
        });

        const data = await response.json();

        if (data.success) {
            showAuthOutput('✓ Account created successfully! Logging you in...', outputDiv, true);
            
            // Auto-login after successful signup
            setTimeout(() => {
                currentUser = { name, email };
                localStorage.setItem('manufacturerUser', JSON.stringify(currentUser));
                document.getElementById('authScreen').style.display = 'none';
                document.getElementById('manufacturerSection').style.display = 'block';
            }, 1500);
        } else {
            showAuthOutput(data.message, outputDiv, false);
        }
    } catch (error) {
        showAuthOutput(`Error: ${error.message}`, outputDiv, false);
    }
}

async function manufacturerLogin() {
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const outputDiv = document.getElementById('loginOutput');

    if (!email || !password) {
        showAuthOutput('Please enter both email and password', outputDiv, false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email,
                password
            })
        });

        const data = await response.json();

        if (data.success) {
            showAuthOutput('✓ Login successful! Redirecting...', outputDiv, true);
            
            currentUser = { name: data.name, email };
            localStorage.setItem('manufacturerUser', JSON.stringify(currentUser));
            
            setTimeout(() => {
                document.getElementById('authScreen').style.display = 'none';
                document.getElementById('manufacturerSection').style.display = 'block';
            }, 1000);
        } else {
            showAuthOutput(data.message, outputDiv, false);
        }
    } catch (error) {
        showAuthOutput(`Error: ${error.message}`, outputDiv, false);
    }
}

function logout() {
    localStorage.removeItem('manufacturerUser');
    currentUser = null;
    
    // Clear all forms
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('signupName').value = '';
    document.getElementById('signupEmail').value = '';
    document.getElementById('signupPassword').value = '';
    document.getElementById('signupConfirmPassword').value = '';
    document.getElementById('manufacturerOutput').innerHTML = '';
    document.getElementById('customerOutput').innerHTML = '';
    
    // Show login form
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
    
    // Return to home screen
    document.getElementById('homeScreen').style.display = 'block';
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('manufacturerSection').style.display = 'none';
    document.getElementById('customerSection').style.display = 'none';
}

function showAuthOutput(message, outputDiv, isSuccess) {
    outputDiv.textContent = message;
    outputDiv.classList.remove('success', 'error');
    outputDiv.classList.add('show');
    outputDiv.classList.add(isSuccess ? 'success' : 'error');
}


// ============== MANUFACTURER FUNCTIONS ==============

function saveProductStep1() {
    const productId = document.getElementById('productId').value;
    const productName = document.getElementById('productName').value;
    const userName = document.getElementById('userName').value;
    const address = document.getElementById('address').value;

    if (!productId || !productName || !userName || !address) {
        displayOutput('Please enter all details', document.getElementById('manufacturerOutput'), false);
        return;
    }

    // Store product data temporarily
    currentProductData = {
        productId,
        productName,
        userName,
        address
    };

    // Open file browser to select QR code
    document.getElementById('qrcodeFileInput').click();
    document.getElementById('qrcodeFileInput').addEventListener('change', selectAndSaveQRCode, { once: true });
}

async function selectAndSaveQRCode(event) {
    const file = event.target.files[0];
    const outputBox = document.getElementById('manufacturerOutput');

    if (!file) {
        return;
    }

    try {
        const fileContent = await readFileAsArrayBuffer(file);
        const hash = await calculateSHA256(fileContent);

        // Save product with selected QR code
        const response = await fetch(`${API_BASE_URL}/add-product`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId: currentProductData.productId,
                productName: currentProductData.productName,
                userName: currentProductData.userName,
                address: currentProductData.address,
                qrcodeFileName: file.name,
                qrcodeHash: hash
            })
        });

        const data = await response.json();

        if (data.success) {
            const result = `✓ Product Saved Successfully!\n\n` +
                `Product ID: ${currentProductData.productId}\n` +
                `Product Name: ${currentProductData.productName}\n` +
                `QR Code: ${file.name}\n` +
                `Block No: ${data.blockNo}\n` +
                `Current Hash: ${data.currentHash}\n` +
                `Digital Signature: ${data.digitalSignature}`;
            
            displayOutput(result, outputBox, true);
            
            // Clear form
            document.getElementById('productId').value = '';
            document.getElementById('productName').value = '';
            document.getElementById('userName').value = '';
            document.getElementById('address').value = '';
            currentProductData = null;
        } else {
            // Show warning/error message
            displayOutput(data.message, outputBox, false);
        }
    } catch (error) {
        displayOutput(`✗ Error: ${error.message}`, outputBox, false);
    }

    event.target.value = '';
}

async function manufacturerRetrieveProduct() {
    const productId = document.getElementById('productId').value;
    const outputBox = document.getElementById('manufacturerOutput');

    if (!productId) {
        displayOutput('Please enter a Product ID first', outputBox, false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/search-product`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId
            })
        });

        const data = await response.json();

        if (data.success) {
            const result = `✓ Product Found!\n\n` +
                `Product ID: ${data.productId}\n` +
                `Product Name: ${data.productName}\n` +
                `Company/User: ${data.userName}\n` +
                `Address: ${data.address}\n` +
                `QR Code: ${data.qrcodeFileName}\n` +
                `Timestamp: ${data.timestamp}\n` +
                `Block No: ${data.blockNo}`;
            
            displayOutput(result, outputBox, true);
        } else {
            displayOutput(`✗ Error: ${data.message}`, outputBox, false);
        }
    } catch (error) {
        displayOutput(`✗ Error: ${error.message}`, outputBox, false);
    }
}

function openBarcodeUpload() {
    document.getElementById('qrcodeFileInput').click();
    document.getElementById('qrcodeFileInput').addEventListener('change', authenticateProductFromFile, { once: true });
}

async function authenticateProductFromFile(event) {
    const file = event.target.files[0];
    const outputBox = document.getElementById('manufacturerOutput');

    if (!file) {
        return;
    }

    try {
        const fileContent = await readFileAsArrayBuffer(file);
        const hash = await calculateSHA256(fileContent);

        const response = await fetch(`${API_BASE_URL}/authenticate-by-qrcode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                qrcodeFileName: file.name,
                qrcodeHash: hash
            })
        });

        const data = await response.json();

        if (data.success) {
            const result = `✓ Product Authenticated Successfully!\n\n` +
                `Product ID: ${data.productId}\n` +
                `Product Name: ${data.productName}\n` +
                `Company/User: ${data.userName}\n` +
                `Address: ${data.address}\n` +
                `Timestamp: ${data.timestamp}\n` +
                `Block No: ${data.blockNo}\n` +
                `File: ${file.name}`;
            
            displayOutput(result, outputBox, true);
        } else {
            displayOutput(`✗ Barcode Not Authenticated\n\nFile: ${file.name}\n\nThis barcode does not exist in the blockchain.`, outputBox, false);
        }
    } catch (error) {
        displayOutput(`✗ Error: ${error.message}`, outputBox, false);
    }

    event.target.value = '';
}

function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
}

async function calculateSHA256(arrayBuffer) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============== CUSTOMER FUNCTIONS ==============

async function customerSearchProduct() {
    const productId = document.getElementById('customerProductId').value;
    const outputBox = document.getElementById('customerOutput');

    if (!productId) {
        displayOutput('Please enter a Product ID', outputBox, false);
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/search-product`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                productId
            })
        });

        const data = await response.json();

        if (data.success) {
            const result = `✓ Product Found!\n\n` +
                `Product ID: ${data.productId}\n` +
                `Product Name: ${data.productName}\n` +
                `Company/User: ${data.userName}\n` +
                `Address: ${data.address}\n` +
                `Timestamp: ${data.timestamp}\n` +
                `Block No: ${data.blockNo}`;
            
            displayOutput(result, outputBox, true);
        } else {
            displayOutput(`✗ Error: ${data.message}`, outputBox, false);
        }
    } catch (error) {
        displayOutput(`✗ Error: ${error.message}`, outputBox, false);
    }
}

function customerAuthenticateClick() {
    document.getElementById('qrcodeFileInput').click();
    document.getElementById('qrcodeFileInput').addEventListener('change', customerAuthenticateFromFile, { once: true });
}

async function customerAuthenticateFromFile(event) {
    const file = event.target.files[0];
    const outputBox = document.getElementById('customerOutput');

    if (!file) {
        return;
    }

    try {
        const fileContent = await readFileAsArrayBuffer(file);
        const hash = await calculateSHA256(fileContent);

        const response = await fetch(`${API_BASE_URL}/authenticate-by-qrcode`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                qrcodeFileName: file.name,
                qrcodeHash: hash
            })
        });

        const data = await response.json();

        if (data.success) {
            const result = `✓ Product Verified!\n\n` +
                `Product ID: ${data.productId}\n` +
                `Product Name: ${data.productName}\n` +
                `Company/User: ${data.userName}\n` +
                `Address: ${data.address}\n` +
                `Timestamp: ${data.timestamp}\n` +
                `Block No: ${data.blockNo}`;
            
            displayOutput(result, outputBox, true);
        } else {
            displayOutput(`✗ Product Not Found or Not Authentic\n\nThis QR code is not registered in the blockchain.`, outputBox, false);
        }
    } catch (error) {
        displayOutput(`✗ Error: ${error.message}`, outputBox, false);
    }

    event.target.value = '';
}

function displayOutput(message, outputBox, isSuccess) {
    outputBox.textContent = message;
    outputBox.classList.remove('success', 'error');
    outputBox.classList.add(isSuccess ? 'success' : 'error');
}