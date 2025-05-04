"""add user_id to ratings

Revision ID: add_user_id_to_ratings
Revises: 38d074a447e0
Create Date: 2024-03-20 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text


# revision identifiers, used by Alembic.
revision: str = 'add_user_id_to_ratings'
down_revision: Union[str, None] = '38d074a447e0'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add user_id column to ratings table (nullable initially)
    op.add_column('ratings', sa.Column('user_id', sa.Integer(), nullable=True))
    
    # Create foreign key constraint
    op.create_foreign_key(
        'fk_ratings_user_id',
        'ratings', 'users',
        ['user_id'], ['id']
    )
    
    # Get the first admin user's ID to assign to existing ratings
    connection = op.get_bind()
    admin_id = connection.execute(text("SELECT id FROM users WHERE role = 'admin' LIMIT 1")).scalar()
    
    if admin_id:
        # Update existing ratings to use the admin user
        connection.execute(
            text("UPDATE ratings SET user_id = :admin_id WHERE user_id IS NULL"),
            {"admin_id": admin_id}
        )
    else:
        # If no admin user exists, delete existing ratings
        connection.execute(text("DELETE FROM ratings WHERE user_id IS NULL"))
    
    # Now make user_id non-nullable
    op.alter_column('ratings', 'user_id',
               existing_type=sa.Integer(),
               nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_ratings_user_id', 'ratings', type_='foreignkey')
    op.drop_column('ratings', 'user_id') 