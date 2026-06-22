from app.auth.passwords import hash_password
from app.core.config import settings
from app.database.session import SessionLocal
from app.models.user import User, UserRole
from app.repositories.users import UserRepository


def main() -> None:
    with SessionLocal() as db:
        users = UserRepository(db)
        admin = users.by_username(settings.admin_username)
        if admin is None:
            users.add(
                User(
                    username=settings.admin_username,
                    display_name=settings.admin_display_name,
                    password_hash=hash_password(settings.admin_password),
                    role=UserRole.admin,
                    is_active=True,
                )
            )
        else:
            admin.password_hash = hash_password(settings.admin_password)
            admin.role = UserRole.admin
            admin.is_active = True
        db.commit()


if __name__ == "__main__":
    main()
