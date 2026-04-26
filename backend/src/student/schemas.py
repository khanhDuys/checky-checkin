from pydantic import BaseModel, Field, UUID4
class TOTPSchema(BaseModel):
    session_id: UUID4
    totp: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")