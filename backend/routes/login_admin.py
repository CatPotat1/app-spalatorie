from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token
)
from db import database, User, Washer

login_api = Blueprint("login_admin", __name__, url_prefix="/admin/auth")

@login_api.route("/login ", methods=["POST"])
def login():
    print("LOGIN")
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


@login_api.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()

    new_access_token = create_access_token(identity=user_id)

    return jsonify({
        "access_token": new_access_token
    }), 200