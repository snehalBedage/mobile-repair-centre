
"""
Django settings for config project.
"""

from pathlib import Path
from datetime import timedelta
import os

from dotenv import load_dotenv


# --------------------------------------------------
# Base Configuration
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


# --------------------------------------------------
# Security Settings
# --------------------------------------------------

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "django-insecure-development-key",
)

DEBUG = os.getenv("DEBUG", "True").strip().lower() == "true"

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "ALLOWED_HOSTS",
        "localhost,127.0.0.1",
    ).split(",")
    if host.strip()
]


# --------------------------------------------------
# Application Definition
# --------------------------------------------------

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "rest_framework",
    "corsheaders",

    "apps.accounts",
    "apps.customers",
    "apps.inventory",
    "apps.repairs",
    "apps.billing",
    "apps.reports",
]


# --------------------------------------------------
# Middleware
# --------------------------------------------------

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# --------------------------------------------------
# URL and Template Configuration
# --------------------------------------------------

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"


# --------------------------------------------------
# Database Configuration - Local / Aiven MySQL
# --------------------------------------------------

DB_SSL_CA = os.getenv("DB_SSL_CA", "").strip()

if DB_SSL_CA and not os.path.isabs(DB_SSL_CA):
    DB_SSL_CA = str(BASE_DIR / DB_SSL_CA)

DATABASE_OPTIONS = {}

if DB_SSL_CA:
    DATABASE_OPTIONS["ssl"] = {
        "ca": DB_SSL_CA,
    }

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME", "mobile_repair_db"),
        "USER": os.getenv("DB_USER", ""),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "localhost"),
        "PORT": os.getenv("DB_PORT", "3306"),
        "OPTIONS": DATABASE_OPTIONS,
    }
}


# --------------------------------------------------
# Password Validation
# --------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# --------------------------------------------------
# Internationalization
# --------------------------------------------------

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_TZ = True


# --------------------------------------------------
# Static Files
# --------------------------------------------------

STATIC_URL = "/static/"

STATIC_ROOT = BASE_DIR / "staticfiles"

if not DEBUG:
    STORAGES = {
        "default": {
            "BACKEND": (
                "django.core.files.storage.FileSystemStorage"
            ),
        },
        "staticfiles": {
            "BACKEND": (
                "whitenoise.storage."
                "CompressedManifestStaticFilesStorage"
            ),
        },
    }


# --------------------------------------------------
# Email Configuration - Gmail SMTP
# --------------------------------------------------

EMAIL_BACKEND = (
    "django.core.mail.backends.smtp.EmailBackend"
)

EMAIL_HOST = "smtp.gmail.com"

EMAIL_PORT = 587

EMAIL_USE_TLS = True

EMAIL_USE_SSL = False

EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")

EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")

DEFAULT_FROM_EMAIL = EMAIL_HOST_USER

EMAIL_TIMEOUT = 30


# --------------------------------------------------
# Django REST Framework
# --------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_PAGINATION_CLASS": (
        "rest_framework.pagination.PageNumberPagination"
    ),
    "PAGE_SIZE": 10,
}


# --------------------------------------------------
# JWT Configuration
# --------------------------------------------------

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=60),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "AUTH_HEADER_TYPES": ("Bearer",),
}


# --------------------------------------------------
# Custom User Model
# --------------------------------------------------

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"


# --------------------------------------------------
# CORS Configuration
# --------------------------------------------------

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]


# --------------------------------------------------
# CSRF and Frontend Configuration
# --------------------------------------------------

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "CSRF_TRUSTED_ORIGINS",
        "",
    ).split(",")
    if origin.strip()
]

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
).rstrip("/")


# --------------------------------------------------
# HTTPS / Render Proxy Configuration
# --------------------------------------------------

SECURE_PROXY_SSL_HEADER = (
    "HTTP_X_FORWARDED_PROTO",
    "https",
)

# Production HTTPS security settings
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
