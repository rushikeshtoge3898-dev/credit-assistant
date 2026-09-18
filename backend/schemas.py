from pydantic import BaseModel, EmailStr
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