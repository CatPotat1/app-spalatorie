from flask import Flask
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash
import os
from models import db, User

load_dotenv()

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SECRET_KEY"] = "secret"

db.init_app(app)


@app.route('/')
def hello_world():
    return 'Hello World'


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
            db.session.add(new_admin)

    db.session.commit()


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        seed_admins()

    app.run(debug=True)