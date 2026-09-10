# Django Dairy Shop Backend

This project is structured for your dairy shopping frontend.

## Folder structure

```text
django_dairy_shop/
│
├── manage.py
├── requirements.txt
├── README.md
│
├── dairy_backend/
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
│
├── shop/
│   ├── models.py
│   ├── views.py
│   ├── api_views.py
│   ├── api_serializers.py
│   ├── urls.py
│   ├── api_urls.py
│   ├── admin.py
│   └── migrations/
│
├── templates/
│   └── shop/
│       └── index.html
│
├── static/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── images/
│
└── media/
```

## Setup

```bash
python -m venv venv
```

Windows:
```bash
venv\Scripts\activate
```

Install:
```bash
pip install -r requirements.txt
```

Database:
```bash
python manage.py makemigrations
python manage.py migrate
```

Admin:
```bash
python manage.py createsuperuser
```

Run:
```bash
python manage.py runserver
```

Open:
http://127.0.0.1:8000/

Admin:
http://127.0.0.1:8000/admin/

API:
http://127.0.0.1:8000/api/

Health:
http://127.0.0.1:8000/api/health/

## Images

Put frontend/static images in:

```text
static/images/
```

Product images uploaded through Django Admin are stored in:

```text
media/products/
```

For HTML/CSS/JS static files use Django's `{% static %}` path.

Example:

```html
{% load static %}
<img src="{% static 'images/product.jpg' %}" alt="Product">
```
