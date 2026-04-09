from pydantic import BaseModel, Field, UUID4

class SessionCreateSchema(BaseModel):
    class_name: str = Field(min_length=3, max_length=50, description="Name of the class")
class SessionResponseSchema(BaseModel):
    message: str
    session_id: UUID4
    seed: str
    class_name: str
    is_active: bool