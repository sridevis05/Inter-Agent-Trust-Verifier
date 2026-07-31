from app.security.crypto import generate_rsa_key_pair, sign_payload

class AgentAlpha:
    def __init__(self, agent_id: str = "agent_alpha", name: str = "Agent Alpha"):
        self.id = agent_id
        self.name = name
        # Generate the RSA key pair on startup
        self.public_key, self.private_key = generate_rsa_key_pair()
        self.kid = f"key_{self.id}_v1"

    def create_instruction(self, action: str, resource: str, params: dict, fake_key_sign: bool = False) -> dict:
        """
        Creates and signs an instruction payload.
        If fake_key_sign is True, it signs the instruction with a fresh temporary key to simulate a signature attack.
        """
        payload = {
            "action": action,
            "resource": resource,
            "params": params
        }
        
        priv_key_to_use = self.private_key
        kid_to_use = self.kid
        
        if fake_key_sign:
            _, fake_priv = generate_rsa_key_pair()
            priv_key_to_use = fake_priv
            kid_to_use = "key_attacker_fake_v1"
            
        signature = sign_payload(priv_key_to_use, payload)
        
        return {
            "sender": self.id,
            "receiver": "agent_beta",
            "kid": kid_to_use,
            "signature": signature,
            "payload": payload
        }
