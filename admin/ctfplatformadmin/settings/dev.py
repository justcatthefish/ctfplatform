import sys
from .base import *

DEBUG = True
ALLOWED_HOSTS = ["*"]

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {'format': '%(levelname)s %(asctime)s %(module)s %(process)d %(thread)d %(message)s'},
        'standard': {'format': '%(asctime)s [%(levelname)s] %(name)s: %(message)s'},
    },
    'handlers': {'console': {'class': 'logging.StreamHandler', 'stream': sys.stdout, 'formatter': 'verbose'}, 'null': {'class': 'logging.NullHandler'}},
    'loggers': {
        'django': {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False},
        'django.request': {'handlers': ['console'], 'level': 'DEBUG', 'propagate': False},
        'django.template': {'handlers': ['console'], 'level': 'INFO', 'propagate': False},
    },
    'root': {'handlers': ['console'], 'level': 'DEBUG'},
}
