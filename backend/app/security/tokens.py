import datetime
import jwt
from typing import Optional, List, Dict, Any
from app.config import settings

def issue_delegation_token(
    issuer: str,
    subject: str,
    role: str,
    allowed_actions: List[str],
    scope: Optional[Dict[str, Any]] = None,
    expires_in_seconds: int = 3600
) -> tuple[str, datetime.datetime]:
    """Issue a signed JWT delegation token for inter-agent delegation."""
    now = datetime.datetime.utcnow()
    expires_at = now + datetime.timedelta(seconds=expires_in_seconds)
    
    payload = {
        "iss": issuer,
        "sub": subject,
        "role": role,
        "aud": "SentinelTrust-Security-Gateway",
        "exp": int(expires_at.timestamp()),
        "nbf": int(now.timestamp()),
        "iat": int(now.timestamp()),
        "actions": allowed_actions,
        "scope": scope or {}
    }
    
    token = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )
    
    return token, expires_at

def verify_delegation_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and verify JWT delegation token. Return payload if valid, None if expired/invalid."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            audience="SentinelTrust-Security-Gateway"
        )
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, jwt.InvalidAudienceError):
        return None
