from app.security.crypto import (
    generate_rsa_key_pair,
    encrypt_private_key,
    decrypt_private_key,
    calculate_sha256,
    sign_payload,
    verify_signature
)

def test_key_pair_generation():
    pub, priv = generate_rsa_key_pair()
    assert "BEGIN PUBLIC KEY" in pub
    assert "BEGIN PRIVATE KEY" in priv

def test_private_key_encryption_decryption():
    _, priv = generate_rsa_key_pair()
    encrypted = encrypt_private_key(priv)
    assert encrypted != priv
    
    decrypted = decrypt_private_key(encrypted)
    assert decrypted == priv

def test_sha256_hash_calculation():
    payload = {"action": "RunTest", "resource": "Server"}
    h1 = calculate_sha256(payload)
    h2 = calculate_sha256(payload)
    assert h1 == h2
    
    payload_changed = {"action": "RunTest", "resource": "Server", "tampered": True}
    h3 = calculate_sha256(payload_changed)
    assert h1 != h3

def test_signature_sign_and_verify():
    pub, priv = generate_rsa_key_pair()
    payload = {"command": "git push"}
    
    signature = sign_payload(priv, payload)
    assert len(signature) > 0
    
    # Verify signature
    is_valid = verify_signature(pub, signature, payload)
    assert is_valid is True
    
    # Tamper payload and verify fails
    is_valid_tampered = verify_signature(pub, signature, {"command": "git push", "tampered": True})
    assert is_valid_tampered is False
