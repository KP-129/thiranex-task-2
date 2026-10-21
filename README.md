# Divya — personal portfolio

A polished, responsive portfolio with an HTML/CSS/JavaScript frontend, a Flask API, and SQLAlchemy project storage. It uses SQLite locally for a zero-setup start and PostgreSQL when `DATABASE_URL` is configured, including on a hosted deployment.

## Run locally on Windows

Requires Python 3.10 or newer.

```powershell
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python server.py
```

Open [http://localhost:8000](http://localhost:8000). The app creates the database tables and adds four sample projects on first start. By default it creates `portfolio.db` with SQLite. Add a PostgreSQL `DATABASE_URL` environment variable to use PostgreSQL locally or in production.

If PowerShell blocks virtual environment activation, run the app directly with `\.venv\Scripts\python.exe server.py` after installing the requirements in that environment.

## API

- `GET /api/projects` lists portfolio projects.
- `POST /api/projects` adds a project. Required JSON fields: `title`, `category`, `description`, `year`. Optional fields: `color`, `icon`, `link`, `featured`.
- `GET /api/health` checks the database connection and reports the active database type.

Example request:

```powershell
curl.exe -X POST http://localhost:8000/api/projects -H "Content-Type: application/json" -d '{"title":"My project","category":"Web design","description":"A project description.","year":"2026"}'
```

Set `PROJECTS_API_TOKEN` in the environment to require an `X-API-Key` header for project creation. Use a unique secret for a public deployment.

## Personalize

Update the sample name, biography, email address, social links, and skills in `index.html`. Replace the sample project rows in `server.py` with your portfolio content, or add projects through the API. Keep credentials in environment variables; do not commit `.env` files or database files.

## Deploy

The included `Procfile` starts the Flask app with Gunicorn, and `requirements.txt` lists its dependencies. For a Python host such as Heroku, connect the GitHub repository, provision a PostgreSQL database, and configure `DATABASE_URL` and `PROJECTS_API_TOKEN` as app environment variables. The host provides `PORT` automatically. After deployment, check `/api/health` to confirm the app can reach PostgreSQL.

The app code is deployment-ready, but it is not live yet. Creating the hosted app and database requires access to your hosting account.
