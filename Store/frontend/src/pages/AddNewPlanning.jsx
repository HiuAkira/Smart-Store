import React, { useState, useEffect } from "react";
import {
  Card,
  Button,
  Input,
  Select,
  Form,
  Typography,
  Row,
  Col,
  Divider,
  message,
} from "antd";
import {
  LeftOutlined,
  PlusOutlined,
  SaveOutlined,
  CloseOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate, useSearchParams } from "react-router-dom";
import dayjs from "dayjs";
import api from "../config/api";

const { Title, Text } = Typography;

const MealPlanNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [planName, setPlanName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMealType, setSelectedMealType] = useState("");
  const [plannedMeals, setPlannedMeals] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- Đề xuất món ăn từ tủ lạnh ---
  const [recommendations, setRecommendations] = useState([]);
  const pageSize = 4;
  const [isLoadingRecommend, setIsLoadingRecommend] = useState(true);
  const [errorRecommend, setErrorRecommend] = useState("");

  // Lấy thông tin user và group từ localStorage
  const getUserInfo = () => {
    try {
      // Lấy user object từ localStorage
      const userStr = localStorage.getItem("user");
      let userId = 1; // Fallback default
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          userId = userObj.id || 1;
        } catch (parseError) {
          console.error("Error parsing user JSON:", parseError);
        }
      }

      // Lấy group ID
      const groupId = localStorage.getItem("selectedGroup") || "1";

      return {
        userId: parseInt(userId),
        groupId: parseInt(groupId),
      };
    } catch (error) {
      console.error("Error getting user info from localStorage:", error);
      return { userId: 1, groupId: 1 }; // Fallback values
    }
  };

  const mealTypes = [
    { value: "breakfast", label: "Bữa sáng" },
    { value: "lunch", label: "Bữa trưa" },
    { value: "dinner", label: "Bữa tối" },
  ];

  const dayNames = [
    "Thứ 2",
    "Thứ 3",
    "Thứ 4",
    "Thứ 5",
    "Thứ 6",
    "Thứ 7",
    "Chủ nhật",
  ];

  const fetchRecommendations = async (page = 1) => {
    setIsLoadingRecommend(true);
    setErrorRecommend("");
    try {
      const params = { page, page_size: pageSize };
      const response = await api.get("/api/fridge/recommendation/", { params });
      setRecommendations(response.data.recommendations || []);
    } catch {
      setErrorRecommend("Không thể tải gợi ý món ăn. Thử lại sau.");
    } finally {
      setIsLoadingRecommend(false);
    }
  };

  useEffect(() => {
    // Fetch recipes khi component mount
    fetchRecommendations();
  }, []);

  // Đọc query params và tự động điền form
  useEffect(() => {
    const dateParam = searchParams.get("date");
    const mealTypeParam = searchParams.get("mealType");
    const dayParam = searchParams.get("day");
    const dayNameParam = searchParams.get("dayName");
    const editParam = searchParams.get("edit");
    const plannedMealsParam = searchParams.get("plannedMeals");
    const planIDParam = searchParams.get("planID");

    console.log("Query params:", {
      dateParam,
      mealTypeParam,
      dayParam,
      dayNameParam,
      editParam,
      plannedMealsParam,
      planIDParam,
    });

    if (dateParam) {
      setStartDate(dateParam);

      // Sử dụng Day.js để xử lý ngày tháng chính xác
      const date = dayjs(dateParam);

      // Ưu tiên sử dụng dayName từ query params nếu có
      let dayName;
      if (dayNameParam) {
        dayName = decodeURIComponent(dayNameParam);
        console.log("Using dayName from query params:", dayName);
      } else {
        // Fallback: tính từ ngày bằng Day.js
        const dayNames = [
          "Chủ nhật", // Day.js: 0 = Sunday
          "Thứ 2", // Day.js: 1 = Monday
          "Thứ 3", // Day.js: 2 = Tuesday
          "Thứ 4", // Day.js: 3 = Wednesday
          "Thứ 5", // Day.js: 4 = Thursday
          "Thứ 6", // Day.js: 5 = Friday
          "Thứ 7", // Day.js: 6 = Saturday
        ];
        dayName = dayNames[date.day()];
        console.log(
          "Calculated dayName from date using Day.js:",
          dayName,
          "day():",
          date.day()
        );
      }

      const formattedDate = date.format("DD/MM/YYYY"); // Sử dụng Day.js để format

      if (mealTypeParam) {
        const mealTypeNames = {
          breakfast: "Bữa sáng",
          lunch: "Bữa trưa",
          dinner: "Bữa tối",
        };
        const mealTypeName = mealTypeNames[mealTypeParam] || mealTypeParam;

        if (editParam === "true") {
          setPlanName(
            `Chỉnh sửa ${mealTypeName} ${dayName} (${formattedDate})`
          );
        } else {
          setPlanName(`${mealTypeName} ${dayName} (${formattedDate})`);
        }
      } else {
        if (editParam === "true") {
          setPlanName(`Chỉnh sửa kế hoạch ${dayName} (${formattedDate})`);
        } else {
          setPlanName(`Kế hoạch ${dayName} (${formattedDate})`);
        }
      }
    }

    if (mealTypeParam) {
      setSelectedMealType(mealTypeParam);
    }

    // Nếu có thông tin ngày cụ thể, tự động thêm một planned meal (chỉ khi không phải edit hoặc không có plannedMealsParam)
    if (
      dayParam !== null &&
      mealTypeParam &&
      !(editParam === "true" && plannedMealsParam)
    ) {
      const dayIndex = parseInt(dayParam);
      if (!isNaN(dayIndex)) {
        setPlannedMeals([
          {
            day: dayIndex,
            recipeId: null,
          },
        ]);
      }
    }

    // Nếu là chỉnh sửa và có plannedMeals truyền qua query, set lại plannedMeals
    if (editParam === "true" && plannedMealsParam) {
      try {
        const decoded = decodeURIComponent(plannedMealsParam);
        const parsed = JSON.parse(decoded);
        if (Array.isArray(parsed)) {
          // Đảm bảo luôn có recipeId
          setPlannedMeals(
            parsed.map((item) => ({
              day: item.day,
              recipeId: item.recipe_id || item.recipeId || null,
            }))
          );
        }
      } catch (e) {
        console.error("Không thể parse plannedMeals từ query", e);
      }
    }

    // Nếu là chỉnh sửa và có planID, fetch lại meal plan từ backend
    if (editParam === "true" && planIDParam) {
      (async () => {
        try {
          const res = await api.get(`/api/meal-plans/${planIDParam}/`);
          if (res.data && res.data.success && res.data.data) {
            const plan = res.data.data;
            setPlanName(plan.plan_name || "");
            setStartDate(plan.start_date || "");
            setDescription(plan.description || "");
            setSelectedMealType(plan.mealType || "");
            // plannedMeals: chuyển từ recipes sang [{day, recipeId}]
            if (Array.isArray(plan.recipes) && plan.recipes.length > 0) {
              setPlannedMeals(
                plan.recipes.map((r) => ({
                  day: plan.day_of_week,
                  recipeId: r.recipeID,
                }))
              );
            } else {
              setPlannedMeals([]);
            }
          }
        } catch (e) {
          console.error("Không thể fetch meal plan khi chỉnh sửa", e);
        }
      })();
      return;
    }

    // Hiển thị thông báo hướng dẫn
    if (editParam === "true") {
      message.info(
        "Bạn đang chỉnh sửa kế hoạch bữa ăn. Thông tin đã được điền sẵn."
      );
    } else {
      message.success("Thông tin ngày và bữa ăn đã được điền sẵn từ lịch.");
    }
  }, [searchParams]);

  const addPlannedMeal = () => {
    setPlannedMeals([
      ...plannedMeals,
      {
        day: 0,
        recipeId: null,
      },
    ]);
  };

  const [customRecipes, setCustomRecipes] = useState(() => {
    const saved = localStorage.getItem("customRecipes");
    return saved ? JSON.parse(saved) : [];
  });

  const updatePlannedMeal = (index, updates) => {
    const updated = [...plannedMeals];
    updated[index] = { ...updated[index], ...updates };
    setPlannedMeals(updated);

    // Nếu là món ăn tùy chọn, lưu vào localStorage
    if (updates.customRecipeName) {
      const newCustomRecipe = {
        name: updates.customRecipeName,
        addedAt: new Date().toISOString(),
      };
      const updatedCustomRecipes = [...customRecipes, newCustomRecipe];
      setCustomRecipes(updatedCustomRecipes);
      localStorage.setItem(
        "customRecipes",
        JSON.stringify(updatedCustomRecipes)
      );
    }
  };

  const removePlannedMeal = (index) => {
    const updated = plannedMeals.filter((_, i) => i !== index);
    setPlannedMeals(updated);
  };

  const handleSave = async () => {
    console.log("=== [DEBUG] BẮT ĐẦU LƯU KẾ HOẠCH ===");

    // Lấy thông tin edit từ URL params và kiểm tra kỹ hơn
    const editParam = searchParams.get("edit");
    const planIDParam = searchParams.get("planID");

    console.log("Edit params:", {
      editParam,
      planIDParam,
      isEdit: editParam === "true",
      hasPlanID: !!planIDParam,
      fullUrl: window.location.href,
    });

    // Kiểm tra kỹ điều kiện edit
    const isEditMode = editParam === "true" && planIDParam;
    console.log("Is edit mode:", isEditMode);

    // Validation chi tiết hơn
    if (!planName.trim()) {
      message.error("Vui lòng nhập tên kế hoạch");
      return;
    }

    if (!startDate) {
      message.error("Vui lòng chọn ngày bắt đầu");
      return;
    }

    if (!selectedMealType) {
      message.error("Vui lòng chọn bữa ăn");
      return;
    }

    setLoading(true);

    try {
      // Lấy thông tin user mới nhất
      const currentUserInfo = getUserInfo();
      console.log("Current user info:", currentUserInfo);

      // Validation user info
      if (!currentUserInfo.userId || !currentUserInfo.groupId) {
        message.error(
          "Không thể xác định thông tin người dùng. Vui lòng đăng nhập lại."
        );
        setLoading(false);
        return;
      }

      // Chuyển đổi format dữ liệu cho backend
      const formattedPlannedMeals = plannedMeals.map((meal) => ({
        day: meal.day.toString(),
        meal: selectedMealType,
        recipe_id: meal.recipeId || null,
        custom_recipe_name: meal.customRecipeName || null,
      }));

      const mealPlanData = {
        plan_name: planName.trim(),
        start_date: startDate,
        description: description ? description.trim() : "",
        planned_meals: formattedPlannedMeals,
        meal_type: selectedMealType,
        group: currentUserInfo.groupId,
        user: currentUserInfo.userId,
      };

      console.log("[DEBUG] mealPlanData:", mealPlanData);
      console.log("[DEBUG] Is edit mode:", isEditMode);
      console.log("[DEBUG] Plan ID:", planIDParam);

      let response;
      // Sử dụng biến isEditMode đã kiểm tra
      if (isEditMode) {
        console.log("[DEBUG] Using PUT method for update");
        response = await api.put(
          `/api/meal-plans/${planIDParam}/`,
          mealPlanData
        );
      } else {
        console.log("[DEBUG] Using POST method for create");
        response = await api.post("/api/meal-plans/", mealPlanData);
      }

      console.log("[DEBUG] Response:", response);

      if (response.data.success) {
        if (isEditMode) {
          message.success("Cập nhật kế hoạch thành công!");
        } else {
          message.success("Tạo kế hoạch mới thành công!");
        }
        // Reset form
        setPlanName("");
        setStartDate("");
        setDescription("");
        setSelectedMealType("");
        setPlannedMeals([]);
        navigate("/meal-planning");
      } else {
        message.error(
          response.data.message || "Có lỗi xảy ra khi lưu kế hoạch"
        );
      }
    } catch (error) {
      console.error("=== CATCH ERROR ===");
      console.error("Error saving meal plan:", error);
      console.error("Error message:", error.message);
      console.error("Error response:", error.response?.data);
      console.error("Error status:", error.response?.status);

      if (error.response?.status === 400) {
        if (error.response?.data?.message?.includes("already exists")) {
          message.error(
            "Kế hoạch bữa ăn này đã tồn tại cho ngày và bữa ăn này trong nhóm. Vui lòng chọn tên khác hoặc chỉnh sửa kế hoạch cũ."
          );
        } else if (error.response?.data?.errors) {
          const errorMsg = Object.entries(error.response.data.errors)
            .map(
              ([field, messages]) =>
                `${field}: ${
                  Array.isArray(messages) ? messages.join(", ") : messages
                }`
            )
            .join("; ");
          message.error("Lỗi validation: " + errorMsg);
        }
      } else if (error.response?.status === 401) {
        message.error("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
      } else if (error.response?.status === 403) {
        message.error("Bạn không có quyền thực hiện thao tác này");
      } else if (error.response?.status >= 500) {
        message.error("Lỗi server, vui lòng thử lại sau");
      } else {
        message.error("Có lỗi xảy ra khi lưu kế hoạch");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/meal-planning");
  };

  const [fridgeItems, setFridgeItems] = useState([]);

  // Lấy thực phẩm trong tủ lạnh khi mount
  useEffect(() => {
    const fetchFridge = async () => {
      try {
        const response = await api.get("/api/fridge/");
        setFridgeItems(response.data.items || []);
      } catch {
        setFridgeItems([]);
      }
    };
    fetchFridge();
  }, []);

  const [storeProducts, setStoreProducts] = useState([]);
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/api/products/");
        setStoreProducts(res.data || []);
      } catch {
        setStoreProducts([]);
      }
    };
    fetchProducts();
  }, []);

  // Hàm tạo danh sách mua sắm và redirect
  const handleCreateShoppingList = (missingIngredients) => {
    navigate("/add-shopping-list", { state: { items: missingIngredients } });
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Đề xuất món ăn từ tủ lạnh */}
      <Card title="Gợi ý món ăn từ tủ lạnh" style={{ marginBottom: 24 }}>
        {errorRecommend && <p style={{ color: "red" }}>{errorRecommend}</p>}
        {isLoadingRecommend ? (
          <p>Đang tải...</p>
        ) : recommendations.length > 0 ? (
          <Row gutter={16}>
            {recommendations.map((recipe) => (
              <Col key={recipe.recipeID} xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  cover={
                    <img
                      alt={recipe.recipeName}
                      src={recipe.image || "/images/default.jpg"}
                      style={{ height: 160, objectFit: "cover" }}
                      onError={(e) => {
                        e.target.src = "/images/default.jpg";
                      }}
                    />
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Card.Meta
                    title={recipe.recipeName}
                    description={
                      <>
                        <div>
                          Khớp: {recipe.match_percentage}% (
                          {recipe.matching_ingredients_count}/
                          {recipe.total_ingredients})
                        </div>
                      </>
                    }
                  />
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ textAlign: "center", color: "#888" }}>
            <span style={{ fontSize: 40 }}>👨‍🍳</span>
            <p>
              Hãy thêm nhiều nguyên liệu hơn vào tủ lạnh để nhận gợi ý món ăn
            </p>
          </div>
        )}
      </Card>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Button
            icon={<LeftOutlined />}
            onClick={handleCancel}
            style={{ marginRight: 16 }}
          >
            Quay lại
          </Button>
          <Title level={2} style={{ display: "inline-block", margin: 0 }}>
            Lập kế hoạch bữa ăn mới
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSave}
            loading={loading}
            disabled={loading}
          >
            {loading ? "Đang lưu..." : "Lưu kế hoạch"}
          </Button>
        </Col>
      </Row>
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card title="Thông tin kế hoạch" style={{ marginBottom: 24 }}>
            <Form layout="vertical">
              <Form.Item label="Tên kế hoạch">
                <Input
                  placeholder="Ví dụ: Kế hoạch tuần này"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                />
              </Form.Item>
              <Form.Item label="Ngày bắt đầu">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Item>
              <Form.Item label="Mô tả (tùy chọn)">
                <Input
                  placeholder="Mô tả về kế hoạch bữa ăn"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Item>
              <Form.Item label="Bữa ăn">
                <Select
                  placeholder="Chọn loại bữa ăn cho kế hoạch này"
                  value={selectedMealType || undefined}
                  onChange={(value) => setSelectedMealType(value)}
                  style={{ width: "100%" }}
                  allowClear
                >
                  {mealTypes.map((type) => (
                    <Select.Option key={type.value} value={type.value}>
                      {type.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Form>
          </Card>

          <Card
            title={
              <Row justify="space-between" align="middle">
                <Col>Danh sách món ăn theo ngày</Col>
                <Col>
                  <Button
                    icon={<PlusOutlined />}
                    onClick={addPlannedMeal}
                    size="small"
                  >
                    Thêm món
                  </Button>
                </Col>
              </Row>
            }
            style={{ marginBottom: 24 }}
          >
            {plannedMeals.length === 0 ? (
              <div style={{ textAlign: "center", color: "#888", padding: 32 }}>
                <p>Chưa có món ăn nào được lập kế hoạch</p>
                <p style={{ fontSize: 13 }}>Nhấn "Thêm món" để bắt đầu</p>
              </div>
            ) : (
              plannedMeals.map((meal, index) => (
                <Row
                  key={index}
                  gutter={8}
                  align="middle"
                  style={{
                    marginBottom: 12,
                    padding: 12,
                    border: "1px solid #f0f0f0",
                    borderRadius: 6,
                    backgroundColor: "#fafafa",
                  }}
                >
                  <Col span={6}>
                    <div
                      style={{ marginBottom: 4, fontSize: 12, color: "#666" }}
                    >
                      Ngày
                    </div>
                    <Select
                      value={meal.day}
                      style={{ width: "100%" }}
                      onChange={(value) =>
                        updatePlannedMeal(index, { day: value })
                      }
                    >
                      {dayNames.map((day, dayIndex) => (
                        <Select.Option key={dayIndex} value={dayIndex}>
                          {day}
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={16}>
                    <div
                      style={{ marginBottom: 4, fontSize: 12, color: "#666" }}
                    >
                      Món ăn
                    </div>
                    <Select
                      mode="tags"
                      value={
                        meal.recipeId
                          ? [meal.recipeId]
                          : meal.customRecipeName
                          ? [meal.customRecipeName]
                          : []
                      }
                      style={{ width: "100%" }}
                      loading={isLoadingRecommend}
                      placeholder={
                        isLoadingRecommend
                          ? "Đang tải..."
                          : "Chọn hoặc nhập món ăn"
                      }
                      onChange={(values) => {
                        const value = values[values.length - 1];
                        if (recommendations.some((r) => r.recipeID === value)) {
                          updatePlannedMeal(index, {
                            recipeId: value,
                            customRecipeName: undefined,
                          });
                        } else {
                          updatePlannedMeal(index, {
                            recipeId: null,
                            customRecipeName: value,
                          });
                        }
                      }}
                      showSearch
                      optionLabelProp="label"
                      filterOption={(input, option) =>
                        option.children.props["data-search"]
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      allowClear
                    >
                      {recommendations.map((recipe) => (
                        <Select.Option
                          key={recipe.recipeID}
                          value={recipe.recipeID}
                          data-search={recipe.recipeName}
                          label={recipe.recipeName}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                            data-search={recipe.recipeName}
                          >
                            <img
                              src={recipe.image || "/images/default.jpg"}
                              alt={recipe.recipeName}
                              style={{
                                width: 32,
                                height: 32,
                                objectFit: "cover",
                                borderRadius: 4,
                                marginRight: 8,
                              }}
                              onError={(e) => {
                                e.target.src = "/images/default.jpg";
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500 }}>
                                {recipe.recipeName}
                              </div>
                              {typeof recipe.match_percentage !==
                                "undefined" && (
                                <div style={{ fontSize: 12, color: "#888" }}>
                                  Khớp: {recipe.match_percentage}% (
                                  {recipe.matching_ingredients_count}/
                                  {recipe.total_ingredients})
                                </div>
                              )}
                            </div>
                          </div>
                        </Select.Option>
                      ))}
                      {customRecipes.map((recipe) => (
                        <Select.Option
                          key={`custom-${recipe.name}`}
                          value={recipe.name}
                          data-search={recipe.name}
                          label={recipe.name}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                            data-search={recipe.name}
                          >
                            <img
                              src="/images/default.jpg"
                              alt={recipe.name}
                              style={{
                                width: 32,
                                height: 32,
                                objectFit: "cover",
                                borderRadius: 4,
                                marginRight: 8,
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: 500 }}>
                                {recipe.name}
                              </div>
                              <div style={{ fontSize: 12, color: "#888" }}>
                                Món tùy chọn
                              </div>
                            </div>
                          </div>
                        </Select.Option>
                      ))}
                    </Select>
                  </Col>
                  <Col span={2}>
                    <div
                      style={{
                        marginBottom: 4,
                        fontSize: 12,
                        color: "transparent",
                      }}
                    >
                      Xóa
                    </div>
                    <Button
                      icon={<CloseOutlined />}
                      onClick={() => removePlannedMeal(index)}
                      size="small"
                      danger
                      style={{ width: "100%" }}
                    />
                  </Col>
                </Row>
              ))
            )}
          </Card>

          <Card title="Tổng hợp nguyên liệu cần mua">
            {(() => {
              // Lấy các recipe đã chọn
              const selectedRecipes = recommendations.filter((r) =>
                plannedMeals.some((m) => m.recipeId === r.recipeID)
              );
              // Gom nguyên liệu cần mua
              let missingIngredients = [];
              selectedRecipes.forEach((recipe) => {
                if (Array.isArray(recipe.ingredient_set)) {
                  recipe.ingredient_set.forEach((ing) => {
                    // Kiểm tra đã có trong tủ lạnh chưa
                    const inFridge = fridgeItems.some(
                      (item) =>
                        item.product_id === ing.product.productID ||
                        item.product_name?.toLowerCase() ===
                          ing.product.productName.toLowerCase()
                    );
                    if (!inFridge) {
                      missingIngredients.push({
                        name: ing.product.productName,
                        quantity: ing.quantity,
                        unit: ing.unit,
                        recipe: recipe.recipeName,
                        productID: ing.product.productID,
                      });
                    }
                  });
                }
              });
              if (plannedMeals.length === 0) {
                return (
                  <div
                    style={{ textAlign: "center", color: "#888", padding: 32 }}
                  >
                    <p>Thêm món ăn vào kế hoạch để xem danh sách nguyên liệu</p>
                  </div>
                );
              }
              if (missingIngredients.length === 0) {
                return (
                  <div
                    style={{ textAlign: "center", color: "#888", padding: 32 }}
                  >
                    <p>Bạn đã có đủ nguyên liệu cho các món ăn!</p>
                  </div>
                );
              }
              return (
                <>
                  <ul style={{ padding: 0, listStyle: "none" }}>
                    {missingIngredients.map((ing, idx) => {
                      const product = storeProducts.find(
                        (p) =>
                          p.productName.toLowerCase() ===
                            ing.name.toLowerCase() ||
                          p.productID === ing.productID
                      );
                      return (
                        <li key={idx} style={{ marginBottom: 16 }}>
                          {product ? (
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                              }}
                            >
                              <img
                                src={product.image || "/images/default.jpg"}
                                alt={product.productName}
                                style={{
                                  width: 48,
                                  height: 48,
                                  objectFit: "cover",
                                  borderRadius: 6,
                                }}
                              />
                              <div>
                                <div style={{ fontWeight: 600 }}>
                                  {product.productName}
                                </div>
                                <div style={{ fontSize: 13, color: "#888" }}>
                                  {ing.quantity} {ing.unit} - {ing.recipe}
                                </div>
                                <div style={{ fontSize: 13 }}>
                                  Giá:{" "}
                                  <b style={{ color: "#e11d48" }}>
                                    {Number(
                                      product.price || product.original_price
                                    ).toLocaleString()}
                                    đ
                                  </b>{" "}
                                  / {product.unit}
                                </div>
                                {product.description && (
                                  <div style={{ fontSize: 12, color: "#666" }}>
                                    {product.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span>
                              <b>{ing.name}</b> ({ing.quantity} {ing.unit}) -{" "}
                              <i>{ing.recipe}</i>
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <div style={{ textAlign: "right", marginTop: 16 }}>
                    <Button
                      type="primary"
                      onClick={() =>
                        handleCreateShoppingList(missingIngredients)
                      }
                    >
                      Tạo danh sách mua sắm
                    </Button>
                  </div>
                </>
              );
            })()}
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Hướng dẫn">
            <div style={{ fontSize: 15 }}>
              <div style={{ marginBottom: 12 }}>
                <b>Bước 1</b>
                <div style={{ color: "#888" }}>
                  Nhập tên và ngày bắt đầu cho kế hoạch của bạn
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <b>Bước 2</b>
                <div style={{ color: "#888" }}>
                  Thêm món ăn cho từng ngày và bữa ăn
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <b>Bước 3</b>
                <div style={{ color: "#888" }}>
                  Hệ thống sẽ tự động tính toán nguyên liệu cần mua
                </div>
              </div>
              <div>
                <b>Bước 4</b>
                <div style={{ color: "#888" }}>
                  Lưu kế hoạch để sử dụng và tạo danh sách mua sắm
                </div>
              </div>
            </div>
          </Card>
          <Card title="Mẫu kế hoạch" style={{ marginTop: 24 }}>
            <Button
              block
              icon={<CalendarOutlined />}
              style={{ marginBottom: 8 }}
            >
              Kế hoạch cơ bản
            </Button>
            <Button
              block
              icon={<CalendarOutlined />}
              style={{ marginBottom: 8 }}
            >
              Kế hoạch gia đình
            </Button>
            <Button block icon={<CalendarOutlined />}>
              Kế hoạch ăn kiêng
            </Button>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MealPlanNew;
