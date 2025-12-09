import bcrypt
import random
import smtplib
import sys
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from params import from_email, app_password

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), 
                         bcrypt.gensalt()).decode('utf-8')

def generate_otp():
    return str(random.randint(100000, 999999))

def send_otp_email(to_email, otp):
    subject = "CivicChain Cloud - Your OTP Code"
    body = f"""
    Welcome to CivicChain Cloud!

    Your One-Time Password (OTP) is: {otp}

    This OTP is valid for 5 minutes.
    """

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP('smtp.gmail.com', 587) as server:
            server.starttls()
            server.login(from_email, app_password)
            server.send_message(msg)
            print(f"✅ OTP sent to {to_email}")
            return True
    except Exception as e:
        print(f"❌ Failed to send OTP: {e}")
        return False

# NEW: This function automates the credential generation
def process_ids_file():
    credentials = {}
    emails = {}
    
    # 1. Read the raw IDs file (username,email,password)
    if not os.path.exists('ids'):
        return False

    with open('ids', 'r') as file:
        for line in file:
            line = line.strip()
            if not line or line.startswith("#"): continue
            
            try:
                parts = line.split(',')
                if len(parts) == 3:
                    username, email, password = parts
                    # Hash it fresh every time
                    credentials[username] = hash_password(password)
                    emails[username] = email
            except ValueError:
                continue

    # 2. Write to the secure credentials file
    with open('credentials', 'w') as file:
        for username in credentials:
            file.write(f'{username},{emails[username]},{credentials[username]}\n')
    
    return True

# Allow running as script too
if __name__ == '__main__':
    process_ids_file()
    print("✅ Credentials updated manually.")