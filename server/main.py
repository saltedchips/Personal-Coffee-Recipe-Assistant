from http.client import HTTPException, IncompleteRead

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
    Title: str
    Utensils: List[UtensilsBase]
    Recipie: str

class CommentsBase(BaseModel):
    Comment: str
    Rating: int

class IngredientBase(BaseModel):
    Type: str
    Amount: float

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
    "https://localhost:5432/coffeeapp"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins = origins,
    allow_credentials = True,
    allow_methods = ["*"],
    allow_headers = ["*"],
)

# Show all Users in the database
@app.get("/users")
async def show_users(db: db_dependency, limit: int = 20):
    result = db.query(models.User).filter(models.User.id <= limit).all()
    if not result:
        raise HTTPException(status_code=404, detail="No users found.")
    return result

# Show all recipies
@app.get("/recipies")
async def show_recipies(db: db_dependency, limit: int = 20):
    result = db.query(models.Recipie).filter(models.Recipie.id <= limit).all()
    if not result:
        raise HTTPException(status_code=404, detail="No users found.")
    return result

# Create User with Utensils
@app.post("/users")
async def create_user(user: UserBase, db:db_dependency):
    db_user = models.User(username=user.Username, password=user.Password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    for i in user.Utensils:
        db_utensil = models.Utensils(uid=db_user.id, utensil=i.Utensil)
        db.add(db_utensil)
    db.commit()

# Create new recipie with current user
@app.post("/recipies")
async def create_recipie(recipie: RecipeBase, user: UserBase, db: db_dependency):
    db_user = db.query(models.User).filter(models.User.username == user.Username and models.User.password == user.Password).first()

    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_recipie = models.Recipie(uid=db_user.id, recipie=recipie.Recipie)
    db.add(db_recipie)
    db.commit()
    db.refresh(db_recipie)
    for i in recipie.Utensils:
        db_utensil = models.Utensils(uid=db_user.id, rid=db_recipie.id, utensil=i.Utensil)
        db.add(db_utensil)
    db.commit()

# Show information for single recipie
@app.get("/recipie")
async def show_recipie(comment: CommentsBase, user: UserBase, recipie: RecipeBase, db: db_dependency):
    db_user = db.query(models.User).filter(models.User.username == user.Username and models.User.password == user.Password).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_recipie = db.query(models.Recipie).filter(models.Recipie.title == recipie.Title).first()
    if not db_recipie:
        raise HTTPException(status_code=404, detail="Recipie not found")

    db_author = db.query(models.User).filter(models.User.id == db_recipie.uid).first()
    if not db_author:
        raise HTTPException(status_code=404, detail="User not found")

    db_comments = db.query(models.Recipie).filter(models.Comment.rid == db_recipie.id).all()
    if not db_comments:
        raise HTTPException(status_code=404, detail="Comments not found")

    return db_recipie, db_comments, db_author

# create comment on recipie
@app.post("/comments/")
async def create_comment(comment: CommentsBase, user: UserBase, recipie: RecipeBase, db: db_dependency):
    db_user = db.query(models.User).filter(models.User.username == user.Username and models.User.password == user.Password).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    db_recipie = db.query(models.Recipie).filter(models.Recipie.title == recipie.Title).first()
    if not db_recipie:
        raise HTTPException(status_code=404, detail="Recipie not found")

    db_comment = models.Comment(comment=comment.Comment, rating=comment.Rating, uid=db_user.id, rid=db_recipie.id)
    db.add(db_comment)
    db.commit()
    db.refresh(db_recipie)
