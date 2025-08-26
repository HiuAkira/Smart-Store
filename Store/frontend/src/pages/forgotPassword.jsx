import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import {
  MailOutlined,
  ArrowLeftOutlined,
  KeyOutlined,
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
} from "@ant-design/icons";
import { useNavigate, Link } from "react-router-dom";
import * as z from "zod";
import api from "../config/api";

const { Title, Text } = Typography;

const resetPasswordSchema = z
  .object({
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z
      .string()
      .min(6, "Xác nhận mật khẩu phải có ít nhất 6 ký tự"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState("email"); // email | otp | reset
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Step 1: Gửi email
  const [form] = Form.useForm();
  const onEmailSubmit = async (values) => {
    setLoading(true);
    try {
      await api.post("/api/password-reset/", { email: values.email });
      setEmail(values.email);
      message.success(
        "Đã gửi mã OTP đặt lại mật khẩu. Vui lòng kiểm tra email."
      );
      setStep("otp");
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể gửi mã OTP. Vui lòng thử lại."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Xác thực OTP
  const [otpForm] = Form.useForm();
  const onOTPSubmit = async (values) => {
    setOtp(values.otp);
    setStep("reset");
    message.success("Mã OTP hợp lệ. Vui lòng nhập mật khẩu mới.");
  };

  // Step 3: Đặt lại mật khẩu
  const [resetForm] = Form.useForm();
  const onResetSubmit = async (values) => {
    const result = resetPasswordSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      Object.entries(fieldErrors).forEach(([field, errors]) => {
        if (errors && errors.length > 0) {
          resetForm.setFields([{ name: field, errors }]);
        }
      });
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/password-reset/confirm/", {
        email,
        otp,
        new_password: values.newPassword,
      });
      message.success("Mật khẩu đã được đặt lại thành công!");
      navigate("/login");
    } catch (err) {
      message.error(
        err.response?.data?.message || "Không thể đặt lại mật khẩu."
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === "email") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e0f2fe 0%, #e8f5e8 100%)",
        }}
      >
        <Card style={{ width: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <KeyOutlined style={{ fontSize: 32, color: "#1890ff" }} />
            <Title level={3} style={{ margin: 0 }}>
              Quên Mật Khẩu
            </Title>
            <Text type="secondary">
              Nhập email của bạn để nhận mã OTP đặt lại mật khẩu
            </Text>
          </div>
          <Form form={form} layout="vertical" onFinish={onEmailSubmit}>
            <Form.Item
              name="email"
              label={
                <span>
                  <MailOutlined /> Email
                </span>
              }
              rules={[
                { required: true, message: "Vui lòng nhập email" },
                { type: "email", message: "Email không hợp lệ" },
              ]}
            >
              <Input placeholder="Nhập email của bạn" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Gửi Mã OTP
            </Button>
          </Form>
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Link to="/login">
              <ArrowLeftOutlined /> Quay lại đăng nhập
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e0f2fe 0%, #e8f5e8 100%)",
        }}
      >
        <Card style={{ width: 400 }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <KeyOutlined style={{ fontSize: 32, color: "#1890ff" }} />
            <Title level={3} style={{ margin: 0 }}>
              Xác Thực OTP
            </Title>
            <Text type="secondary">
              Nhập mã OTP đã được gửi đến email của bạn
            </Text>
          </div>
          <Form form={otpForm} layout="vertical" onFinish={onOTPSubmit}>
            <Form.Item
              name="otp"
              label="Mã OTP"
              rules={[{ required: true, message: "Vui lòng nhập mã OTP" }]}
            >
              <Input placeholder="Nhập mã OTP từ email" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Xác Thực
            </Button>
          </Form>
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Button type="link" onClick={() => setStep("email")}>
              {" "}
              <ArrowLeftOutlined /> Quay lại nhập email{" "}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e0f2fe 0%, #e8f5e8 100%)",
      }}
    >
      <Card style={{ width: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <LockOutlined style={{ fontSize: 32, color: "#1890ff" }} />
          <Title level={3} style={{ margin: 0 }}>
            Đặt Lại Mật Khẩu
          </Title>
          <Text type="secondary">Nhập mật khẩu mới cho tài khoản {email}</Text>
        </div>
        <Form form={resetForm} layout="vertical" onFinish={onResetSubmit}>
          <Form.Item
            name="newPassword"
            label={
              <span>
                <LockOutlined /> Mật khẩu mới
              </span>
            }
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới!" }]}
          >
            <Input.Password
              placeholder="Nhập mật khẩu mới"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              type={showNewPassword ? "text" : "password"}
              onClick={() => setShowNewPassword(!showNewPassword)}
            />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            label={
              <span>
                <LockOutlined /> Xác nhận mật khẩu mới
              </span>
            }
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Vui lòng xác nhận mật khẩu mới!" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("Mật khẩu xác nhận không khớp!")
                  );
                },
              }),
            ]}
          >
            <Input.Password
              placeholder="Nhập lại mật khẩu mới"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              type={showConfirmPassword ? "text" : "password"}
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            Đặt Lại Mật Khẩu
          </Button>
        </Form>
        <div style={{ marginTop: 24, textAlign: "center" }}>
          <Button type="link" onClick={() => setStep("otp")}>
            {" "}
            <ArrowLeftOutlined /> Quay lại nhập mã OTP{" "}
          </Button>
          <Link to="/login" style={{ marginLeft: 8 }}>
            <ArrowLeftOutlined /> Quay lại đăng nhập
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default ForgotPassword;
