"use client";

import React, { useState } from "react";
import { Plus, Trash2, Edit3, X, CheckCircle, AlertCircle, Home, Key } from "lucide-react";
import { createRoom, updateRoom, deleteRoom } from "@/actions/rooms";

interface RoomItem {
  id: string;
  name: string;
  capacity?: number | null;
  createdAt: Date;
}

interface RoomManagementProps {
  rooms: RoomItem[];
}

export default function RoomManagement({ rooms }: RoomManagementProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [capacity, setCapacity] = useState("");

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await createRoom(formData);

    if (res.success) {
      setSuccessMsg(res.message || "Tạo phòng học thành công.");
      e.currentTarget.reset();
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Tạo phòng học thất bại.");
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingRoom) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("capacity", capacity);

    const res = await updateRoom(editingRoom.id, formData);

    if (res.success) {
      setSuccessMsg(res.message || "Cập nhật thành công.");
      setIsEditOpen(false);
      setEditingRoom(null);
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Cập nhật thất bại.");
    }
  };

  const handleDelete = async (id: string, roomName: string) => {
    if (!confirm(`Bạn có chắc muốn xoá phòng học ${roomName}?`)) return;
    setSuccessMsg(null);
    setErrorMsg(null);

    const res = await deleteRoom(id);
    if (res.success) {
      setSuccessMsg(res.message || "Xoá thành công.");
      window.location.reload();
    } else {
      setErrorMsg(res.error || "Xoá thất bại.");
    }
  };

  const openEditModal = (room: RoomItem) => {
    setEditingRoom(room);
    setName(room.name);
    setCapacity(room.capacity ? room.capacity.toString() : "");
    setIsEditOpen(true);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Alert status */}
      <div className="lg:col-span-3">
        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 flex items-center gap-3 text-sm">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 flex items-center gap-3 text-sm">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Left List */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div>
          <h1 className="font-tagline text-2xl font-semibold text-ink">Quản lý phòng học</h1>
          <p className="font-caption text-ink-muted-80 mt-1">Danh mục các phòng học/phòng chức năng của trung tâm</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
            <h2 className="font-body-strong text-sm text-ink flex items-center gap-2">
              <Home className="h-4 w-4 text-primary" />
              Tổng số phòng học ({rooms.length} phòng)
            </h2>
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hairline bg-surface-pearl text-[11px] font-caption-strong text-ink-muted-48 uppercase">
                <th className="text-left px-6 py-3">Tên phòng</th>
                <th className="text-center px-6 py-3">Sức chứa tối đa</th>
                <th className="text-center px-6 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hairline">
              {rooms.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center text-ink-muted-80">
                    Chưa có phòng học nào được tạo.
                  </td>
                </tr>
              ) : (
                rooms.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-pearl/50">
                    <td className="px-6 py-4 font-semibold text-ink">{r.name}</td>
                    <td className="px-6 py-4 text-center">
                      {r.capacity ? `${r.capacity} học viên` : "Không giới hạn"}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(r)}
                          className="text-primary hover:bg-blue-50 p-2 rounded-full transition-colors"
                          title="Sửa phòng học"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.name)}
                          className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                          title="Xoá phòng học"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Right Create Form */}
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="font-tagline text-lg font-semibold text-ink">Thêm phòng học mới</h2>
          <p className="font-caption text-ink-muted-80 mt-1">Khai báo phòng học mới</p>
        </div>

        <div className="bg-canvas border border-hairline rounded-lg p-6 shadow-sm">
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Tên phòng học</label>
              <input
                type="text"
                name="name"
                placeholder="Phòng 301, Studio, Lab..."
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-caption-strong text-ink-muted-80">Sức chứa tối đa (Học viên)</label>
              <input
                type="number"
                name="capacity"
                placeholder="Ví dụ: 30, 40..."
                className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
              />
            </div>

            <button
              type="submit"
              className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold transition-colors shadow-sm w-full mt-4 flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="h-4 w-4" />
              Thêm phòng học
            </button>
          </form>
        </div>
      </div>

      {/* UPDATE MODAL WITH FIXED SIZE */}
      {isEditOpen && editingRoom && (
        <div className="fixed inset-0 bg-ink-muted-48 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-canvas border border-hairline rounded-lg w-[450px] shadow-product flex flex-col overflow-hidden animate-fade-in">
            <div className="px-6 py-4 border-b border-hairline bg-surface-pearl flex items-center justify-between">
              <h3 className="font-tagline text-base font-semibold text-ink">
                Cập nhật phòng học: {editingRoom.name}
              </h3>
              <button 
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingRoom(null);
                }} 
                className="text-ink-muted-48 hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Tên phòng học</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Phòng 301..."
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-caption-strong text-ink-muted-80">Sức chứa tối đa</label>
                <input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Không giới hạn"
                  className="bg-canvas border border-hairline rounded-pill px-4 py-2.5 h-10 text-sm text-ink outline-none focus:border-primary-focus w-full"
                />
              </div>

              <button
                type="submit"
                className="bg-primary hover:bg-primary-focus text-white px-6 py-2.5 rounded-pill font-body font-semibold transition-colors w-full mt-4 text-sm"
              >
                Lưu thay đổi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
