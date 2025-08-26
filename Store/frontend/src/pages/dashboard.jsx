import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // States cho các thống kê
  const [fridgeStats, setFridgeStats] = useState({
    total_products: 0,
    expired_products: 0,
    expiring_soon_products: 0,
    popular_categories: [],
  });

  const [todayMeals, setTodayMeals] = useState({
    breakfast: null,
    lunch: null,
    dinner: null,
  });

  const [popularProducts, setPopularProducts] = useState([]);
  const [mealsLoading, setMealsLoading] = useState(true);
  const [mealsSource, setMealsSource] = useState("");

  // Lấy thông tin user từ localStorage
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem("user");
      let userId = 1;
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          userId = userObj.id || 1;
        } catch (parseError) {
          console.error("Error parsing user JSON:", parseError);
        }
      }

      // Lấy group ID từ selectedGroup thay vì từ user object
      const selectedGroup = localStorage.getItem("selectedGroup");
      let groupId = 1; // default fallback
      if (selectedGroup) {
        groupId = parseInt(selectedGroup) || 1;
      }

      return { userId: parseInt(userId), groupId: groupId };
    } catch (error) {
      console.error("Error getting user info:", error);
      return { userId: 1, groupId: 1 };
    }
  };

  // Fetch thống kê từ tủ lạnh
  const fetchFridgeStats = async () => {
    try {
      const { groupId } = getUserInfo();
      const response = await api.get("/api/fridge/", {
        params: { group_id: groupId },
      });

      if (response.data && response.data.stats) {
        setFridgeStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching fridge stats:", error);
      // Sử dụng dữ liệu mặc định nếu API lỗi
      setFridgeStats({
        total_products: 25,
        expired_products: 3,
        expiring_soon_products: 5,
        popular_categories: [{ categoryName: "Rau củ", totalQuantity: 15 }],
      });
    }
  };

  // Fetch kế hoạch bữa ăn hôm nay
  const fetchTodayMeals = async () => {
    setMealsLoading(true);
    try {
      const { groupId } = getUserInfo();
      const today = new Date();
      const todayString = today.toISOString().split("T")[0];

      // Lấy danh sách meal plans của group
      const response = await api.get("/api/meal-plans/", {
        params: {
          group_id: groupId,
        },
      });

      // Chỉ sử dụng dữ liệu meal plan của đúng group
      let dataToUse = response.data?.data || [];

      if (dataToUse.length > 0) {
        const allPlans = dataToUse;

        // Chỉ filter các meal plans của ngày hôm nay
        const todayPlans = allPlans.filter((plan) => {
          const planDate = new Date(plan.start_date);
          const planDateString = planDate.toISOString().split("T")[0];
          return planDateString === todayString;
        });

        // Nếu không có meal plans hôm nay, thử tìm meal plans gần nhất
        if (todayPlans.length === 0) {
          const availableDates = [
            ...new Set(allPlans.map((plan) => plan.start_date)),
          ].sort();

          // Để test, hãy thử lấy meal plan từ ngày gần nhất
          if (availableDates.length > 0) {
            const nearestPlans = allPlans.filter((plan) => {
              // Lấy plans từ ngày đầu tiên có sẵn để test
              return plan.start_date === availableDates[0];
            });

            if (nearestPlans.length > 0) {
              const meals = {
                breakfast: null,
                lunch: null,
                dinner: null,
              };

              // Xử lý meal plans từ ngày gần nhất
              for (const plan of nearestPlans) {
                try {
                  const detailResponse = await api.get(
                    `/api/meal-plans/${plan.planID}/`
                  );

                  if (detailResponse.data && detailResponse.data.success) {
                    const planDetail = detailResponse.data.data;

                    const mealName =
                      planDetail.recipes && planDetail.recipes.length > 0
                        ? planDetail.recipes[0].recipeName
                        : planDetail.plan_name || "Kế hoạch bữa ăn";

                    switch (planDetail.mealType) {
                      case "breakfast":
                      case "Bữa sáng":
                        if (!meals.breakfast) meals.breakfast = mealName;
                        break;
                      case "lunch":
                      case "Bữa trưa":
                        if (!meals.lunch) meals.lunch = mealName;
                        break;
                      case "dinner":
                      case "Bữa tối":
                        if (!meals.dinner) meals.dinner = mealName;
                        break;
                    }
                  }
                } catch (error) {
                  console.error(
                    `Error fetching plan detail ${plan.planID}:`,
                    error
                  );
                  // Fallback với plan name
                  const mealName = plan.plan_name || "Kế hoạch bữa ăn";

                  switch (plan.mealType) {
                    case "breakfast":
                    case "Bữa sáng":
                      if (!meals.breakfast) meals.breakfast = mealName;
                      break;
                    case "lunch":
                    case "Bữa trưa":
                      if (!meals.lunch) meals.lunch = mealName;
                      break;
                    case "dinner":
                    case "Bữa tối":
                      if (!meals.dinner) meals.dinner = mealName;
                      break;
                  }
                }
              }

              setTodayMeals(meals);
              setMealsSource(`Từ ngày ${availableDates[0]} (demo)`);
              return;
            }
          }
        }

        const meals = {
          breakfast: null,
          lunch: null,
          dinner: null,
        };

        if (todayPlans.length > 0) {
          // Lấy chi tiết từng meal plan và phân loại theo mealType
          const mealDetailPromises = todayPlans.map(async (plan) => {
            try {
              const detailResponse = await api.get(
                `/api/meal-plans/${plan.planID}/`
              );

              if (detailResponse.data && detailResponse.data.success) {
                const planDetail = detailResponse.data.data;

                // Lấy tên món ăn từ recipes hoặc plan_name
                const mealName =
                  planDetail.recipes && planDetail.recipes.length > 0
                    ? planDetail.recipes[0].recipeName
                    : planDetail.plan_name || "Kế hoạch bữa ăn";

                return {
                  mealType: planDetail.mealType,
                  mealName: mealName,
                };
              }
              return null;
            } catch (error) {
              console.error(
                `Error fetching plan detail ${plan.planID}:`,
                error
              );
              // Fallback sử dụng dữ liệu cơ bản
              return {
                mealType: plan.mealType,
                mealName: plan.plan_name || "Kế hoạch bữa ăn",
              };
            }
          });

          const mealDetails = await Promise.all(mealDetailPromises);

          // Phân loại meals theo loại bữa ăn
          mealDetails.forEach((meal) => {
            if (meal && meal.mealType && meal.mealName) {
              switch (meal.mealType) {
                case "breakfast":
                  meals.breakfast = meal.mealName;
                  break;
                case "lunch":
                  meals.lunch = meal.mealName;
                  break;
                case "dinner":
                  meals.dinner = meal.mealName;
                  break;
              }
            }
          });

          setTodayMeals(meals);
          setMealsSource("Kế hoạch hôm nay");
        } else {
          // Không có kế hoạch hôm nay
          setTodayMeals(meals);
          setMealsSource("Chưa có kế hoạch");
        }
      } else {
        // API không trả về dữ liệu hợp lệ
        setTodayMeals({
          breakfast: null,
          lunch: null,
          dinner: null,
        });
        setMealsSource("Chưa có kế hoạch");
      }
    } catch (error) {
      console.error("Error fetching today meals:", error);
      // API lỗi - hiển thị trạng thái chưa có kế hoạch
      setTodayMeals({
        breakfast: null,
        lunch: null,
        dinner: null,
      });
      setMealsSource("Lỗi tải dữ liệu");
    } finally {
      setMealsLoading(false);
    }
  };

  // Hàm tạo kế hoạch bữa ăn mới
  const handleCreateMealPlan = (mealType) => {
    const today = new Date().toISOString().split("T")[0];
    navigate(`/meal-planning?date=${today}&meal=${mealType}&action=create`);
  };

  // Fetch thông tin sản phẩm mua sắm phổ biến
  const fetchPopularProducts = async () => {
    try {
      const { groupId } = getUserInfo();
      const response = await api.get("/api/shopping-lists/", {
        params: { group_id: groupId },
      });

      if (response.data && Array.isArray(response.data)) {
        // Lấy các sản phẩm từ shopping lists để tính toán độ phổ biến
        const productFrequency = {};

        // Lấy chi tiết từng shopping list
        const detailPromises = response.data.slice(0, 5).map(async (list) => {
          try {
            const detailResponse = await api.get(
              `/api/shopping-lists/${list.listID}/`
            );
            console.log(detailResponse.data);
            return detailResponse.data.items || [];
          } catch (error) {
            console.error(`Error fetching list ${list.listID}:`, error);
            return [];
          }
        });

        const allItemsArrays = await Promise.all(detailPromises);
        const allItems = allItemsArrays.flat();

        // Đếm tần suất các sản phẩm
        allItems.forEach((item) => {
          const productName =
            item.product_details?.productName ||
            item.product?.productName ||
            item.productName ||
            "Sản phẩm";
          productFrequency[productName] =
            (productFrequency[productName] || 0) + 1;
        });

        // Chuyển đổi thành array và sắp xếp
        const sortedProducts = Object.entries(productFrequency)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4);

        if (sortedProducts.length > 0) {
          setPopularProducts(sortedProducts);
        } else {
          // Dữ liệu mặc định
          setPopularProducts([
            { name: "Thịt heo", count: 12 },
            { name: "Rau cải", count: 10 },
            { name: "Trứng gà", count: 8 },
            { name: "Gạo", count: 6 },
          ]);
        }
      }
    } catch (error) {
      console.error("Error fetching popular products:", error);
      // Dữ liệu mặc định nếu API lỗi
      setPopularProducts([
        { name: "Thịt heo", count: 12 },
        { name: "Rau cải", count: 10 },
        { name: "Trứng gà", count: 8 },
        { name: "Gạo", count: 6 },
      ]);
    }
  };

  // Load tất cả dữ liệu khi component mount
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError("");

      try {
        await Promise.all([
          fetchFridgeStats(),
          fetchTodayMeals(),
          fetchPopularProducts(),
        ]);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        setError("Có lỗi xảy ra khi tải dữ liệu dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Xin chào!</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Thống kê tổng quan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow border-l-4 border-yellow-500">
          <h3 className="text-sm text-gray-500 font-medium">
            Sản phẩm sắp hết hạn
          </h3>
          <p className="text-2xl font-bold text-yellow-600">
            {fridgeStats.expiring_soon_products}
          </p>
          <p className="text-xs text-gray-400 mt-1">Trong 1-2 ngày tới</p>
        </div>

        <div className="bg-white p-4 rounded shadow border-l-4 border-blue-500">
          <h3 className="text-sm text-gray-500 font-medium">Tổng sản phẩm</h3>
          <p className="text-2xl font-bold text-blue-600">
            {fridgeStats.total_products}
          </p>
          <p className="text-xs text-gray-400 mt-1">Trong tủ lạnh</p>
        </div>

        <div className="bg-white p-4 rounded shadow border-l-4 border-red-500">
          <h3 className="text-sm text-gray-500 font-medium">Đồ đã hết hạn</h3>
          <p className="text-2xl font-bold text-red-600">
            {fridgeStats.expired_products}
          </p>
          <p className="text-xs text-gray-400 mt-1">Cần xử lý ngay</p>
        </div>
      </div>

      {/* Thực đơn hôm nay */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Thực đơn hôm nay</h2>
          {mealsSource && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {mealsSource}
            </span>
          )}
        </div>

        {mealsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
            {["Bữa sáng", "Bữa trưa", "Bữa tối"].map((meal, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded border">
                <strong className="text-gray-600">{meal}</strong>
                <br />
                <div className="mt-2 h-4 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
            {/* Bữa sáng */}
            <div className="p-3 bg-orange-50 rounded border border-orange-200">
              <strong className="text-orange-700">Bữa sáng</strong>
              <br />
              {todayMeals.breakfast ? (
                <span className="text-gray-700">{todayMeals.breakfast}</span>
              ) : (
                <button
                  onClick={() => handleCreateMealPlan("breakfast")}
                  className="mt-2 flex items-center justify-center w-full h-8 border-2 border-dashed border-orange-300 rounded text-orange-500 hover:bg-orange-100 transition-colors"
                  title="Tạo kế hoạch bữa sáng"
                >
                  <span className="text-2xl">+</span>
                </button>
              )}
            </div>

            {/* Bữa trưa */}
            <div className="p-3 bg-blue-50 rounded border border-blue-200">
              <strong className="text-blue-700">Bữa trưa</strong>
              <br />
              {todayMeals.lunch ? (
                <span className="text-gray-700">{todayMeals.lunch}</span>
              ) : (
                <button
                  onClick={() => handleCreateMealPlan("lunch")}
                  className="mt-2 flex items-center justify-center w-full h-8 border-2 border-dashed border-blue-300 rounded text-blue-500 hover:bg-blue-100 transition-colors"
                  title="Tạo kế hoạch bữa trưa"
                >
                  <span className="text-2xl">+</span>
                </button>
              )}
            </div>

            {/* Bữa tối */}
            <div className="p-3 bg-purple-50 rounded border border-purple-200">
              <strong className="text-purple-700">Bữa tối</strong>
              <br />
              {todayMeals.dinner ? (
                <span className="text-gray-700">{todayMeals.dinner}</span>
              ) : (
                <button
                  onClick={() => handleCreateMealPlan("dinner")}
                  className="mt-2 flex items-center justify-center w-full h-8 border-2 border-dashed border-purple-300 rounded text-purple-500 hover:bg-purple-100 transition-colors"
                  title="Tạo kế hoạch bữa tối"
                >
                  <span className="text-2xl">+</span>
                </button>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => navigate("/meal-planning")}
          className="mt-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          📅 Xem kế hoạch bữa ăn
        </button>
      </div>

      {/* Mua sắm thường xuyên */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-lg font-semibold mb-2">Mua sắm thường xuyên</h2>
        <p className="text-sm text-gray-500 mb-4">
          Các sản phẩm được mua nhiều nhất
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {popularProducts.map((item, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded border">
              <div className="text-sm font-medium mb-2">{item.name}</div>
              <div className="relative">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-green-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (item.count / (popularProducts[0]?.count || 1)) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {item.count} lần
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => navigate("/shopping-list")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            🛍️ Xem danh sách mua sắm
          </button>
          <button
            onClick={() => navigate("/fridge")}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            ❄️ Quản lý tủ lạnh
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
