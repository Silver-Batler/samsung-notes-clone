FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
COPY test_api.py .
COPY .bandit.yml .
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]