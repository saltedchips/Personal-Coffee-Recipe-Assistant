# server/models.py

from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship, declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String, unique=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role            = Column(String, nullable=False, default="user")  # "user" or "admin"

    # relationship back to recipes
    recipes         = relationship("Recipe", back_populates="owner")

    # user's chosen utensils
    utensils = relationship(
        "UserUtensil",
        back_populates="user",
        cascade="all, delete-orphan",
    )

class UserUtensil(Base):
    __tablename__ = "user_utensils"

    id       = Column(Integer, primary_key=True, index=True)
    user_id  = Column(Integer, ForeignKey("users.id"), nullable=False)
    utensil  = Column(String, nullable=False)

    user     = relationship("User", back_populates="utensils")

class Recipe(Base):
    __tablename__ = "recipes"

    id               = Column(Integer, primary_key=True, index=True)
    title            = Column(String, nullable=False)
    description      = Column(Text, default="")
    is_master_recipe = Column(Integer, default=0)  # 0 = personal, 1 = master

    # NEW: bind each recipe to its creator
    user_id          = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner            = relationship("User", back_populates="recipes")

    utensils     = relationship(
        "RecipeUtensil",
        back_populates="recipe",
        cascade="all, delete-orphan",
    )
    ingredients  = relationship(
        "RecipeIngredient",
        back_populates="recipe",
        cascade="all, delete-orphan",
    )
    instructions = relationship(
        "RecipeInstruction",
        back_populates="recipe",
        cascade="all, delete-orphan",
    )
    ratings      = relationship(
        "Rating",
        back_populates="recipe",
        cascade="all, delete-orphan",
    )
    notes        = relationship(
        "Note",
        back_populates="recipe",
        cascade="all, delete-orphan",
    )

class RecipeUtensil(Base):
    __tablename__ = "recipe_utensils"

    id        = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    utensil   = Column(String, nullable=False)

    recipe    = relationship("Recipe", back_populates="utensils")

class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id        = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    text      = Column(String, nullable=False)

    recipe    = relationship("Recipe", back_populates="ingredients")

class RecipeInstruction(Base):
    __tablename__ = "recipe_instructions"

    id        = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    step      = Column(Text, nullable=False)

    recipe    = relationship("Recipe", back_populates="instructions")

class Rating(Base):
    __tablename__ = "ratings"

    id        = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    user_id   = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating    = Column(Integer, nullable=False)

    recipe    = relationship("Recipe", back_populates="ratings")
    user      = relationship("User")

class Note(Base):
    __tablename__ = "notes"

    id        = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"), nullable=False)
    content   = Column(Text, nullable=False)

    recipe    = relationship("Recipe", back_populates="notes")
