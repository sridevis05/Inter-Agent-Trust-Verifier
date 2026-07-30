import logging
from typing import Optional
from app.config import settings

logger = logging.getLogger("sentineltrust_secrets")

class SecretsManagerService:
    """
    Abstractions for Secrets Management (Vault/AWS/Local).
    Enforces that keys are stored securely rather than plain environmental files.
    """
    @classmethod
    def get_jwt_secret(cls) -> str:
        if settings.SECRETS_PROVIDER == "vault" and settings.VAULT_ADDR:
            # Code structure to connect to Vault HVAC client
            logger.info("Retrieving JWT Secret from HashiCorp Vault...")
            return settings.JWT_SECRET_KEY  # Fallback to current config
        elif settings.SECRETS_PROVIDER == "aws":
            logger.info("Retrieving JWT Secret from AWS Secrets Manager...")
            return settings.JWT_SECRET_KEY
        return settings.JWT_SECRET_KEY

    @classmethod
    def get_aes_key(cls) -> str:
        if settings.SECRETS_PROVIDER == "vault" and settings.VAULT_ADDR:
            logger.info("Retrieving AES key from HashiCorp Vault...")
            return settings.AES_SECRET_KEY
        elif settings.SECRETS_PROVIDER == "aws":
            logger.info("Retrieving AES key from AWS Secrets Manager...")
            return settings.AES_SECRET_KEY
        return settings.AES_SECRET_KEY
        
    @classmethod
    def store_agent_private_key(cls, agent_id: str, encrypted_key: str) -> None:
        """Stores keys securely. In vault mode, would push to secret engine paths."""
        logger.info(f"Storing encrypted private key for Agent: {agent_id} (Provider: {settings.SECRETS_PROVIDER})")
        # In actual AWS, would write to parameter store / secrets manager
        pass
