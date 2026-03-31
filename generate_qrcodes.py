#  Python generate_qrcodes.py

import qrcode
import os
from PIL import Image

def generate_qr_codes(num_codes=10, output_folder='original_barcodes'):
    """
    Generate QR codes as JPG files
    
        num_codes: Number of QR codes to generate (default: 10)
        output_folder: Folder where QR codes will be saved
    """
    
    # Create folder if it doesn't exist
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)
        print(f"Created folder: {output_folder}")
    
    # Get existing files to continue numbering
    existing_files = [f for f in os.listdir(output_folder) if f.endswith('.jpg')]
    start_number = len(existing_files) + 1
    
    print(f"Generating {num_codes} QR codes...\n")
    
    for i in range(num_codes):
        qr_number = start_number + i
        
        # Create QR code data (you can customize this)
        qr_data = f"PRODUCT_QR_{qr_number:04d}_ID_{qr_number:06d}"
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=2,
        )
        qr.add_data(qr_data)
        qr.make(fit=True)
        
        # Create image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save as JPG
        filename = f"{output_folder}/{qr_number}.jpg"
        img.save(filename, "JPEG", quality=95)
        
        print(f"✓ Generated: {qr_number}.jpg - Data: {qr_data}")
    
    print(f"\n✅ Successfully generated {num_codes} QR codes!")
    print(f"📁 Saved to: {os.path.abspath(output_folder)}")
    print(f"📊 Total QR codes now: {len([f for f in os.listdir(output_folder) if f.endswith('.jpg')])}")

if __name__ == "__main__":
    # Generate 10 new QR codes
    print("=" * 60)
    print("QR CODE GENERATOR")
    print("=" * 60)
    print()
    
    # You can change the number of QR codes to generate
    generate_qr_codes(num_codes=10)
    
    print("\n" + "=" * 60)
    print("Successfully generated QR codes!")
    print("=" * 60)
