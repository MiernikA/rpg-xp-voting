"""group image

Revision ID: 202606160011
Revises: 202606160010
Create Date: 2026-06-16 00:11:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202606160011"
down_revision: str | None = "202606160010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("groups", sa.Column("image_url", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("groups", "image_url")
