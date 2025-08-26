import React, { useState, useEffect } from "react";
import { Button, Input, Modal, Form, Table, Tag, message } from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../config/api";

const DataManagement = () => {
  const [categories, setCategories] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // Lấy danh sách loại thực phẩm từ API
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/api/categories/");
      setCategories(
        res.data.map((cat) => [cat.categoryID, { name: cat.categoryName }])
      );
    } catch {
      message.error("Không thể tải danh sách loại thực phẩm");
    }
  };

  const handleAddCategory = () => {
    form.validateFields().then(async (values) => {
      try {
        await api.post("/api/categories/", { categoryName: values.name });
        message.success("Đã thêm loại thực phẩm mới");
        setIsAddModalOpen(false);
        form.resetFields();
        fetchCategories();
      } catch {
        message.error("Thêm loại thực phẩm thất bại");
      }
    });
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    editForm.setFieldsValue({
      key: category[0],
      name: category[1].name,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCategory = () => {
    editForm.validateFields().then(async (values) => {
      try {
        await api.put(`/api/categories/${editingCategory[0]}/`, {
          categoryName: values.name,
        });
        message.success("Đã cập nhật loại thực phẩm");
        setIsEditModalOpen(false);
        setEditingCategory(null);
        fetchCategories();
      } catch {
        message.error("Cập nhật loại thực phẩm thất bại");
      }
    });
  };

  const handleDeleteCategory = (key) => {
    Modal.confirm({
      title: "Xác nhận xóa",
      content: "Bạn có chắc chắn muốn xóa loại thực phẩm này?",
      okText: "Xóa",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await api.delete(`/api/categories/${key}/`);
          message.success("Đã xóa loại thực phẩm");
          fetchCategories();
        } catch {
          message.error("Xóa loại thực phẩm thất bại");
        }
      },
    });
  };

  const columns = [
    {
      title: "Mã loại",
      dataIndex: "key",
      key: "key",
    },
    {
      title: "Tên loại",
      dataIndex: "name",
      key: "name",
      render: (text) => <span style={{ fontWeight: 500 }}>{text}</span>,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <span style={{ display: "flex", gap: 8 }}>
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() =>
              handleEditCategory([
                record.key,
                {
                  name: record.name,
                },
              ])
            }
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDeleteCategory(record.key)}
          />
        </span>
      ),
    },
  ];

  const dataSource = categories.map(([key, category]) => ({
    key, // categoryID
    name: category.name,
  }));

  return (
    <div style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 20, fontWeight: 600 }}>
          Danh sách loại thực phẩm
        </h3>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Thêm loại mới
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        bordered
      />

      {/* Modal thêm loại */}
      <Modal
        title="Thêm loại thực phẩm mới"
        open={isAddModalOpen}
        onCancel={() => setIsAddModalOpen(false)}
        onOk={handleAddCategory}
        okText="Thêm"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Tên loại"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên loại" }]}
          >
            <Input placeholder="vd: Rau củ" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal chỉnh sửa loại */}
      <Modal
        title="Chỉnh sửa loại thực phẩm"
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        onOk={handleUpdateCategory}
        okText="Cập nhật"
        cancelText="Hủy"
      >
        <Form form={editForm} layout="vertical">
          <Form.Item label="Mã loại" name="key">
            <Input disabled />
          </Form.Item>
          <Form.Item
            label="Tên loại"
            name="name"
            rules={[{ required: true, message: "Vui lòng nhập tên loại" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataManagement;
