# API Documentation - Meal Plan

## Base URL

```
http://localhost:8000/api/meal-plans/
```

# --- BỔ SUNG: API Danh Mục Thực Phẩm ---

## Categories (Danh mục thực phẩm)

### 1. Lấy danh sách danh mục

**GET** `/api/categories/`

**Response:**

```json
[
  {
    "categoryID": 1,
    "categoryName": "Thịt"
  },
  {
    "categoryID": 2,
    "categoryName": "Hải sản"
  }
]
```

### 2. Thêm danh mục mới

**POST** `/api/categories/`

**Request Body:**

```json
{
  "categoryName": "Tên danh mục mới"
}
```

**Response (201):**

```json
{
  "message": "Danh mục đã được thêm thành công",
  "data": {
    "categoryID": 10,
    "categoryName": "Tên danh mục mới"
  }
}
```

**Lỗi (400):**

```json
{
  "message": "Có lỗi xảy ra khi thêm danh mục",
  "errors": { "categoryName": ["This field is required."] }
}
```

### 3. Lấy chi tiết danh mục

**GET** `/api/categories/{id}/`

**Response:**

```json
{
  "categoryID": 1,
  "categoryName": "Thịt"
}
```

**Lỗi (404):**

```json
{
  "message": "Không tìm thấy danh mục"
}
```

### 4. Cập nhật danh mục

**PUT** `/api/categories/{id}/`

**Request Body:**

```json
{
  "categoryName": "Tên mới"
}
```

**Response:**

```json
{
  "message": "Danh mục đã được cập nhật thành công",
  "data": {
    "categoryID": 1,
    "categoryName": "Tên mới"
  }
}
```

**Lỗi (400):**

```json
{
  "message": "Có lỗi xảy ra khi cập nhật danh mục",
  "errors": { "categoryName": ["This field is required."] }
}
```

**Lỗi (404):**

```json
{
  "message": "Không tìm thấy danh mục"
}
```

### 5. Xóa danh mục

**DELETE** `/api/categories/{id}/`

**Response (204):**

```json
{
  "message": "Danh mục đã được xóa thành công"
}
```

**Lỗi (404):**

```json
{
  "message": "Không tìm thấy danh mục"
}
```

# --- HẾT PHẦN BỔ SUNG ---

# --- BỔ SUNG: API Quản Lý Tài Khoản (User) ---

## Đăng ký tài khoản

**POST** `/api/register/`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "12345678",
  "name": "Nguyễn Văn A"
}
```

**Response (201):**

```json
{
  "message": "Đăng ký thành công",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Nguyễn Văn A",
    "role": "member"
  }
}
```

**Lỗi (400):**

```json
{
  "message": "Đăng ký thất bại",
  "errors": { "email": ["Email đã tồn tại."] }
}
```

## Đăng nhập (JWT)

**POST** `/api/token/`

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "12345678"
}
```

**Response (200):**

```json
{
  "refresh": "<refresh_token>",
  "access": "<access_token>",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Nguyễn Văn A",
    "role": "member",
    "username": "user1",
    "phone": "0123456789",
    "dateOfBirth": "2000-01-01",
    "address": "Hà Nội",
    "bio": "..."
  }
}
```

**Lỗi (400):**

```json
{
  "non_field_errors": ["Email không tồn tại hoặc mật khẩu không đúng."]
}
```

## Lấy thông tin user hiện tại

**GET** `/api/user/me/` (Yêu cầu JWT)

**Response:**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Nguyễn Văn A",
    "username": "user1",
    "role": "member",
    "phone": "0123456789",
    "dateOfBirth": "2000-01-01",
    "address": "Hà Nội",
    "bio": "..."
  }
}
```

## Cập nhật thông tin cá nhân

**PUT** `/api/user/update/` (Yêu cầu JWT)

**Request Body:**

```json
{
  "name": "Tên mới",
  "phone": "0987654321",
  "dateOfBirth": "2001-01-01",
  "address": "TP.HCM",
  "bio": "Thông tin cá nhân mới"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Cập nhật thông tin thành công",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "Tên mới",
    "username": "user1",
    "role": "member",
    "phone": "0987654321",
    "dateOfBirth": "2001-01-01",
    "address": "TP.HCM",
    "bio": "Thông tin cá nhân mới"
  }
}
```

**Lỗi (400):**

```json
{
  "success": false,
  "message": "Email đã được sử dụng bởi tài khoản khác"
}
```

## Danh sách user (chỉ admin)

**GET** `/api/user/list/` (Yêu cầu JWT, admin)

**Response:**

```json
[
  {
    "id": 1,
    "email": "user@example.com",
    "name": "Nguyễn Văn A",
    "role": "member",
    "is_active": true
  },
  ...
]
```

## Quản lý chi tiết user (chỉ admin)

**GET** `/api/user/{user_id}/` (Yêu cầu JWT, admin)

**Response:**

```json
{
  "success": true,
  "data": {
    "id": 2,
    "email": "user2@example.com",
    "name": "Nguyễn Văn B",
    "role": "member",
    "is_active": true
  }
}
```

**PATCH** `/api/user/{user_id}/` (Yêu cầu JWT, admin)

**Request Body:**

```json
{
  "name": "Tên mới",
  "role": "admin"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Cập nhật thông tin thành công",
  "data": {
    "id": 2,
    "email": "user2@example.com",
    "name": "Tên mới",
    "role": "admin"
  }
}
```

**DELETE** `/api/user/{user_id}/` (Yêu cầu JWT, admin)

**Response:**

```json
{
  "success": true,
  "message": "Xóa người dùng thành công"
}
```

**Lỗi (400/404):**

```json
{
  "success": false,
  "message": "Không thể xóa tài khoản admin" // hoặc "Không tìm thấy người dùng"
}
```

## Cập nhật trạng thái user (chỉ admin)

**PATCH** `/api/user/{user_id}/status/` (Yêu cầu JWT, admin)

**Request Body:**

```json
{
  "is_active": false
}
```

**Response:**

```json
{
  "success": true,
  "message": "Đã vô hiệu hóa tài khoản thành công",
  "data": {
    "id": 2,
    "name": "Nguyễn Văn B",
    "email": "user2@example.com",
    "is_active": false
  }
}
```

## Cập nhật vai trò user (chỉ admin)

**PATCH** `/api/user/{user_id}/role/` (Yêu cầu JWT, admin)

**Request Body:**

```json
{
  "role": "admin"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Cập nhật vai trò thành công",
  "data": {
    "id": 2,
    "name": "Nguyễn Văn B",
    "email": "user2@example.com",
    "role": "admin"
  }
}
```

**Lỗi (400):**

```json
{
  "success": false,
  "message": "Không thể thay đổi vai trò của chính mình"
}
```

# --- HẾT PHẦN BỔ SUNG ---

## Endpoints

### 1. Lấy danh sách kế hoạch bữa ăn

**GET** `/api/meal-plans/`

**Query Parameters:**

- `group_id` (optional): Lọc theo nhóm
- `user_id` (optional): Lọc theo người dùng

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "planID": 1,
      "plan_name": "Kế hoạch tuần này",
      "start_date": "2024-01-15",
      "description": "Kế hoạch ăn uống cho tuần",
      "mealType": "breakfast",
      "day_of_week": 0,
      "group": 1,
      "user": 1,
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### 2. Tạo kế hoạch bữa ăn mới

**POST** `/api/meal-plans/`

**Request Body:**

```json
{
  "plan_name": "Kế hoạch tuần này",
  "start_date": "2024-01-15",
  "description": "Mô tả kế hoạch",
  "group": 1,
  "user": 1,
  "planned_meals": [
    {
      "day": "0",
      "meal": "breakfast"
    },
    {
      "day": "0",
      "meal": "lunch"
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "message": "Tạo kế hoạch bữa ăn thành công",
  "data": [...]
}
```

### 3. Lấy chi tiết kế hoạch bữa ăn

**GET** `/api/meal-plans/{id}/`

**Response:**

```json
{
  "success": true,
  "data": {
    "planID": 1,
    "plan_name": "Kế hoạch tuần này",
    "start_date": "2024-01-15",
    "description": "Kế hoạch ăn uống cho tuần",
    "mealType": "breakfast",
    "day_of_week": 0,
    "group": 1,
    "user": 1,
    "recipes": [
      {
        "recipeID": 1,
        "recipeName": "Phở bò",
        "description": "Phở bò truyền thống",
        "image": "http://example.com/pho.jpg"
      }
    ],
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:00:00Z"
  }
}
```

### 4. Cập nhật kế hoạch bữa ăn

**PUT** `/api/meal-plans/{id}/`

**Request Body:**

```json
{
  "plan_name": "Kế hoạch mới",
  "description": "Mô tả mới"
}
```

### 5. Xóa kế hoạch bữa ăn

**DELETE** `/api/meal-plans/{id}/`

**Response:**

```json
{
  "success": true,
  "message": "Xóa kế hoạch thành công"
}
```

### 6. Lấy kế hoạch theo tuần

**GET** `/api/meal-plans/weekly/`

**Query Parameters:**

- `start_date` (required): Ngày bắt đầu tuần (YYYY-MM-DD)
- `group_id` (required): ID nhóm

**Response:**

```json
{
  "success": true,
  "data": {
    "start_date": "2024-01-15",
    "end_date": "2024-01-21",
    "meals_by_day": {
      "day_0": {
        "breakfast": [
          {
            "planID": 1,
            "plan_name": "Kế hoạch tuần này",
            "recipes": [...]
          }
        ],
        "lunch": [...],
        "dinner": [...]
      },
      "day_1": {...},
      ...
    },
    "ingredients_summary": {
      "vegetables": ["Cà chua (5 quả)", "Đậu bắp (200g)"],
      "meat_seafood": ["Cá lóc (1kg)", "Thịt ba chỉ (500g)"],
      "others": ["Trứng gà (10 quả)", "Nước dừa (500ml)"]
    }
  }
}
```

### 7. Thêm món ăn vào kế hoạch

**POST** `/api/meal-plans/{id}/recipes/`

**Request Body:**

```json
{
  "recipe_id": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Đã thêm món ăn vào kế hoạch"
}
```

### 8. Xóa món ăn khỏi kế hoạch

**DELETE** `/api/meal-plans/{id}/recipes/`

**Request Body:**

```json
{
  "recipe_id": 1
}
```

**Response:**

```json
{
  "success": true,
  "message": "Đã xóa món ăn khỏi kế hoạch"
}
```

## Lỗi thường gặp

### 400 Bad Request

```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": {...}
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Kế hoạch bữa ăn không tồn tại"
}
```

## Frontend Integration

### Ví dụ sử dụng trong React

```javascript
// Tạo kế hoạch mới
const createMealPlan = async (data) => {
  const response = await fetch("/api/meal-plans/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
};

// Lấy kế hoạch theo tuần
const getWeeklyPlan = async (startDate, groupId) => {
  const response = await fetch(
    `/api/meal-plans/weekly/?start_date=${startDate}&group_id=${groupId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.json();
};
```

## Day of Week Mapping

- 0: Thứ 2 (Monday)
- 1: Thứ 3 (Tuesday)
- 2: Thứ 4 (Wednesday)
- 3: Thứ 5 (Thursday)
- 4: Thứ 6 (Friday)
- 5: Thứ 7 (Saturday)
- 6: CN (Sunday)

## Meal Type Options

- `breakfast`: Bữa sáng
- `lunch`: Bữa trưa
- `dinner`: Bữa tối
