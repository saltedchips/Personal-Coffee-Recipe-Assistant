from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from database import Base

class User(Base):
    __tablename__ = 'user'

    id = Column(Integer, primary_key=True, index=True)
    UTid = Column(Integer, ForeignKey("Utensils.id"))
    Username = Column(String, index=True)
    Password = Column(String, index=True)


class Recipie(Base):
    __tablename__ = 'recipie'

    id = Column(Integer, primary_key=True, index=True)
    Uid = Column(Integer, ForeignKey("user.id"))
    UTid = Column(Integer, ForeignKey("Utensils.id"))
    Recipie = Column(String, index=True)

class Utensils(Base):
    __tablename__ = 'utensils'

    id = Column(Integer, primary_key=True, index=True)
    Uid = Column(Integer, ForeignKey("user.id"), nullable=True)
    Utensil = Column(String, index=True)
