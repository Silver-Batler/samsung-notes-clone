import pytest
from app import app, get_db_connection


@pytest.fixture
def client():
    """
    Эта функция ("фикстура") создает специальный тестовый клиент для нашего приложения.
    Она будет вызываться перед каждым тестом, который ее запрашивает.
    """
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


@pytest.fixture(autouse=True)
def clean_database():
    conn = None
    cur = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("TRUNCATE TABLE notes RESTART IDENTITY;")
        conn.commit()
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()

    yield


# --- Unit-тесты (тестируем маленькие, изолированные части) ---


def test_get_notes_success(client):
    """
    Тест №1: Проверяем, что API для получения списка заметок (GET /api/notes)
    отвечает успешным статус-кодом 200 OK.
    """
    # Выполняем GET-запрос к нашему приложению
    response = client.get("/api/notes")
    # Проверяем, что код ответа равен 200
    assert response.status_code == 200
    # Проверяем, что ответ является JSON-массивом (даже если он пустой)
    assert isinstance(response.json, list)


# --- Интеграционные тесты (тестируем взаимодействие нескольких частей) ---


def test_create_and_retrieve_note(client):
    """
    Тест №2: Полноценный сценарий "создал-проверил".
    1. Создаем новую заметку через POST-запрос.
    2. Проверяем, что она действительно появилась в общем списке через GET-запрос.
    """
    # Уникальное название для нашей тестовой заметки
    test_note_title = "My Pytest Note"

    # --- Шаг 1: Создание заметки ---
    create_response = client.post("/api/notes", json={"title": test_note_title})
    # Проверяем, что заметка успешно создалась (код 201 Created)
    assert create_response.status_code == 201
    # Проверяем, что в ответе есть ID новой заметки
    assert "id" in create_response.json

    # --- Шаг 2: Проверка наличия заметки ---
    get_response = client.get("/api/notes")
    all_notes = get_response.json

    # Проверяем, что наша новая заметка присутствует в списке
    # any(...) вернет True, если хотя бы один элемент в списке удовлетворяет условию
    note_found = any(note["title"] == test_note_title for note in all_notes)
    assert note_found, f"Заметка с названием '{test_note_title}' не найдена в списке!"


def test_create_note_with_empty_title_fails(client):
    """
    Тест №3: "Негативный" сценарий.
    Проверяем, что API правильно обрабатывает ошибку и не дает создать заметку
    с пустым названием, возвращая код ошибки 400 Bad Request.
    """
    # Пытаемся создать заметку с пустым названием
    response = client.post(
        "/api/notes", json={"title": "   "}
    )  # Пробелы тоже считаются пустым названием
    # Проверяем, что сервер вернул ошибку клиента
    assert response.status_code == 400
