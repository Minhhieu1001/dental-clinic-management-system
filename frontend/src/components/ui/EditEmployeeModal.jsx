import React, { useState, useRef, useEffect } from 'react';
import { X, UserRound, Mail, Phone, MapPin, Building2, Banknote, CalendarDays, Loader2, ImagePlus, User, Camera } from 'lucide-react';
import { updateUser, updateEmployee, getEmployeeById } from '../../services/employee.service';
import { getBranches } from '../../services/clinic.service';
import { uploadImage } from '../../services/media.service';
import { toast } from 'react-hot-toast';

export default function EditEmployeeModal({ isOpen, onClose, onSuccess, employee }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);
  const [userId, setUserId] = useState(null);
  const [fetchingUser, setFetchingUser] = useState(false);
  const [branches, setBranches] = useState([]);

  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      const timer = setTimeout(() => setActive(true), 20);
      document.body.style.overflow = 'hidden';
      return () => clearTimeout(timer);
    } else {
      setActive(false);
      const timer = setTimeout(() => setMounted(false), 250);
      document.body.style.overflow = 'unset';
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    address: '',
    position: 'RECEPTIONIST',
    salary: 5000000,
    hireDate: new Date().toISOString().split('T')[0],
    branchId: ''
  });

  // Populate form when employee data changes
  useEffect(() => {
    if (employee && isOpen) {
      setFormData({
        username: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        dateOfBirth: employee.dateOfBirth
          ? (typeof employee.dateOfBirth === 'string' ? employee.dateOfBirth.split('T')[0] : employee.dateOfBirth)
          : '',
        gender: employee.gender || 'MALE',
        address: employee.address || '',
        position: employee.originalRole || 'RECEPTIONIST',
        salary: employee.salary || 5000000,
        hireDate: employee.hireDate
          ? employee.hireDate.split('T')[0]
          : employee.createdAt
            ? employee.createdAt.split('T')[0]
            : new Date().toISOString().split('T')[0],
        branchId: employee.branchId || ''
      });
      setAvatarPreview(employee.avatar || null);
      setAvatarFile(null);
      setError(null);

      // Fetch the userId from the employee detail endpoint
      const fetchUserId = async () => {
        setFetchingUser(true);
        try {
          const detail = await getEmployeeById(employee.id);
          setUserId(detail.userId);
        } catch (err) {
          console.error('Failed to fetch employee detail:', err);
          setError('Không thể tải thông tin nhân viên. Vui lòng thử lại.');
        } finally {
          setFetchingUser(false);
        }
      };

      if (!employee.userId) {
        fetchUserId();
      } else {
        setUserId(employee.userId);
      }
    }
  }, [employee, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    getBranches()
      .then(setBranches)
      .catch((err) => {
        console.error('Failed to load branches:', err);
        setError('Không thể tải danh sách chi nhánh.');
      });
  }, [isOpen]);

  if (!mounted || !employee) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh hợp lệ');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = (e) => {
    e.stopPropagation();
    setAvatarFile(null);
    setAvatarPreview(employee.avatar || null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Upload avatar if provided
      let avatarUrl = employee.avatar;
      if (avatarFile) {
        const uploadResult = await uploadImage(avatarFile);
        avatarUrl = uploadResult.url || uploadResult.secure_url || uploadResult;
      }

      // 2. Update User Account
      if (userId) {
        const userRequest = {
          username: formData.username,
          email: formData.email,
          phone: formData.phone,
          avatarUrl: avatarUrl,
          role: employee.originalUserRole || 'EMPLOYEE',
          status: employee.statusUser || 'ACTIVE'
        };
        await updateUser(userId, userRequest);
      }

      // 3. Update Employee Profile
      const employeeRequest = {
        userId: userId,
        position: formData.position,
        salary: Number(formData.salary),
        hireDate: formData.hireDate + "T00:00:00",
        status: employee.status !== undefined ? employee.status : true,
        gender: formData.gender,
        address: formData.address,
        branchId: formData.branchId,
        dateOfBirth: formData.dateOfBirth || null
      };

      await updateEmployee(employee.id, employeeRequest);

      toast.success('Cập nhật nhân viên thành công!');
      await onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'
          }`}
        onClick={!loading ? onClose : undefined}
      />

      {/* Modal Content */}
      <div
        className={`relative w-full max-w-4xl rounded-lg bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 ease-out transform ${active ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 -translate-y-3'
          }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-white z-10">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Cập nhật hồ sơ nhân viên</h2>
            <p className="text-xs text-slate-500 mt-0.5">Chỉnh sửa thông tin tài khoản nhân viên</p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="overflow-y-auto p-6 bg-slate-50/50 flex-1">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          {fetchingUser ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-blue-500" />
              <p className="text-xs">Đang tải dữ liệu nhân viên...</p>
            </div>
          ) : (
            <form id="edit-employee-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Ảnh đại diện */}
              <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  <div className={`h-24 w-24 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${avatarPreview ? 'border-blue-500' : 'border-slate-300 hover:border-blue-400 bg-white'}`}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      <ImagePlus className="h-8 w-8 text-slate-400 group-hover:text-blue-500" />
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg border-2 border-white hover:bg-blue-700 transition-colors">
                    <Camera className="h-4 w-4" />
                  </div>
                  {avatarFile && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center shadow-xs hover:bg-red-600 cursor-pointer"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                <p className="mt-3 text-xs font-medium text-slate-600">Thay đổi ảnh đại diện</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Cột 1: Thông tin tài khoản */}
                <div className="space-y-5">
                  <h3 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">Thông tin tài khoản</h3>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Họ và tên <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        required
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all bg-white"
                        placeholder="Nguyễn Văn A"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Ngày sinh</label>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Email (Không thể thay đổi)</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        disabled
                        type="email"
                        name="email"
                        value={formData.email}
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs text-slate-500 outline-none transition-all bg-slate-50 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Số điện thoại <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        required
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all bg-white"
                        placeholder="0912345678"
                      />
                    </div>
                  </div>
                </div>

                {/* Cột 2: Thông tin công việc & cá nhân */}
                <div className="space-y-5">
                  <h3 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-2">Hồ sơ nhân sự</h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Vai trò <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select
                          name="position"
                          value={formData.position}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all bg-white cursor-pointer"
                        >
                          <option value="RECEPTIONIST">Lễ tân</option>
                          <option value="WAREHOUSE">Quản lý kho</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Giới tính <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all bg-white cursor-pointer"
                        >
                          <option value="MALE">Nam</option>
                          <option value="FEMALE">Nữ</option>
                          <option value="OTHER">Khác</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      Chi nhánh <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 py-2 px-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all bg-white cursor-pointer"
                    >
                      <option value="">-- Chọn chi nhánh --</option>
                      {branches.map((branch) => (
                        <option key={branch.branchId} value={branch.branchId}>
                          {branch.branchName} ({branch.branchCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Lương cơ bản (VNĐ)</label>
                      <div className="relative">
                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="number"
                          name="salary"
                          value={formData.salary}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all bg-white"
                          min="0"
                          step="100000"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-700">Ngày vào làm</label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="date"
                          name="hireDate"
                          value={formData.hireDate}
                          onChange={handleChange}
                          className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">Địa chỉ cư trú</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <textarea
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-4 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all bg-white min-h-[80px] resize-none"
                        placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-4 bg-white z-10 flex justify-end gap-3 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="edit-employee-form"
            disabled={loading || fetchingUser}
            className="inline-flex min-w-[130px] items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-xs font-semibold text-white shadow-2xs hover:bg-blue-700 transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
