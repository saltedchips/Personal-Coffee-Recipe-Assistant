from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.params import Depends
from pydantic import BaseModel
from typing import List, Annotated
import models
from database import engine, SessionLocal
from sqlalchemy.orm import Session
#Declare data models

#User has UID, Username, and Utensils
class UtensilsBase(BaseModel):
    Utensil: str

class UserBase(BaseModel):
    Username: str
    Password: str
    Utensils: List[UtensilsBase]

class RecipeBase(BaseModel):
    Utensils: List[UtensilsBase]
    Recipie: str

app = FastAPI()

models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

origins = [
    #Define base URL/Origin for API connections
    "https://localhost:5432/CoffeeApp"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

@app.post("/user/")
async def create_user(user: UserBase, db:db_dependency):
    db_user = models.User(Username=user.Username, Password=user.Password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    for i in user.Utensils:
        db_utensil = models.Utensils(Uid=db_user.id, Utensil=i.Utensil)
        db.add(db_utensil)
    db.commit()
