"""add user_id to recipes

Revision ID: add_user_id_to_recipes
Revises: 
Create Date: 2024-05-04

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_user_id_to_recipes'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add user_id column to recipes table
    op.add_column('recipes', sa.Column('user_id', sa.Integer(), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_recipes_user_id',
        'recipes', 'users',
        ['user_id'], ['id']
    )
    
    # Set existing recipes to be master recipes
    op.execute("UPDATE recipes SET is_master_recipe = 1 WHERE is_master_recipe IS NULL")
    
    # Make user_id not nullable after setting default values
    op.alter_column('recipes', 'user_id',
               existing_type=sa.Integer(),
               nullable=False)

def downgrade():
    # Remove foreign key constraint
    op.drop_constraint('fk_recipes_user_id', 'recipes', type_='foreignkey')
    
    # Remove user_id column
    op.drop_column('recipes', 'user_id') 