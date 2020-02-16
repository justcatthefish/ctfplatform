import sys
from .base import *
import os

DEBUG = True

DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': os.path.join(BASE_DIR, 'db.sqlite')}}

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'},
        'standard': {'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'},
    },
    'handlers': {'console': {'class': 'logging.StreamHandler', 'stream': sys.stdout, 'formatter': 'verbose'}, 'null': {'class': 'logging.NullHandler'}},
    'loggers': {'django': {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False}, 'django.request': {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False}},
    'root': {'handlers': ['console'], 'level': 'DEBUG'},
}
