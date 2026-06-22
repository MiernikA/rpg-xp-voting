from pathlib import Path
import sys

from alembic import command
from alembic.config import Config

ROOT_DIR = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT_DIR / "backend"

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


def initialize_database() -> None:
    alembic_config = Config(str(BACKEND_DIR / "alembic.ini"))
    alembic_config.set_main_option("script_location", str(BACKEND_DIR / "alembic"))
    command.upgrade(alembic_config, "head")

    from scripts.seed_admin import main as seed_admin

    seed_admin()


initialize_database()

from app.main import app  # noqa: E402
