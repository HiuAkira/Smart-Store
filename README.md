# Shopping Web Project

## Cài đặt Backend (Django)

1. Tạo và kích hoạt môi trường ảo:

```bash
# Windows
python -m venv env
.\env\Scripts\activate

# Linux/Mac
python3 -m venv env
source env/bin/activate
```

2. Cài đặt các dependencies:

```bash
cd backend
pip install -r requirements.txt
```

3. Chạy migrations:

```bash
python manage.py migrate
```

4. Khởi động server:

```bash
python manage.py runserver
```

## Cài đặt Frontend (React)

1. Cài đặt dependencies:

```bash
cd frontend
npm install
```

2. Khởi động development server:

```bash
npm run dev
```
3. Test 
```bash
pip install pytest pytest-django
```
## Truy cập ứng dụng

- Backend API: http://localhost:8000
- Frontend: http://localhost:5173


## Lưu ý

- Đảm bảo đã cài đặt đầy đủ các dependencies trước khi chạy
- Backend và Frontend cần được chạy đồng thời
- Kiểm tra các biến môi trường trong file .env nếu có
# ITSS
