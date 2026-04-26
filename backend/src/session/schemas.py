from pydantic import BaseModel, Field, UUID4, EmailStr

class SessionCreateSchema(BaseModel):
    class_name: str = Field(min_length=3, max_length=50, description="Name of the class")
    subject: str = Field(min_length=3, max_length=50, description="Subject of the class")
    teacher_email: EmailStr = Field(description="Teacher's email")
class SessionResponseSchema(BaseModel):
    message: str
    session_id: UUID4
    seed: str
    class_name: str
    is_active: bool