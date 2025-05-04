"""add user_id to recipes

Revision ID: add_user_id_to_recipes
Revises: 38d074a447e0
Create Date: 2024-05-04 13:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_user_id_to_recipes'
down_revision: str = '38d074a447e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add user_id column to recipes table
    op.add_column('recipes', sa.Column('user_id', sa.Integer(), nullable=True))
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_recipes_user_id',
        'recipes', 'users',
        ['user_id'], ['id']
    )
    
    # Make user_id not nullable after adding the constraint
    op.alter_column('recipes', 'user_id',
        existing_type=sa.Integer(),
        nullable=False,
        server_default='1'  # Set default to user ID 1 (admin)
    )


def downgrade() -> None:
    """Downgrade schema."""
    # Remove foreign key constraint
    op.drop_constraint('fk_recipes_user_id', 'recipes', type_='foreignkey')
    
    # Remove user_id column
    op.drop_column('recipes', 'user_id') 