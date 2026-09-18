from pydantic import BaseModel, EmailStr, field_validator
import re
from typing import Optional


class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone_number: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone_number: Optional[str] = None

    class Config:
        from_attributes = True


class FirebaseLoginRequest(BaseModel):
    firebase_uid: str
    email: Optional[str] = None
    name: Optional[str] = None
    phone_number: Optional[str] = None


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    mobile: Optional[str] = None

    class Config:
        from_attributes = True

    @field_validator("name")
    @classmethod
    def validate_name(cls, v):
        if v is not None:
            v_strip = v.strip()
            if not v_strip:
                raise ValueError("Full Name cannot be empty.")
            return v_strip
        return v

    @field_validator("phone_number", "mobile")
    @classmethod
    def validate_phone(cls, v):
        if v is not None:
            v_strip = v.strip()
            if v_strip == "":
                return None
            clean = re.sub(r"\D", "", v_strip)
            if len(clean) < 10:
                raise ValueError("Please enter a valid 10-digit Indian mobile number starting with 6-9.")
            last10 = clean[-10:]
            if not re.match(r"^[6-9]\d{9}$", last10):
                raise ValueError("Please enter a valid 10-digit Indian mobile number starting with 6-9.")
            return f"+91{last10}"
        return None