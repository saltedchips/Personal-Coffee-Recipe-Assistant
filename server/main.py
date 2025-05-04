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
    Description: str = ""
    Utensils: List[Dict[str, str]]
    Recipie: str
    Ingredients: List[str] = []

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
    Description: str = ""
    Utensils: List[Dict[str, str]]
    Recipie: str
    Ingredients: List[str] = []

class RatingIn(BaseModel):
    rating: int

class NoteIn(BaseModel):
    note: str

class UserRoleOut(BaseModel):
    role: str


# --- Auth ----------

def check_admin(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(username=username).first()
    if not user or user.role != "admin":
        raise HTTPException(403, "Admin access required")
    return user

@app.post("/users", status_code=201)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter_by(username=payload.Username).first()
    if existing_user:
        raise HTTPException(400, "Username already exists")
    user = models.User(
        username=payload.Username,
        hashed_password=payload.Password,
        role="user",
    )
    db.add(user)
    db.flush()
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

ALL_EQUIPMENT = [
    "French Press",
    "Pour-over",
    "Espresso Machine",
    "Cold Brew"
]

@app.get("/equipment", response_model=EquipmentOut)
def get_all_equipment():
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


# --- Master Recipes (public defaults) ---

@app.get("/master/recipies", response_model=List[RecipeDetailOut])
async def get_master_recipes(
    username: str = Query(...),
    equipment: List[str] = Query(None), 
    db: Session = Depends(get_db)
):
    try:
        print("Fetching master recipes...")
        print("Database session:", db)
        
        # First check if the Recipe model exists
        try:
            recipe_count = db.query(models.Recipe).count()
            print(f"Total recipes in database: {recipe_count}")
        except Exception as e:
            print(f"Error counting recipes: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )

        # Get user
        user = db.query(models.User).filter_by(username=username).first()
        if not user:
            raise HTTPException(404, "User not found")

        # Get all master recipes with error handling
        try:
            recipes = db.query(models.Recipe).filter(models.Recipe.is_master_recipe == 1).all()
            print(f"Found {len(recipes)} master recipes")
        except Exception as e:
            print(f"Error querying master recipes: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Error querying master recipes: {str(e)}"
            )
        
        if not recipes:
            print("No master recipes found")
            return []
            
        # Filter recipes based on equipment
        if equipment:
            print(f"Filtering recipes by equipment: {equipment}")
            filtered_recipes = []
            for recipe in recipes:
                try:
                    # Check if recipe has utensils relationship
                    if not hasattr(recipe, 'utensils'):
                        print(f"Recipe {recipe.id} has no utensils relationship")
                        continue
                        
                    recipe_equipment = [ru.utensil for ru in recipe.utensils]
                    print(f"Recipe {recipe.id} equipment: {recipe_equipment}")
                    
                    if any(e in recipe_equipment for e in equipment):
                        # Get only this user's rating
                        user_rating = db.query(models.Rating).filter_by(recipe_id=recipe.id, user_id=user.id).first()
                        rating = user_rating.rating if user_rating else 0
                        notes = [nt.content for nt in recipe.notes] if hasattr(recipe, 'notes') else []
                        
                        filtered_recipes.append(
                            RecipeDetailOut(
                                id=recipe.id,
                                title=recipe.title,
                                description=recipe.description or "",
                                equipment=recipe_equipment,
                                ingredients=[ing.text for ing in recipe.ingredients] if hasattr(recipe, 'ingredients') else [],
                                instructions=[inst.step for inst in recipe.instructions] if hasattr(recipe, 'instructions') else [],
                                userRating=rating,
                                userNotes=notes,
                                isMasterRecipe=True
                            )
                        )
                except Exception as e:
                    print(f"Error processing recipe {recipe.id}: {str(e)}")
                    continue
            print(f"Returning {len(filtered_recipes)} filtered recipes")
            return filtered_recipes
            
        # If no equipment filter, return all master recipes
        print("No equipment filter, returning all master recipes")
        result = []
        for recipe in recipes:
            try:
                # Get only this user's rating
                user_rating = db.query(models.Rating).filter_by(recipe_id=recipe.id, user_id=user.id).first()
                rating = user_rating.rating if user_rating else 0
                notes = [nt.content for nt in recipe.notes] if hasattr(recipe, 'notes') else []
                
                result.append(
                    RecipeDetailOut(
                        id=recipe.id,
                        title=recipe.title,
                        description=recipe.description or "",
                        equipment=[ru.utensil for ru in recipe.utensils] if hasattr(recipe, 'utensils') else [],
                        ingredients=[ing.text for ing in recipe.ingredients] if hasattr(recipe, 'ingredients') else [],
                        instructions=[inst.step for inst in recipe.instructions] if hasattr(recipe, 'instructions') else [],
                        userRating=rating,
                        userNotes=notes,
                        isMasterRecipe=True
                    )
                )
            except Exception as e:
                print(f"Error processing recipe {recipe.id}: {str(e)}")
                continue
        print(f"Returning {len(result)} recipes")
        return result
    except Exception as e:
        print(f"Error in get_master_recipes: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching master recipes: {str(e)}"
        )


# --- Recipes (user-scoped) -------

@app.get("/recipies", response_model=RecipesOut)
def list_recipes(
    username: str = Query(...),
    equipment: List[str] = Query(None),
    db: Session = Depends(get_db),
):
    try:
        print(f"Fetching personal recipes for user: {username}")
        
        user = db.query(models.User).filter_by(username=username).first()
        if not user:
            raise HTTPException(404, "User not found")
        print(f"Found user with ID: {user.id}")

        # Get personal recipes for this user
        raw = (
            db.query(models.Recipe)
              .filter(
                  models.Recipe.is_master_recipe == 0,  # Only personal recipes
                  models.Recipe.user_id == user.id,     # Only this user's recipes
              )
              .all()
        )
        print(f"Found {len(raw)} personal recipes for user")

        # Filter by equipment if provided
        if equipment:
            print(f"Filtering recipes by equipment: {equipment}")
            filtered = []
            for r in raw:
                try:
                    recipe_equipment = [ru.utensil for ru in r.utensils] if hasattr(r, 'utensils') else []
                    print(f"Recipe {r.id} equipment: {recipe_equipment}")
                    if any(e in recipe_equipment for e in equipment):
                        filtered.append(r)
                except Exception as e:
                    print(f"Error checking equipment for recipe {r.id}: {str(e)}")
                    continue
            raw = filtered
            print(f"After equipment filter: {len(raw)} recipes")

        out: List[RecipeDetailOut] = []
        for r in raw:
            try:
                # Get only this user's rating
                user_rating = db.query(models.Rating).filter_by(recipe_id=r.id, user_id=user.id).first()
                rating = user_rating.rating if user_rating else 0
                notes = [nt.content for nt in r.notes] if hasattr(r, 'notes') else []

                recipe_equipment = [ru.utensil for ru in r.utensils] if hasattr(r, 'utensils') else []
                print(f"Processing recipe {r.id} with equipment: {recipe_equipment}")

                out.append(
                    RecipeDetailOut(
                        id=r.id,
                        title=r.title,
                        description=r.description or "",
                        equipment=recipe_equipment,
                        ingredients=[ing.text for ing in r.ingredients] if hasattr(r, 'ingredients') else [],
                        instructions=[inst.step for inst in r.instructions] if hasattr(r, 'instructions') else [],
                        userRating=rating,
                        userNotes=notes,
                        isMasterRecipe=False
                    )
                )
            except Exception as e:
                print(f"Error processing recipe {r.id}: {str(e)}")
                continue

        print(f"Returning {len(out)} recipes")
        return {"recipes": out}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in list_recipes: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching recipes: {str(e)}"
        )


@app.get("/recipie/{id}", response_model=RecipeDetailOut)
def get_recipe(
    id: int,
    username: str = Query(...),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter_by(username=username).first()
    if not user:
        raise HTTPException(404, "User not found")

    r = db.query(models.Recipe).get(id)
    if not r:
        raise HTTPException(404, "Recipe not found")
    # allow viewing master or your own
    if r.is_master_recipe == 0 and r.user_id != user.id:
        raise HTTPException(403, "Not your recipe")

    # Get only this user's rating
    user_rating = db.query(models.Rating).filter_by(recipe_id=id, user_id=user.id).first()
    rating = user_rating.rating if user_rating else 0
    notes = [nt.content for nt in r.notes]

    return RecipeDetailOut(
        id=r.id,
        title=r.title,
        description=r.description or "",
        equipment=[ru.utensil for ru in r.utensils],
        ingredients=[ing.text for ing in r.ingredients],
        instructions=[inst.step for inst in r.instructions],
        userRating=rating,
        userNotes=notes,
        isMasterRecipe=bool(r.is_master_recipe),
    )


@app.post("/recipies", status_code=201)
def create_recipe(
    payload: RecipeCreate,
    username: str = Query(...),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter_by(username=username).first()
    if not user:
        raise HTTPException(404, "User not found")

    r = models.Recipe(
        title=payload.Title,
        description=payload.Description,
        user_id=user.id,
        is_master_recipe=0,
    )
    db.add(r)
    db.flush()
    for u in payload.Utensils:
        db.add(models.RecipeUtensil(recipe_id=r.id, utensil=u["Utensil"]))
    for step in payload.Recipie.split("\n"):
        db.add(models.RecipeInstruction(recipe_id=r.id, step=step))
    for ingredient in payload.Ingredients:
        db.add(models.RecipeIngredient(recipe_id=r.id, text=ingredient))
    db.commit()
    return {"id": r.id}


@app.put("/recipies/{id}")
def update_recipe(
    id: int,
    payload: RecipeUpdate,
    username: str = Query(...),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter_by(username=username).first()
    if not user:
        raise HTTPException(404, "User not found")

    r = db.query(models.Recipe).get(id)
    if not r:
        raise HTTPException(404, "Recipe not found")
    if r.is_master_recipe:
        raise HTTPException(403, "Cannot edit master recipes directly.")
    if r.user_id != user.id:
        raise HTTPException(403, "Not your recipe")

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


@app.delete("/recipies/{id}")
def delete_recipe(
    id: int,
    username: str = Query(...),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter_by(username=username).first()
    if not user:
        raise HTTPException(404, "User not found")

    r = db.query(models.Recipe).get(id)
    if not r:
        raise HTTPException(404, "Recipe not found")
    if r.is_master_recipe:
        raise HTTPException(403, "Cannot delete master recipes")
    if r.user_id != user.id:
        raise HTTPException(403, "Not your recipe")

    db.query(models.RecipeUtensil).filter_by(recipe_id=id).delete()
    db.query(models.RecipeInstruction).filter_by(recipe_id=id).delete()
    db.query(models.RecipeIngredient).filter_by(recipe_id=id).delete()
    db.query(models.Rating).filter_by(recipe_id=id).delete()
    db.query(models.Note).filter_by(recipe_id=id).delete()

    db.delete(r)
    db.commit()
    return {"status": "ok"}


@app.post("/recipies/{id}/rating")
def save_rating(id: int, payload: RatingIn, username: str = Query(...), db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(username=username).first()
    if not user:
        raise HTTPException(404, "User not found")
        
    # Delete any existing ratings for this recipe by this user
    db.query(models.Rating).filter_by(recipe_id=id, user_id=user.id).delete()
    # Add the new rating
    db.add(models.Rating(recipe_id=id, user_id=user.id, rating=payload.rating))
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


@app.post("/recipies/{id}/clone", status_code=201)
def clone_recipe(
    id: int,
    payload: RecipeUpdate,
    username: str = Query(...),
    db: Session = Depends(get_db),
):
    user = db.query(models.User).filter_by(username=username).first()
    if not user:
        raise HTTPException(404, "User not found")

    original = db.query(models.Recipe).get(id)
    if not original:
        raise HTTPException(404, "Recipe not found")
    if original.is_master_recipe == 0:
        raise HTTPException(403, "Can only clone master recipes")

    r = models.Recipe(
        title=payload.Title,
        description=payload.Description,
        is_master_recipe=0,
        user_id=user.id,
    )
    db.add(r)
    db.flush()

    for u in payload.Utensils:
        db.add(models.RecipeUtensil(recipe_id=r.id, utensil=u["Utensil"]))
    for step in payload.Recipie.split("\n"):
        db.add(models.RecipeInstruction(recipe_id=r.id, step=step))
    for ingredient in payload.Ingredients:
        db.add(models.RecipeIngredient(recipe_id=r.id, text=ingredient))

    db.commit()
    return {"id": r.id}


# --- Admin ---------

@app.get("/admin/recipes", response_model=List[RecipeDetailOut])
async def get_admin_recipes(username: str = Query(...), db: Session = Depends(get_db)):
    try:
        print(f"Fetching admin recipes for user: {username}")
        
        # Verify user exists and is admin
        try:
            user = db.query(models.User).filter_by(username=username).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            if user.role != "admin":
                raise HTTPException(status_code=403, detail="Admin access required")
            print(f"User verified as admin: {username}")
        except Exception as e:
            print(f"Error verifying user: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise
            
        # Get only master recipes
        try:
            recipes = db.query(models.Recipe).filter(models.Recipe.is_master_recipe == 1).all()
            print(f"Found {len(recipes)} master recipes")
        except Exception as e:
            print(f"Error querying recipes: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise HTTPException(
                status_code=500,
                detail=f"Error querying recipes: {str(e)}"
            )
        
        result = []
        for recipe in recipes:
            try:
                # Get recipe details
                ratings = [rt.rating for rt in recipe.ratings] if hasattr(recipe, 'ratings') else []
                notes = [nt.content for nt in recipe.notes] if hasattr(recipe, 'notes') else []
                avg = int(sum(ratings) / len(ratings)) if ratings else 0
                
                result.append(
                    RecipeDetailOut(
                        id=recipe.id,
                        title=recipe.title,
                        description=recipe.description or "",
                        equipment=[ru.utensil for ru in recipe.utensils] if hasattr(recipe, 'utensils') else [],
                        ingredients=[ing.text for ing in recipe.ingredients] if hasattr(recipe, 'ingredients') else [],
                        instructions=[inst.step for inst in recipe.instructions] if hasattr(recipe, 'instructions') else [],
                        userRating=avg,
                        userNotes=notes,
                        isMasterRecipe=True
                    )
                )
            except Exception as e:
                print(f"Error processing recipe {recipe.id}: {str(e)}")
                import traceback
                print(traceback.format_exc())
                continue
                
        print(f"Returning {len(result)} master recipes")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_admin_recipes: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching admin recipes: {str(e)}"
        )

@app.post("/admin/recipes", status_code=201)
def admin_create(payload: RecipeCreate, username: str = Query(...), db: Session = Depends(get_db)):
    try:
        print(f"Creating master recipe for admin user: {username}")
        
        # Verify user exists and is admin
        try:
            user = db.query(models.User).filter_by(username=username).first()
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            if user.role != "admin":
                raise HTTPException(status_code=403, detail="Admin access required")
            print(f"User verified as admin: {username}")
        except Exception as e:
            print(f"Error verifying user: {str(e)}")
            import traceback
            print(traceback.format_exc())
            raise

        # Create the recipe
        try:
            print(f"Creating recipe with title: {payload.Title}")
            r = models.Recipe(
                title=payload.Title,
                description=payload.Description,
                is_master_recipe=1,
                user_id=user.id  # Add user_id for master recipes
            )
            db.add(r)
            db.flush()
            print(f"Created recipe with ID: {r.id}")

            # Add utensils
            print(f"Adding utensils: {payload.Utensils}")
            for u in payload.Utensils:
                db.add(models.RecipeUtensil(recipe_id=r.id, utensil=u["Utensil"]))
            
            # Add instructions
            print(f"Adding instructions from: {payload.Recipie}")
            for step in payload.Recipie.split("\n"):
                db.add(models.RecipeInstruction(recipe_id=r.id, step=step))
            
            # Add ingredients
            print(f"Adding ingredients: {payload.Ingredients}")
            for ingredient in payload.Ingredients:
                db.add(models.RecipeIngredient(recipe_id=r.id, text=ingredient))
            
            db.commit()
            print(f"Successfully created master recipe with ID: {r.id}")
            return {"id": r.id}
            
        except Exception as e:
            print(f"Error creating recipe: {str(e)}")
            import traceback
            print(traceback.format_exc())
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Error creating recipe: {str(e)}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in admin_create: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Error creating master recipe: {str(e)}"
        )

@app.put("/admin/recipes/{id}")
def admin_update(id: int, payload: RecipeUpdate, username: str = Query(...), db: Session = Depends(get_db)):
    check_admin(username, db)
    r = db.query(models.Recipe).get(id)
    if not r:
        raise HTTPException(404, "Recipe not found")
    r.title = payload.Title
    r.description = payload.Description
    r.is_master_recipe = 1
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
    check_admin(username, db)
    r = db.query(models.Recipe).get(id)
    if not r:
        raise HTTPException(404, "Recipe not found")
    db.delete(r)
    db.commit()
    return {"status": "ok"}

@app.get("/users/{username}/role", response_model=UserRoleOut)
def get_user_role(username: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter_by(username=username).first()
    if not user:
        raise HTTPException(404, "User not found")
    return {"role": user.role}
