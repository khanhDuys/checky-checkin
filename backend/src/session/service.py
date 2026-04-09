import uuid
import pyotp
def setup_session(class_name: str):
    sesID = uuid.uuid4()
    seed = pyotp.random_base32()
    return {
        "session_ID": sesID,
        "seed": seed
    }