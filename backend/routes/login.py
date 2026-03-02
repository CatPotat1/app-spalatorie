from flask import Blueprint, jsonify, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token
)
from db import database, User, Washer

login_api = Blueprint("login", __name__, url_prefix="/login")

@login_api.route("/login ", methods=["POST"])
def login(username, password):
    data = request.get_json()

    if not data:
        return jsonify({"error": "No data provided"}), 400

    username = data.get("username")
    password = data.get("password")

    if not username or not password:
        return jsonify({"error": "Missing username or password"}), 400

    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({"error": "Invalid credentials"}), 401

    if user.password != password:
        return jsonify({"error": "Invalid credentials"}), 401

    access_token = create_access_token(identity={
        "id": user.id,
        "username": user.username,
        "is_admin": user.is_admin
    })

    refresh_token = create_refresh_token(identity=user.id)
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user.id,
            "username": user.username,
            "is_admin": user.is_admin,
            "washer": {
                "id": user.washer.id,
                "name": user.washer.name
            } if user.washer else None
        }
    }), 200