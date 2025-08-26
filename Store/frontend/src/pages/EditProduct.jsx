import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Upload, X } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../config/api";

const EditProduct = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    original_price: 0,
    discount: 0,
    category: "",
    shelfLife: 30,
    unit: "kg",
    image: null,
  });
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [message, setMessage] = useState("");

  const units = [
    "kg",
    "g",
    "lít",
    "ml",
    "cái",
    "gói",
    "hộp",
    "túi",
    "lon",
    "chai",
    "vỉ",
    "bó",
  ];

  useEffect(() => {
    // Lấy danh sách categories từ backend
    const fetchCategories = async () => {
      try {
        const res = await api.get("/api/categories/");
        setCategories(res.data);
      } catch (error) {
        console.error("Lỗi khi lấy danh mục:", error);
      }
    };

    // Lấy thông tin sản phẩm hiện tại
    const fetchProduct = async () => {
      try {
        setLoadingProduct(true);
        const res = await api.get(`/api/products/${id}/`);
        const product = res.data;

        setFormData({
          name: product.productName,
          description: product.description || "",
          original_price: product.original_price,
          discount: product.discount,
          category: product.category,
          shelfLife: product.shelfLife,
          unit: product.unit,
          image: null, // Reset image field
        });

        setCurrentImageUrl(product.image || "");
        setImagePreview(product.image || "");
      } catch (error) {
        console.error("Lỗi khi lấy thông tin sản phẩm:", error);
        setMessage("Không thể tải thông tin sản phẩm!");
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchCategories();
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setImagePreview(currentImageUrl); // Quay về ảnh gốc
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (
      !formData.name ||
      !formData.description ||
      formData.original_price <= 0 ||
      !formData.category
    ) {
      setMessage("Vui lòng điền đầy đủ thông tin sản phẩm!");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const submitData = new FormData();
      submitData.append("productName", formData.name);
      submitData.append("description", formData.description);
      submitData.append("original_price", formData.original_price);
      submitData.append("discount", formData.discount);
      submitData.append("category", formData.category);
      submitData.append("shelfLife", formData.shelfLife);
      submitData.append("unit", formData.unit);

      // Chỉ append image nếu có file mới
      if (formData.image) {
        submitData.append("image", formData.image);
      }

      const response = await api.put(`/api/products/${id}/`, submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Cập nhật sản phẩm thành công!");
      setTimeout(() => {
        navigate("/store");
      }, 1500);
    } catch (error) {
      console.error("Lỗi khi cập nhật sản phẩm:", error);
      setMessage(
        error.response?.data?.message || "Có lỗi xảy ra khi cập nhật sản phẩm!"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link
            to="/store"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft size={20} />
            Quay lại cửa hàng
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Chỉnh sửa sản phẩm
          </h1>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-md ${
              message.includes("thành công")
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {message}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Hình ảnh sản phẩm
              </label>
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG, GIF tối đa 10MB
                  </p>
                </div>
                {imagePreview && (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-20 h-20 object-cover rounded-md border"
                    />
                    {formData.image && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Product Name */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Tên sản phẩm *
              </label>
              <input
                type="text"
                placeholder="Nhập tên sản phẩm..."
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Mô tả sản phẩm *
              </label>
              <textarea
                placeholder="Mô tả chi tiết về sản phẩm..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Category */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Danh mục *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option
                      key={category.categoryID}
                      value={category.categoryID}
                    >
                      {category.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Đơn vị *
                </label>
                <select
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {units.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Original Price */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Giá gốc (VNĐ) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  value={formData.original_price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      original_price: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Discount */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Giảm giá (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="0"
                  value={formData.discount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Shelf Life */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Hạn sử dụng (ngày) *
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="30"
                  value={formData.shelfLife}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      shelfLife: parseInt(e.target.value) || 30,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Price Preview */}
            {formData.original_price > 0 && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">
                  Xem trước giá bán:
                </h3>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    Giá gốc: {formData.original_price.toLocaleString()}đ
                  </p>
                  {formData.discount > 0 && (
                    <>
                      <p className="text-sm text-gray-600">
                        Giảm giá: {formData.discount}%
                      </p>
                      <p className="text-lg font-semibold text-green-600">
                        Giá bán:{" "}
                        {(
                          formData.original_price *
                          (1 - formData.discount / 100)
                        ).toLocaleString()}
                        đ
                      </p>
                      <p className="text-sm text-green-600">
                        Tiết kiệm:{" "}
                        {(
                          formData.original_price *
                          (formData.discount / 100)
                        ).toLocaleString()}
                        đ
                      </p>
                    </>
                  )}
                  {formData.discount === 0 && (
                    <p className="text-lg font-semibold text-gray-900">
                      Giá bán: {formData.original_price.toLocaleString()}đ
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-md transition duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang cập nhật...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Cập nhật sản phẩm
                  </>
                )}
              </button>
              <Link
                to="/store"
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition duration-200 flex items-center justify-center"
              >
                Hủy
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditProduct;
