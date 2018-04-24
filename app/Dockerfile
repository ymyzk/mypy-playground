FROM python:3.6-slim

COPY requirements.txt /app/
WORKDIR /app
RUN pip install -r requirements.txt \
        && rm -rf /root/.cache

COPY . /app

ENV PYTHONUNBUFFERED 1
EXPOSE 8080
CMD ["python", "start_app.py"]
