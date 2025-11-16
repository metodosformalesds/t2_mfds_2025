"""add profile_image_url to users

Revision ID: add_profile_image
Revises: 064209575e5d
Create Date: 2025-11-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_profile_image'
down_revision: Union[str, None] = '064209575e5d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Agregar columna profile_image_url a la tabla users
    op.add_column('users', sa.Column('profile_image_url', sa.String(length=500), nullable=True, comment='URL de la imagen de perfil del usuario en S3'))


def downgrade() -> None:
    # Eliminar columna profile_image_url
    op.drop_column('users', 'profile_image_url')
