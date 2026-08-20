FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .

# Use extra-index-url so pip still searches the main Python registry for background dependencies
RUN pip install torch torchvision --extra-index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Render defaults to port 10000
EXPOSE 10000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]