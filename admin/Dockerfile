FROM python:3.8.0-buster

COPY requirements.txt /tmp/
RUN pip install --no-cache-dir -r /tmp/requirements.txt

WORKDIR /code
COPY . .

RUN chmod +x run.sh
CMD ["./run.sh"]
