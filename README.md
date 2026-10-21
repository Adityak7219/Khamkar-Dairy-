# 🥛 Khamkar Dairy - Online Dairy Shop

A full-featured online dairy product shopping web application built with Django. Browse products, add to cart, place orders, track deliveries, and manage your profile — all in one place!

## ✨ Features

- 🛒 **Product Browsing & Cart** — Browse dairy products and manage your shopping cart
- 💳 **Secure Payments** — Integrated payment system for seamless checkout
- 📦 **Order Tracking** — Track your orders and view order history
- 🚚 **Delivery Management** — Delivery run sheet for efficient delivery tracking
- ❤️ **Favourites** — Save your favourite products for quick access
- 👤 **User Profiles** — Manage your profile and account settings
- 📞 **Contact Us** — Easy communication with the shop
- 🔐 **Admin Panel** — Django admin for product and order management
- 📄 **Invoice Generation** — Auto-generated invoices for orders

## 🛠️ Tech Stack

| Technology | Usage |
|---|---|
| **Python / Django** | Backend framework |
| **HTML5** | Page structure & templates |
| **CSS3** | Styling & responsive design |
| **JavaScript** | Frontend interactivity |
| **SQLite** | Database |

## 📁 Folder Structure

```text
Khamkar-Dairy/
│
├── manage.py
├── requirements.txt
├── build.sh
│
├── dairy_backend/          # Django project settings
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
│
├── shop/                   # Main app
│   ├── models.py
│   ├── views.py
│   ├── api_views.py
│   ├── api_serializers.py
│   ├── urls.py
│   ├── admin.py
│   ├── context_processors.py
│   └── migrations/
│
├── templates/shop/         # HTML templates
│   ├── Cart.html
│   ├── Payment.html
│   ├── Profile.html
│   ├── Orders.html
│   ├── Delivery.html
│   ├── Invoice.html
│   ├── Contact.html
│   └── ...
│
├── static/                 # Static assets
│   ├── css/
│   ├── js/
│   └── images/
│
└── media/                  # Uploaded product images
```

## 🚀 Setup & Installation

### 1. Clone the repository
```bash
git clone https://github.com/Adityak7219/Khamkar-Dairy-.git
cd Khamkar-Dairy-
```

### 2. Create virtual environment
```bash
python -m venv venv
```

### 3. Activate virtual environment

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

### 4. Install dependencies
```bash
pip install -r requirements.txt
```

### 5. Run database migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Create admin user
```bash
python manage.py createsuperuser
```

### 7. Start the server
```bash
python manage.py runserver
```

### 8. Open in browser

| Page | URL |
|---|---|
| 🏠 Home | http://127.0.0.1:8000/ |
| 🔧 Admin Panel | http://127.0.0.1:8000/admin/ |
| 📡 API | http://127.0.0.1:8000/api/ |
| ❤️ Health Check | http://127.0.0.1:8000/api/health/ |

## 📸 Static & Media Files

- Frontend static files: `static/images/`
- Product images (uploaded via admin): `media/products/`

```html
{% load static %}
<img src="{% static 'images/product.jpg' %}" alt="Product">
```

## 👨‍💻 Author

**Aditya Khamkar** — [@Adityak7219](https://github.com/Adityak7219)

---

⭐ Star this repo if you found it useful!
