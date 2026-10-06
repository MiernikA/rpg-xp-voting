"""remove group description

Revision ID: 202610060012
Revises: 202606160011
Create Date: 2026-10-06 00:12:00.000000
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "202610060012"
down_revision: str | None = "202606160011"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_column("groups", "description")


def downgrade() -> None:
    op.add_column("groups", sa.Column("description", sa.Text(), nullable=True))
