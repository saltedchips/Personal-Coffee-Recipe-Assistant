from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float
from database import Base


class Utensils(Base):
    __tablename__ = 'utensils'

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(Integer, ForeignKey("user.id"), nullable=True)
    rid = Column(Integer, ForeignKey("recipie.id"), nullable=True)
    utensil = Column(String, index=True)

class User(Base):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, index=True)
    password = Column(String, index=True)


class Recipie(Base):
    __tablename__ = 'recipie'

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(Integer, ForeignKey("user.id"))
    title = Column(String, index=True)
    recipie = Column(String, index=True)

class Comment(Base):
    __tablename__ = 'comments'

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(Integer, ForeignKey("user.id"), nullable=False)
    rid = Column(Integer, ForeignKey("recipie.id"), nullable=False)

    comment = Column(String, index=True)
    rating = Column(Integer, index=True)

class Ingredient(Base):
    __tablename__ = 'ingredients'

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, index=True)
    amount = Column(Float, index=True)