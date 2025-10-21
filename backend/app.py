import os
import time
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
from prometheus_flask_exporter import PrometheusMetrics

# --- Инициализация приложения ---
app = Flask(__name__)
CORS(app)
metrics = PrometheusMetrics(app)

# --- Конфигурация подключения к базе данных из переменных окружения ---
db_host = os.environ.get("DATABASE_HOST")
db_name = os.environ.get("POSTGRES_DB")
db_user = os.environ.get("POSTGRES_USER")
db_password = os.environ.get("POSTGRES_PASSWORD")


# --- Функция для подключения к БД с повторными попытками ---
def get_db_connection():
    while True:
        try:
            conn = psycopg2.connect(
                host=db_host, database=db_name, user=db_user, password=db_password
            )
            return conn
        except psycopg2.OperationalError as e:
            print(f"Ошибка подключения к БД: {e}. Повторная попытка через 5 секунд...")
            time.sleep(5)


# --- Инициализация таблицы в БД при старте приложения ---
def init_db():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS notes (
            id SERIAL PRIMARY KEY,
            title TEXT,
            content TEXT,
            is_favorite BOOLEAN DEFAULT FALSE,
            is_deleted BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    """
    )
    conn.commit()
    cur.close()
    conn.close()
    print("Таблица 'notes' успешно инициализирована.")


# --- ВЫЗЫВАЕМ ИНИЦИАЛИЗАЦИЮ ЗДЕСЬ, ПРИ СТАРТЕ ПРИЛОЖЕНИЯ ---
init_db()

# --- API Эндпоинты ---
# ... (весь ваш код для @app.route остается без изменений) ...


@app.route("/api/notes", methods=["GET"])
def get_notes():
    filter_type = request.args.get("filter", "all")
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    query = (
        "SELECT id, title, content, is_favorite, is_deleted, "
        "updated_at FROM notes WHERE "
    )
    if filter_type == "favorites":
        query += "is_favorite = TRUE AND is_deleted = FALSE"
    elif filter_type == "trash":
        query += "is_deleted = TRUE"
    else:
        query += "is_deleted = FALSE"
    query += " ORDER BY updated_at DESC;"
    cur.execute(query)
    notes = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(notes)


@app.route("/api/notes/<int:note_id>", methods=["GET"])
def get_note_by_id(note_id):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM notes WHERE id = %s;", (note_id,))
    note = cur.fetchone()
    cur.close()
    conn.close()
    return jsonify(note)


@app.route("/api/notes", methods=["POST"])
def create_note():
    data = request.get_json()
    if not data or "title" not in data or not data["title"].strip():
        return jsonify({"error": "Название не может быть пустым"}), 400
    title = data["title"].strip()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT id FROM notes WHERE title = %s AND is_deleted = FALSE;", (title,)
    )
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({"error": "Заметка с таким названием уже существует"}), 409
    cur.execute(
        "INSERT INTO notes (title, content) VALUES (%s, %s) " "RETURNING id;",
        (title, ""),
    )
    new_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "success", "id": new_id}), 201


@app.route("/api/notes/<int:note_id>", methods=["PUT"])
def update_note(note_id):
    data = request.get_json()
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute(
        """UPDATE notes SET
           title = %s, content = %s, is_favorite = %s, is_deleted = %s,
           updated_at = CURRENT_TIMESTAMP
           WHERE id = %s;""",
        (
            data.get("title"),
            data.get("content"),
            data.get("is_favorite", False),
            data.get("is_deleted", False),
            note_id,
        ),
    )
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "success"})


@app.route("/api/notes/<int:note_id>", methods=["DELETE"])
def hard_delete_note(note_id):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM notes WHERE id = %s;", (note_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({"status": "success"}), 200
