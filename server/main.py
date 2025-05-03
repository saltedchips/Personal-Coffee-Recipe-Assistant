# server/main.py

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from sqlalchemy.orm import Session

import models
from database import SessionLocal

app = FastAPI(title="Personal Coffee Recipe Assistant API")

# CORS so Next.js (localhost:3000) can call
origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Schemas ---

class UserCreate(BaseModel):
    Username: str
    Password: str
    Utensils: List[str] = []

class UserLogin(BaseModel):
    Username: str
    Password: str

class EquipmentOut(BaseModel):
    equipment: List[str]

class EquipmentIn(BaseModel):
    Utensils: List[str]

class RecipeCreate(BaseModel):
    Title: str
    Description: str = ""  # Add description field
    Utensils: List[Dict[str, str]]  # [{ "Utensil": "French Press" }]
    Recipie: str                    # newline-separated instructions
    Ingredients: List[str] = []     # List of ingredients

class RecipeDetailOut(BaseModel):
    id: int
    title: str
    description: str
    equipment: List[str]
    ingredients: List[str]
    instructions: List[str]
    userRating: int
    userNotes: List[str]
    isMasterRecipe: bool

class RecipesOut(BaseModel):
    recipes: List[RecipeDetailOut]

class RecipeUpdate(BaseModel):
    Title: str
    Description: str = ""  # Add description field
    Utensils: List[Dict[str, str]]
    Recipie: str
    Ingredients: List[str] = []

class RatingIn(BaseModel):
    rating: int

class NoteIn(BaseModel):
    note: str


# --- Auth ----------

# Add admin check function
def check_admin(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(username=username).first()
    if not user or user.role != "admin":
        raise HTTPException(403, "Admin access required")
    return user

@app.post("/users", status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    # Check if username already exists
    existing_user = db.query(models.User).filter_by(username=payload.Username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Create user with role="user" by default
    user = models.User(
        username=payload.Username,
        hashed_password=payload.Password,
        role="user"  # All new users are regular users
    )
    db.add(user); db.flush()
    for u in payload.Utensils:
        db.add(models.UserUtensil(user_id=user.id, utensil=u))
    db.commit()
    return {"status": "ok"}

@app.post("/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(username=payload.Username).first()
    if not user or user.hashed_password != payload.Password:
        raise HTTPException(400, "Invalid credentials")
    return {"status": "ok"}


# --- Equipment ------

# Predefined list of all possible equipment options
ALL_EQUIPMENT = [
    "French Press",
    "Pour-over",
    "Espresso Machine",
    "Cold Brew"
]

@app.get("/equipment", response_model=EquipmentOut)
def get_all_equipment(db: Session = Depends(get_db)):
    # Return all predefined equipment options
    return {"equipment": ALL_EQUIPMENT}

@app.get("/users/{username}/equipment", response_model=EquipmentOut)
def get_equipment(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(username=username).first()
    if not user:
        raise HTTPException(404, "User not found")
    tools = [u.utensil for u in db.query(models.UserUtensil).filter_by(user_id=user.id)]
    return {"equipment": tools}

@app.put("/users/{username}/equipment", response_model=EquipmentOut)
def update_equipment(username: str, payload: EquipmentIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(username=username).first()
    if not user:
        raise HTTPException(404, "User not found")
    db.query(models.UserUtensil).filter_by(user_id=user.id).delete()
    for u in payload.Utensils:
        db.add(models.UserUtensil(user_id=user.id, utensil=u))
    db.commit()
    return {"equipment": payload.Utensils}


# --- Recipes -------

@app.get("/recipies", response_model=RecipesOut)
def list_recipes(equipment: List[str] = Query(...), db: Session = Depends(get_db)):
    raw = (
        db.query(models.Recipe)
          .join(models.RecipeUtensil)
          .filter(models.RecipeUtensil.utensil.in_(equipment))
          .all()
    )
    out: List[RecipeDetailOut] = []
    for r in raw:
        ratings = [rt.rating for rt in r.ratings]
        notes   = [nt.content for nt in r.notes]
        avg     = int(sum(ratings) / len(ratings)) if ratings else 0

        out.append(
            RecipeDetailOut(
                id=r.id,
                title=r.title,
                description=r.description or "",
                equipment=[ru.utensil for ru in r.utensils],
                ingredients=[ing.text for ing in r.ingredients],
                instructions=[inst.step for inst in r.instructions],
                userRating=avg,
                userNotes=notes,
                isMasterRecipe=r.is_master_recipe,
            )
        )
    return {"recipes": out}

@app.get("/recipie/{id}", response_model=RecipeDetailOut)
def get_recipe(id: int, db: Session = Depends(get_db)):
    r = db.query(models.Recipe).get(id)
    if not r:
        raise HTTPException(404, "Recipe not found")
    ratings = [rt.rating for rt in r.ratings]
    notes   = [nt.content for nt in r.notes]
    avg     = int(sum(ratings) / len(ratings)) if ratings else 0

    return RecipeDetailOut(
        id=r.id,
        title=r.title,
        description=r.description or "",
        equipment=[ru.utensil for ru in r.utensils],
        ingredients=[ing.text for ing in r.ingredients],
        instructions=[inst.step for inst in r.instructions],
        userRating=avg,
        userNotes=notes,
        isMasterRecipe=r.is_master_recipe,
    )

@app.post("/recipies", status_code=201)
def create_recipe(payload: RecipeCreate, db: Session = Depends(get_db)):
    r = models.Recipe(title=payload.Title, description=payload.Description)
    db.add(r); db.flush()
    for u in payload.Utensils:
        db.add(models.RecipeUtensil(recipe_id=r.id, utensil=u["Utensil"]))
    for step in payload.Recipie.split("\n"):
        db.add(models.RecipeInstruction(recipe_id=r.id, step=step))
    for ingredient in payload.Ingredients:
        db.add(models.RecipeIngredient(recipe_id=r.id, text=ingredient))
    db.commit()
    return {"id": r.id}

@app.put("/recipies/{id}")
def update_recipe(id: int, payload: RecipeUpdate, username: str = Query(...), db: Session = Depends(get_db)):
    r = db.query(models.Recipe).get(id)
    if not r:
        raise HTTPException(404, "Recipe not found")
    
    # Check if trying to edit a master recipe
    if r.is_master_recipe:
        raise HTTPException(403, "Cannot edit master recipes directly. Please create a personal copy first.")
    
    r.title = payload.Title
    r.description = payload.Description
    db.query(models.RecipeUtensil).filter_by(recipe_id=id).delete()
    for u in payload.Utensils:
        db.add(models.RecipeUtensil(recipe_id=id, utensil=u["Utensil"]))
    db.query(models.RecipeInstruction).filter_by(recipe_id=id).delete()
    for step in payload.Recipie.split("\n"):
        db.add(models.RecipeInstruction(recipe_id=id, step=step))
    db.query(models.RecipeIngredient).filter_by(recipe_id=id).delete()
    for ingredient in payload.Ingredients:
        db.add(models.RecipeIngredient(recipe_id=id, text=ingredient))
    db.commit()
    return {"status": "ok"}


# --- Ratings & Notes ---

@app.post("/recipies/{id}/rating")
def save_rating(id: int, payload: RatingIn, db: Session = Depends(get_db)):
    db.add(models.Rating(recipe_id=id, rating=payload.rating))
    db.commit()
    return {"status": "ok"}

@app.post("/recipies/{id}/notes")
def add_note(id: int, payload: NoteIn, db: Session = Depends(get_db)):
    db.add(models.Note(recipe_id=id, content=payload.note))
    db.commit()
    return {"status": "ok"}

@app.delete("/recipies/{id}/notes/{note_index}")
def delete_note(id: int, note_index: int, db: Session = Depends(get_db)):
    notes = db.query(models.Note).filter_by(recipe_id=id).all()
    if note_index < 0 or note_index >= len(notes):
        raise HTTPException(404, "Note not found")
    db.delete(notes[note_index])
    db.commit()
    return {"status": "ok"}

@app.post("/recipies/{id}/clone")
def clone_recipe(id: int, db: Session = Depends(get_db)):
    # Get the original recipe
    original = db.query(models.Recipe).get(id)
    if not original:
        raise HTTPException(404, "Recipe not found")

    # Create a new recipe as a personal copy
    r = models.Recipe(
        title=original.title,
        description=original.description,
        is_master_recipe=0  # Set as personal recipe
    )
    db.add(r); db.flush()

    # Copy utensils
    for u in original.utensils:
        db.add(models.RecipeUtensil(recipe_id=r.id, utensil=u.utensil))

    # Copy ingredients
    for i in original.ingredients:
        db.add(models.RecipeIngredient(recipe_id=r.id, text=i.text))

    # Copy instructions
    for inst in original.instructions:
        db.add(models.RecipeInstruction(recipe_id=r.id, step=inst.step))

    db.commit()
    return {"id": r.id}


# --- Admin ---------

@app.get("/admin/recipes", response_model=RecipesOut)
def admin_list(username: str = Query(...), db: Session = Depends(get_db)):
    check_admin(username, db)  # Check if user is admin
    raw = db.query(models.Recipe).all()
    out: List[RecipeDetailOut] = []
    for r in raw:
        ratings = [rt.rating for rt in r.ratings]
        notes   = [nt.content for nt in r.notes]
        avg     = int(sum(ratings) / len(ratings)) if ratings else 0

        out.append(
            RecipeDetailOut(
                id=r.id,
                title=r.title,
                description=r.description or "",
                equipment=[ru.utensil for ru in r.utensils],
                ingredients=[ing.text for ing in r.ingredients],
                instructions=[inst.step for inst in r.instructions],
                userRating=avg,
                userNotes=notes,
                isMasterRecipe=r.is_master_recipe,
            )
        )
    return {"recipes": out}

@app.post("/admin/recipes", status_code=201)
def admin_create(payload: RecipeCreate, username: str = Query(...), db: Session = Depends(get_db)):
    check_admin(username, db)  # Check if user is admin
    r = models.Recipe(
        title=payload.Title,
        description=payload.Description,
        is_master_recipe=1  # Set as master recipe
    )
    db.add(r); db.flush()
    for u in payload.Utensils:
        db.add(models.RecipeUtensil(recipe_id=r.id, utensil=u["Utensil"]))
    for step in payload.Recipie.split("\n"):
        db.add(models.RecipeInstruction(recipe_id=r.id, step=step))
    for ingredient in payload.Ingredients:
        db.add(models.RecipeIngredient(recipe_id=r.id, text=ingredient))
    db.commit()
    return {"id": r.id}

@app.put("/admin/recipes/{id}")
def admin_update(id: int, payload: RecipeUpdate, username: str = Query(...), db: Session = Depends(get_db)):
    check_admin(username, db)  # Check if user is admin
    r = db.query(models.Recipe).get(id)
    if not r:
        raise HTTPException(404, "Recipe not found")
    r.title = payload.Title
    r.description = payload.Description
    r.is_master_recipe = 1  # Ensure it remains a master recipe
    db.query(models.RecipeUtensil).filter_by(recipe_id=r.id).delete()
    for u in payload.Utensils:
        db.add(models.RecipeUtensil(recipe_id=r.id, utensil=u["Utensil"]))
    db.query(models.RecipeInstruction).filter_by(recipe_id=r.id).delete()
    for step in payload.Recipie.split("\n"):
        db.add(models.RecipeInstruction(recipe_id=r.id, step=step))
    db.query(models.RecipeIngredient).filter_by(recipe_id=r.id).delete()
    for ingredient in payload.Ingredients:
        db.add(models.RecipeIngredient(recipe_id=r.id, text=ingredient))
    db.commit()
    return {"status": "ok"}

@app.delete("/admin/recipes/{id}")
def admin_delete(id: int, username: str = Query(...), db: Session = Depends(get_db)):
    check_admin(username, db)  # Check if user is admin
    r = db.query(models.Recipe).get(id)
    if not r:
        raise HTTPException(404, "Recipe not found")
    db.delete(r); db.commit()
    return {"status": "ok"}
