import base64
import hashlib
import json
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization, hashes
from cryptography.fernet import Fernet
from app.config import settings

# Initialize Fernet cipher for local encryption of private keys
# Ensure key is exactly 32 url-safe base64-encoded bytes
def _get_fernet_key() -> bytes:
    # Fernet key needs to be 32 base64 bytes. Let's hash the setting secret to guarantee it.
    key_bytes = settings.AES_SECRET_KEY.encode('utf-8')
    hashed = hashlib.sha256(key_bytes).digest()
    return base64.urlsafe_b64encode(hashed)

fernet_cipher = Fernet(_get_fernet_key())

def encrypt_private_key(private_key_pem: str) -> str:
    """Encrypt private key PEM using AES-256 (Fernet) for secure storage in database."""
    encrypted = fernet_cipher.encrypt(private_key_pem.encode('utf-8'))
    return encrypted.decode('utf-8')

def decrypt_private_key(encrypted_pem: str) -> str:
    """Decrypt private key PEM from secure storage."""
    decrypted = fernet_cipher.decrypt(encrypted_pem.encode('utf-8'))
    return decrypted.decode('utf-8')

def generate_rsa_key_pair() -> tuple[str, str]:
    """Generate RSA 2048-bit key pair and return as PEM strings."""
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048
    )
    
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')
    
    public_pem = private_key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')
    
    return public_pem, private_pem

def calculate_sha256(data: dict) -> str:
    """Calculate SHA-256 hash of a dictionary payload."""
    serialized = json.dumps(data, sort_keys=True)
    return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

def sign_payload(private_key_pem: str, payload: dict) -> str:
    """Sign payload using RSA private key and SHA-256 hashing."""
    private_key = serialization.load_pem_private_key(
        private_key_pem.encode('utf-8'),
        password=None
    )
    
    serialized = json.dumps(payload, sort_keys=True)
    signature = private_key.sign(
        serialized.encode('utf-8'),
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    return base64.b64encode(signature).decode('utf-8')

def verify_signature(public_key_pem: str, signature_b64: str, payload: dict) -> bool:
    """Verify RSA signature using RSA public key."""
    try:
        public_key = serialization.load_pem_public_key(
            public_key_pem.encode('utf-8')
        )
        signature = base64.b64decode(signature_b64.encode('utf-8'))
        serialized = json.dumps(payload, sort_keys=True)
        
        public_key.verify(
            signature,
            serialized.encode('utf-8'),
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False
