import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../config/api";

const Statistics = () => {
  const [fridgeStats, setFridgeStats] = useState(null);
  const [shoppingStats, setShoppingStats] = useState(null);
  const [mealPlanStats, setMealPlanStats] = useState(null);
  const [categoryStats, setCategoryStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const groupId = Number(localStorage.getItem("selectedGroup"));

        // Lấy thống kê tủ lạnh
        const fridgeResponse = await api.get(
          `/api/fridge/?group_id=${groupId}`
        );
        setFridgeStats(fridgeResponse.data.stats);

        // Lấy thống kê danh sách mua sắm
        const purchasedStatsResponse = await api.get(
          `/api/shopping-lists/purchased-shopping-stats/?group_id=${groupId}`
        );
        setShoppingStats({
          totalItems: purchasedStatsResponse.data.total_items,
          totalQuantity: purchasedStatsResponse.data.total_quantity,
          totalPrice: purchasedStatsResponse.data.total_price,
        });
        // Lấy thống kê kế hoạch bữa ăn
        const mealPlanResponse = await api.get(
          `/api/meal-plans/?group_id=${groupId}`
        );
        setMealPlanStats({
          totalPlans: mealPlanResponse.data.data.length,
          todayPlans: mealPlanResponse.data.data.filter(
            (plan) =>
              new Date(plan.start_date).toDateString() ===
              new Date().toDateString()
          ).length,
        });

        // Lấy thống kê theo danh mục và tính phần trăm
        const categoryStatsResponse = await api.get(
          `/api/shopping-lists/purchased-stats-by-category/?group_id=${groupId}`
        );
        const rawData = categoryStatsResponse.data;
        const total = rawData.reduce((sum, item) => sum + item.value, 0);
        const percentData = rawData.map((item) => ({
          ...item,
          value: total > 0 ? (item.value / total) * 100 : 0,
        }));
        setCategoryStats(percentData);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu thống kê:", error);
        setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-lg">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Thống kê</h1>

      <div className="grid grid-cols-2 gap-6">
        {/* Thống kê tủ lạnh */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Thống kê tủ lạnh</h2>
          {fridgeStats && (
            <div className="space-y-2">
              <p>Tổng số sản phẩm: {fridgeStats.total_products}</p>
              <p>Sản phẩm hết hạn: {fridgeStats.expired_products}</p>
              <p>Sản phẩm sắp hết hạn: {fridgeStats.expiring_soon_products}</p>
            </div>
          )}
        </div>

        {/* Thống kê danh sách mua sắm */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Thống kê mua sắm</h2>
          {shoppingStats && (
            <div className="space-y-2">
              <p>
                Tổng giá trị:{" "}
                {shoppingStats.totalPrice?.toLocaleString("vi-VN", {
                  style: "currency",
                  currency: "VND",
                })}
              </p>
              <p>Tổng số lượng mua: {shoppingStats.totalItems}</p>
            </div>
          )}
        </div>

        {/* Thống kê kế hoạch bữa ăn */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">
            Thống kê kế hoạch bữa ăn
          </h2>
          {mealPlanStats && (
            <div className="space-y-2">
              <p>Tổng số kế hoạch: {mealPlanStats.totalPlans}</p>
              <p>Kế hoạch hôm nay: {mealPlanStats.todayPlans}</p>
            </div>
          )}
        </div>

        {/* Biểu đồ chi tiêu theo danh mục */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-lg font-semibold mb-2">Chi tiêu theo danh mục</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryStats}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
              >
                {categoryStats.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
