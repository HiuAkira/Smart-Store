import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import {
  LockOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone,
  SafetyOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import * as z from "zod";
import api from "../config/api";

const { Title, Text } = Typography;

const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(6, "Mật khẩu hiện tại phải có ít nhất 6 ký tự"),
    newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
    confirmPassword: z
      .string()
      .min(6, "Xác nhận mật khẩu phải có ít nhất 6 ký tự"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

const ChangePassword = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    // Validate bằng zod
    const result = changePasswordSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      Object.entries(fieldErrors).forEach(([field, errors]) => {
        if (errors && errors.length > 0) {
          form.setFields([{ name: field, errors }]);
        }
      });
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/change-password/", {
        current_password: values.currentPassword,
        new_password: values.newPassword,
      });
      message.success("Mật khẩu đã được thay đổi thành công!");
      navigate("/profile");
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Không thể thay đổi mật khẩu. Vui lòng kiểm tra lại.";
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "40px auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <SafetyOutlined style={{ fontSize: 32, color: "#1890ff" }} />
        <div>
          <Title level={2} style={{ margin: 0 }}>
            Đổi Mật Khẩu
          </Title>
          <Text type="secondary">Cập nhật mật khẩu để bảo mật tài khoản</Text>
        </div>
      </div>
      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label={
              <span>
                <LockOutlined /> Mật khẩu hiện tại
              </span>
            }
            name="currentPassword"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu hiện tại!" },
            ]}
          >
            <Input.Password
              placeholder="Nhập mật khẩu hiện tại"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            label={
              <span>
                <LockOutlined /> Mật khẩu mới
              </span>
            }
            name="newPassword"
            rules={[{ required: true, message: "Vui lòng nhập mật khẩu mới!" }]}
          >
            <Input.Password
              placeholder="Nhập mật khẩu mới"
              iconRender={(visible) =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
            />
          </Form.Item>

          <Form.Item
            label={
              <span>
                <LockOutlined /> Xác nhận mật khẩu mới
              </span>
            }
            name="confirmPassword"
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
            />
          </Form.Item>

          <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ flex: 1 }}
            >
              Cập Nhật Mật Khẩu
            </Button>
            <Button
              type="default"
              onClick={() => form.resetFields()}
              style={{ flex: 1 }}
            >
              Hủy
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default ChangePassword;
