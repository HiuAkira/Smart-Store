import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Checkbox,
  message,
  Space,
  Divider,
  Radio,
} from "antd";
import {
  UserOutlined,
  MailOutlined,
  LockOutlined,
  UserAddOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import api from "../config/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../config/constants";

const { Title, Text } = Typography;

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const {
        confirmPassword: _confirmPassword,
        acceptTerms: _acceptTerms,
        ...registerData
      } = values;

      const response = await api.post("/api/register/", registerData);

      if (response.status === 201) {
        if (response.data.access && response.data.refresh) {
          localStorage.setItem(ACCESS_TOKEN, response.data.access);
          localStorage.setItem(REFRESH_TOKEN, response.data.refresh);
        }

        message.success({
          content: "Đăng ký thành công! Chào mừng bạn đến với ứng dụng.",
          duration: 3,
        });

        setTimeout(() => {
          navigate("/login");
        }, 1500);
      }
    } catch (err) {
      console.error("Registration error:", err);
      console.log(
        "Error response data:",
        JSON.stringify(err.response?.data, null, 2)
      ); // Debug log
      console.log("Error status:", err.response?.status); // Debug status

      // Kiểm tra các trường hợp lỗi email đã tồn tại
      const errorData = err.response?.data;
      const errorMessage = errorData?.message || errorData?.error || "";
      const emailErrors = errorData?.errors?.email || errorData?.email || [];

      // Kiểm tra lỗi email đã tồn tại với nhiều format khác nhau
      if (
        errorMessage.toLowerCase().includes("already exists") ||
        errorMessage.toLowerCase().includes("đã tồn tại") ||
        errorMessage.toLowerCase().includes("already registered") ||
        errorMessage.toLowerCase().includes("email already") ||
        (Array.isArray(emailErrors) &&
          emailErrors.some(
            (msg) =>
              msg.toLowerCase().includes("already") ||
              msg.toLowerCase().includes("tồn tại") ||
              msg.toLowerCase().includes("registered")
          )) ||
        err.response?.status === 409 || // Conflict status code
        err.response?.status === 400 // Bad Request - có thể là email đã tồn tại
      ) {
        message.error({
          content: "Email này đã được sử dụng. Vui lòng sử dụng email khác.",
          duration: 4,
        });
      } else if (Array.isArray(emailErrors) && emailErrors.length > 0) {
        // Hiển thị lỗi email cụ thể
        message.error({
          content: emailErrors[0],
          duration: 4,
        });
      } else {
        // Hiển thị lỗi chung
        message.error({
          content:
            errorMessage || "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.",
          duration: 4,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (_, value) => {
    if (!value) {
      return Promise.reject(new Error("Vui lòng nhập mật khẩu"));
    }
    if (value.length < 8) {
      return Promise.reject(new Error("Mật khẩu phải có ít nhất 8 ký tự"));
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      return Promise.reject(
        new Error("Mật khẩu phải chứa ít nhất 1 chữ thường, 1 chữ hoa và 1 số")
      );
    }
    return Promise.resolve();
  };

  const validateConfirmPassword = (_, value) => {
    if (!value) {
      return Promise.reject(new Error("Vui lòng xác nhận mật khẩu"));
    }
    if (value !== form.getFieldValue("password")) {
      return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
    }
    return Promise.resolve();
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f0f9ff 0%, #ecfdf5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
          borderRadius: 12,
        }}
        bodyStyle={{ padding: "40px 32px" }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              backgroundColor: "#f0f9ff",
              borderRadius: "50%",
              marginBottom: 16,
            }}
          >
            <UserAddOutlined style={{ fontSize: 32, color: "#1890ff" }} />
          </div>
          <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
            Đăng Ký
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Tạo tài khoản mới để bắt đầu sử dụng ứng dụng
          </Text>
        </div>

        <Form
          form={form}
          name="register"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
          <Form.Item
            name="name"
            label={
              <Space>
                <UserOutlined />
                <span>Họ và tên</span>
              </Space>
            }
            rules={[
              { required: true, message: "Vui lòng nhập họ và tên" },
              { min: 2, message: "Tên phải có ít nhất 2 ký tự" },
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Nhập họ và tên"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="email"
            label={
              <Space>
                <MailOutlined />
                <span>Email</span>
              </Space>
            }
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Nhập email của bạn"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="role"
            label={
              <Space>
                <TeamOutlined />
                <span>Vai trò</span>
              </Space>
            }
            rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="housekeeper">
                  <Space>
                    <span style={{ fontWeight: 500 }}>Nội trợ</span>
                    <Text type="secondary">
                      - Quản lý bữa ăn và công thức nấu ăn
                    </Text>
                  </Space>
                </Radio>
                <Radio value="member">
                  <Space>
                    <span style={{ fontWeight: 500 }}>Thành viên</span>
                    <Text type="secondary">
                      - Tham gia và sử dụng các tính năng cơ bản
                    </Text>
                  </Space>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="password"
            label={
              <Space>
                <LockOutlined />
                <span>Mật khẩu</span>
              </Space>
            }
            rules={[{ validator: validatePassword }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={
              <Space>
                <LockOutlined />
                <span>Xác nhận mật khẩu</span>
              </Space>
            }
            rules={[{ validator: validateConfirmPassword }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Nhập lại mật khẩu"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          <Form.Item
            name="acceptTerms"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject(
                        new Error("Bạn phải đồng ý với điều khoản sử dụng")
                      ),
              },
            ]}
          >
            <Checkbox>
              <Text style={{ fontSize: 14 }}>
                Tôi đồng ý với{" "}
                <Link
                  to="/terms"
                  style={{ color: "#1890ff", textDecoration: "none" }}
                >
                  điều khoản sử dụng
                </Link>{" "}
                và{" "}
                <Link
                  to="/privacy"
                  style={{ color: "#1890ff", textDecoration: "none" }}
                >
                  chính sách bảo mật
                </Link>
              </Text>
            </Checkbox>
          </Form.Item>

          <Form.Item style={{ marginBottom: 16 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{
                height: 48,
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              {loading ? "Đang đăng ký..." : "Đăng Ký"}
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: "24px 0" }} />

        <div style={{ textAlign: "center" }}>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              style={{
                color: "#1890ff",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Đăng nhập ngay
            </Link>
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Register;
