from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv
from db import database, seed_admins, User
from routes.login_admin import login_api

load_dotenv()

app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///app.db"
app.config["SECRET_KEY"] = "secret"

app.config["JWT_SECRET_KEY"] = "super-secret-jwt-key"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 3600 

database.init_app(app)
CORS(app, origins=["http://localhost:5173"])
jwt = JWTManager(app)

app.register_blueprint(login_api)

@app.route('/')
def hello_world():
    return 'Hello World'


if __name__ == '__main__':
    with app.app_context():
        database.create_all()
        seed_admins()

    app.run(debug=True)