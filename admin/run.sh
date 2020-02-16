#!/bin/bash

#exec python manage.py runserver 0.0.0.0:${APP_PORT}

python manage.py collectstatic --no-input  # TODO: rm

exec gunicorn ctfplatformadmin.wsgi:application \
  --name ctfplatformadmin \
  --bind 0.0.0.0:${APP_PORT} \
  --workers ${GUNICORN_WORKERS} \
  --timeout ${GUNICORN_TIMEOUT} \
  --log-level=info \
  --limit-request-line=0 \
  --limit-request-field_size 32380 \
  --limit-request-fields 300 \
  --log-file=-
