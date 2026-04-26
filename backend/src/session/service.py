import uuid
import pyotp
from database import db
import datetime
from google.cloud import firestore
def setup_session(class_name: str, subject: str, teacher_email: str):
    sesID = uuid.uuid4()
    seed = pyotp.random_base32()
    doc_ref = db.collection("attendance_sessions").document(str(sesID))
    doc_ref.set({
        "className": class_name,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "date": datetime.datetime.now().strftime("%Y-%m-%d"),
        "subject": subject,
        "teacherEmail": teacher_email,
        "isActive":True,
        "seed": seed
    })
    return {
        "session_ID": sesID,
        "seed": seed
    }
    