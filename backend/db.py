from werkzeug.security import generate_password_hash
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
import os

database = SQLAlchemy()

def seed_admins():
    env_vars = os.environ

    username_keys = [key for key in env_vars if key.startswith("USERNAME-")]

    for username_key in username_keys:
        suffix = username_key.split("USERNAME-")[1]
        password_key = f"PASSWORD-{suffix}"

        username = env_vars.get(username_key)
        password = env_vars.get(password_key)

        if not username or not password:
            continue

        existing_user = User.query.filter_by(username=username).first()

        if not existing_user:
            print(f"Creating admin: {username}")

            new_admin = User(
                username=username,
                password=generate_password_hash(password),
                is_admin=True
            )
            database.session.add(new_admin)

    database.session.commit()

# Models:

class Washer(database.Model):
    id = database.Column(database.Integer, primary_key=True)
    name = database.Column(database.String(200), nullable=False)
    admin_id = database.Column(
        database.Integer,
        database.ForeignKey("user.id"),
        nullable=False,
        unique=True
    )

class User(UserMixin, database.Model):
    id = database.Column(database.Integer, primary_key=True)
    username = database.Column(database.String(100), unique=True, nullable=False)
    password = database.Column(database.String(200), nullable=False)
    is_admin = database.Column(database.Boolean, default=False)
    washer = database.relationship(
        "Washer",
        backref="admin",
        uselist=False,
        cascade="all, delete"
    )