import hmac
import hashlib
import os
import secrets

# Secret used to sign capability tokens (in production, loaded from secure secret manager)
QR_SECRET = os.getenv("QR_SECRET", "northstar-reflex-secure-signing-secret-2026")


def generate_qr_token(order_id: str, secret: str = QR_SECRET) -> str:
    """
    Generates a capability token tied to the order ID.
    Format: ntk_<nonce>_<signature>
    This token is embedded in the retailer's QR code and acts as proof-of-delivery
    authorization as well as the customer's read-only tracking token.
    """
    nonce = secrets.token_hex(6)
    payload = f"{order_id}:{nonce}"
    signature = hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()[:16]
    return f"ntk_{nonce}_{signature}"


def verify_qr_token(order_id: str, token: str, secret: str = QR_SECRET) -> bool:
    """
    Verifies that the provided qr_token is cryptographically valid for the given order_id.
    """
    if not token or not token.startswith("ntk_"):
        return False
    parts = token.split("_")
    if len(parts) != 3:
        return False
    nonce = parts[1]
    provided_sig = parts[2]
    payload = f"{order_id}:{nonce}"
    expected_sig = hmac.new(secret.encode("utf-8"), payload.encode("utf-8"), hashlib.sha256).hexdigest()[:16]
    return hmac.compare_digest(provided_sig, expected_sig)
