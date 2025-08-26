import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  message,
  Space,
  Divider,
} from "antd";
import { MailOutlined, LockOutlined, LoginOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import api from "../config/api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../config/constants";

const { Title, Text } = Typography;

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await api.post("/api/token/", values);

      if (response.status === 200) {
        // Lưu thông tin người dùng vào localStorage
        localStorage.setItem("user", JSON.stringify(response.data.user));
        localStorage.setItem(ACCESS_TOKEN, response.data.access);
        localStorage.setItem(REFRESH_TOKEN, response.data.refresh);

        message.success({
          content: "Đăng nhập thành công! Chào mừng bạn quay trở lại.",
          duration: 3,
        });

        if (onLogin) onLogin(); // Gọi callback cập nhật trạng thái từ App.jsx

        setTimeout(() => {
          navigate("/select-group"); // Chuyển hướng về trang chọn nhóm
        }, 1000);
      }
    } catch (err) {
      // Xử lý lỗi trả về từ backend
      const errors = err.response?.data || {};
      let fieldErrors = [];
      if (errors.email) {
        fieldErrors.push({ name: "email", errors: [errors.email] });
      }
      if (errors.password) {
        fieldErrors.push({ name: "password", errors: [errors.password] });
      }
      if (fieldErrors.length > 0) {
        form.setFields(fieldErrors);
      }
      message.error({
        content: errors.message || "Email hoặc mật khẩu không chính xác.",
        duration: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #e0f2fe 0%, #e8f5e8 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <Card
        style={{
          width: "100%",
          maxWidth: 420,
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
              backgroundColor: "#e6f7ff",
              borderRadius: "50%",
              marginBottom: 16,
            }}
          >
            <LoginOutlined style={{ fontSize: 32, color: "#1890ff" }} />
          </div>
          <Title level={2} style={{ margin: 0, color: "#1f2937" }}>
            Đăng Nhập
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Đăng nhập vào tài khoản của bạn để tiếp tục
          </Text>
        </div>

        <Form
          form={form}
          name="login"
          onFinish={onFinish}
          layout="vertical"
          size="large"
          requiredMark={false}
        >
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
            name="password"
            label={
              <Space>
                <LockOutlined />
                <span>Mật khẩu</span>
              </Space>
            }
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#bfbfbf" }} />}
              placeholder="Nhập mật khẩu"
              style={{ borderRadius: 8 }}
            />
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
              {loading ? "Đang đăng nhập..." : "Đăng Nhập"}
            </Button>
          </Form.Item>
        </Form>

        <Divider style={{ margin: "24px 0" }} />

        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <Text type="secondary" style={{ fontSize: 14 }}>
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              style={{
                color: "#1890ff",
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Đăng ký ngay
            </Link>
          </Text>
        </div>

        <div style={{ textAlign: "center" }}>
          <Link
            to="/forgot-password"
            style={{
              color: "#1890ff",
              fontSize: 14,
              textDecoration: "none",
            }}
          >
            Quên mật khẩu?
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Login;
