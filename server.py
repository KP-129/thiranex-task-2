"""Flask portfolio app with PostgreSQL support and a local SQLite fallback."""
import os
import hmac
from pathlib import Path

from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import text

ROOT = Path(__file__).resolve().parent
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{ROOT / 'portfolio.db'}")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

app = Flask(__name__, static_folder=None)
app.config.update(
    SQLALCHEMY_DATABASE_URI=DATABASE_URL,
    SQLALCHEMY_TRACK_MODIFICATIONS=False,
    MAX_CONTENT_LENGTH=16 * 1024,
)
if DATABASE_URL.startswith("sqlite:"):
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"connect_args": {"check_same_thread": False}}
else:
    app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {"pool_pre_ping": True, "pool_recycle": 300}

db = SQLAlchemy(app)


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(160), nullable=False)
    category = db.Column(db.String(120), nullable=False)
    description = db.Column(db.Text, nullable=False)
    year = db.Column(db.String(12), nullable=False)
    color = db.Column(db.String(16), nullable=False, default="#e8e0d2")
    icon = db.Column(db.String(16), nullable=False, default="✳")
    link = db.Column(db.String(2048), nullable=False, default="#")
    featured = db.Column(db.Boolean, nullable=False, default=False)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "category": self.category,
            "description": self.description,
            "year": self.year,
            "color": self.color,
            "icon": self.icon,
            "link": self.link,
            "featured": self.featured,
        }


SAMPLE_PROJECTS = [
    {"title": "Forma Studio", "category": "Product design", "description": "A thoughtful identity and digital home for a new kind of creative studio.", "year": "2025", "color": "#f3c6a5", "icon": "◒", "featured": True},
    {"title": "Daily Rituals", "category": "Mobile · Wellness", "description": "A calmer habit tracker designed to make small, good things stick.", "year": "2025", "color": "#c4ddca", "icon": "✳", "featured": True},
    {"title": "Fieldnotes", "category": "E-commerce", "description": "An editorial storefront for objects made slowly and meant to last.", "year": "2024", "color": "#f1d58e", "icon": "↗", "featured": False},
    {"title": "Open Table", "category": "Community · Web", "description": "Making it easier for neighbors to find a seat and get to know each other.", "year": "2024", "color": "#c9c9eb", "icon": "⌘", "featured": False},
]


def initialize_database():
    with app.app_context():
        db.create_all()
        if db.session.query(Project.id).first() is None:
            db.session.add_all(Project(**project) for project in SAMPLE_PROJECTS)
            db.session.commit()


@app.get("/")
def home():
    return send_from_directory(ROOT, "index.html")


@app.get("/<path:asset>")
def frontend_assets(asset):
    if asset not in {"styles.css", "app.js"}:
        return jsonify({"error": "Not found"}), 404
    return send_from_directory(ROOT, asset)


@app.get("/api/projects")
def list_projects():
    projects = Project.query.order_by(Project.featured.desc(), Project.id.desc()).all()
    return jsonify([project.to_dict() for project in projects])


@app.post("/api/projects")
def create_project():
    expected_token = os.environ.get("PROJECTS_API_TOKEN")
    if expected_token and not hmac.compare_digest(
        request.headers.get("X-API-Key", ""), expected_token
    ):
        return jsonify({"error": "A valid API key is required to add projects."}), 401

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Send a JSON object."}), 400

    required = ("title", "category", "description", "year")
    values = {key: str(data.get(key, "")).strip() for key in required}
    if any(not values[key] for key in required):
        return jsonify({"error": "Title, category, description and year are required."}), 400

    values.update({
        "color": str(data.get("color") or "#e8e0d2").strip(),
        "icon": str(data.get("icon") or "✳").strip(),
        "link": str(data.get("link") or "#").strip(),
        "featured": bool(data.get("featured", False)),
    })
    project = Project(**values)
    db.session.add(project)
    db.session.commit()
    return jsonify(project.to_dict()), 201


@app.get("/api/health")
def health():
    try:
        db.session.execute(text("SELECT 1"))
        database = "postgresql" if not DATABASE_URL.startswith("sqlite:") else "sqlite"
        return jsonify({"ok": True, "database": database})
    except Exception:
        app.logger.exception("Database health check failed")
        return jsonify({"ok": False, "database": "unavailable"}), 503


initialize_database()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "8000")), debug=False)
