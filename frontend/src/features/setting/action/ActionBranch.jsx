import { useState, useEffect, useRef } from 'react';
import {
  Building2,
  X,
  Save,
  Clock,
  Phone,
  Mail,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Hash,
  Upload,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../../services/media.service';

export default function ActionBranch({ isOpen, onClose, onSave, editingBranch, clinicInfo }) {
  const [formData, setFormData] = useState({
    branchId: '',
    branchCode: `CN-${Date.now().toString().slice(-6)}`,
    branchName: '',
    phoneNumber: '',
    email: '',
    address: '',
    openTime: '08:00',
    closeTime: '20:00',
    imageBranch: '',
    status: 'ACTIVE', // ACTIVE | MAINTENANCE | CLOSED
    dentalChairs: 8,
  });
  const [branchImageFile, setBranchImageFile] = useState(null);

  const branchFileInputRef = useRef(null);

  const handleBranchImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Kích thước ảnh không được vượt quá 10MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh hợp lệ');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranchImageFile(file);
        setFormData((prev) => ({
          ...prev,
          imageBranch: reader.result,
        }));
        toast.success('Đã tải ảnh chi nhánh từ thiết bị!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBranchImage = (e) => {
    e.stopPropagation();
    setFormData((prev) => ({
      ...prev,
      imageBranch: '',
    }));
    setBranchImageFile(null);
    if (branchFileInputRef.current) branchFileInputRef.current.value = '';
  };

  useEffect(() => {
    setBranchImageFile(null);
    if (editingBranch) {
      setFormData({
        branchId: editingBranch.branchId || '',
        branchCode: editingBranch.branchCode || '',
        branchName: editingBranch.branchName || '',
        phoneNumber: editingBranch.phoneNumber || '',
        email: editingBranch.email || '',
        address: editingBranch.address || '',
        openTime: (editingBranch.openTime || '08:00').slice(0, 5),
        closeTime: (editingBranch.closeTime || '20:00').slice(0, 5),
        imageBranch: editingBranch.imageBranch || '',
        status: editingBranch.status || 'ACTIVE',
        dentalChairs: editingBranch.dentalChairs || 8,
      });
    } else {
      const autoNum = Math.floor(10 + Math.random() * 90);
      setFormData({
        branchId: `br-${Date.now()}`,
        branchCode: `CN-${Date.now().toString().slice(-6)}`,
        branchName: '',
        phoneNumber: '',
        email: '',
        address: '',
        openTime: '08:00',
        closeTime: '20:00',
        imageBranch:
          'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=600&q=80',
        status: 'ACTIVE',
        dentalChairs: 8,
      });
    }
  }, [editingBranch, isOpen]);

  // Hỗ trợ bấm phím ESC để đóng modal mượt mà
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.branchCode.trim()) {
      toast.error('Vui lòng nhập mã chi nhánh (branchCode)!');
      return;
    }
    if (!formData.branchName.trim()) {
      toast.error('Vui lòng nhập tên chi nhánh (branchName)!');
      return;
    }
    if (!formData.phoneNumber.trim()) {
      toast.error('Vui lòng nhập số điện thoại chi nhánh!');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('Vui lòng nhập địa chỉ cơ sở!');
      return;
    }

    let imageBranch = formData.imageBranch;
    if (branchImageFile) {
      try {
        imageBranch = await uploadImage(branchImageFile);
      } catch (error) {
        toast.error(error.response?.data?.message || 'Tải ảnh lên Cloudinary thất bại');
        return;
      }
    }

    await onSave({
      ...formData,
      imageBranch,
      branchId: formData.branchId || `br-${Date.now()}`,
      dentalChairs: Number(formData.dentalChairs) || 1,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 md:p-8 backdrop-blur-xs overflow-y-auto animate-fadeIn transition-opacity duration-300"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-5xl rounded border border-slate-300 bg-white shadow-2xl overflow-hidden my-auto animate-scaleUp transition-all duration-300">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-slate-50 via-teal-50/20 to-slate-50 px-8 py-4.5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded bg-gradient-to-br from-teal-800 to-teal-950 text-white shadow-xs ring-4 ring-teal-800/10 transition-transform duration-300 hover:scale-105">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black text-slate-900 sm:text-xl tracking-tight">
                  {editingBranch ? 'Cập Nhật Thông Tin Chi Nhánh' : 'Khởi Tạo Chi Nhánh Mới'}
                </h3>
                <span className="rounded bg-teal-100 px-2.5 py-0.5 text-xs font-black text-teal-900 border border-teal-200">
                  ERP Branch System
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                <span>Trực thuộc:</span>
                <strong className="text-slate-900 font-bold">{clinicInfo?.brandName || 'Crown Dental'}</strong>
                <span className="text-slate-300">•</span>
                <span>Mạng lưới cơ sở phòng khám</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-300 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 hover:rotate-90 transition-all duration-300 cursor-pointer"
            title="Đóng (ESC)"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body Form - Mở rộng to ngang, 2 cột cân đối, hiệu ứng mượt mà */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
            {/* CỘT TRÁI: Nhận diện & Liên hệ */}
            <div className="rounded border border-slate-200 bg-slate-50/50 p-5 space-y-4 transition-all duration-200 hover:border-slate-300">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/80">
                <Building2 size={16} className="text-teal-800" />
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-950">
                  Thông Tin Nhận Diện & Liên Hệ
                </h4>
              </div>

              {/* Mã & Tên chi nhánh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs uppercase tracking-wider">
                    Mã Chi Nhánh <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="VD: CN-01"
                      value={formData.branchCode}
                      readOnly
                      className="w-full cursor-not-allowed rounded border border-slate-300 bg-slate-100 px-3.5 py-2.5 text-sm font-bold text-slate-500 uppercase outline-none"
                    />
                    <Hash size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs uppercase tracking-wider">
                    Tên Chi Nhánh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Cơ sở Phố Huế"
                    value={formData.branchName}
                    onChange={(e) => setFormData({ ...formData, branchName: e.target.value })}
                    className="w-full rounded border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none transition-all duration-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                    required
                  />
                </div>
              </div>

              {/* Hotline & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs uppercase tracking-wider">
                    Hotline Chi Nhánh <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="024.7300.8888"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full rounded border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none transition-all duration-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                      required
                    />
                    <Phone size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs uppercase tracking-wider">
                    Email Chi Nhánh
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      placeholder="phohue@crowndental.vn"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full rounded border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition-all duration-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                    />
                    <Mail size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Địa chỉ cơ sở */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs uppercase tracking-wider">
                  Địa Chỉ Cơ Sở <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="328 Phố Huế, P. Phố Huế, Q. Hai Bà Trưng, Hà Nội"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full rounded border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition-all duration-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                    required
                  />
                  <MapPin size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: Vận hành, Ghế khám & Hình ảnh */}
            <div className="rounded border border-slate-200 bg-slate-50/50 p-5 space-y-4 transition-all duration-200 hover:border-slate-300">
              <div className="flex items-center gap-2 pb-2.5 border-b border-slate-200/80">
                <Clock size={16} className="text-teal-800" />
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-950">
                  Thời Gian Hoạt Động & Cơ Sở Vật Chất
                </h4>
              </div>

              {/* Giờ mở cửa & Giờ đóng cửa */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs uppercase tracking-wider">
                    Giờ Mở Cửa
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formData.openTime}
                      onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                      className="w-full rounded border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none transition-all duration-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs uppercase tracking-wider">
                    Giờ Đóng Cửa
                  </label>
                  <div className="relative">
                    <input
                      type="time"
                      value={formData.closeTime}
                      onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                      className="w-full rounded border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none transition-all duration-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                    />
                  </div>
                </div>
              </div>

              {/* Số ghế điều trị & Trạng thái */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs uppercase tracking-wider">
                    Số Ghế Điều Trị
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={formData.dentalChairs}
                    onChange={(e) => setFormData({ ...formData, dentalChairs: e.target.value })}
                    className="w-full rounded border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-teal-900 outline-none transition-all duration-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5 text-xs uppercase tracking-wider">
                    Trạng Thái Vận Hành
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full rounded border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none transition-all duration-200 focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15 cursor-pointer"
                  >
                    <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                    <option value="MAINTENANCE">Bảo trì (MAINTENANCE)</option>
                    <option value="CLOSED">Ngừng hoạt động (CLOSED)</option>
                  </select>
                </div>
              </div>

              {/* Hình ảnh cơ sở - Tải từ máy tính */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5 text-xs uppercase tracking-wider">
                  Hình Ảnh Cơ Sở
                </label>
                <input
                  type="file"
                  ref={branchFileInputRef}
                  accept="image/*"
                  onChange={handleBranchImageChange}
                  className="hidden"
                />

                {formData.imageBranch ? (
                  <div className="flex items-center gap-3.5 rounded border border-slate-300 bg-white p-2.5 shadow-2xs">
                    <div className="h-14 w-24 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100">
                      <img
                        src={formData.imageBranch}
                        alt="Preview chi nhánh"
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">Ảnh cơ sở đã tải lên</p>
                      <p className="text-[11px] text-slate-500">Hiển thị trên thẻ chi nhánh hệ thống</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        <button
                          type="button"
                          onClick={() => branchFileInputRef.current?.click()}
                          className="text-xs font-bold text-teal-800 hover:text-teal-950 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Upload size={12} /> Đổi ảnh từ máy
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={handleRemoveBranchImage}
                          className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => branchFileInputRef.current?.click()}
                    className="flex items-center justify-center gap-3 rounded border border-dashed border-slate-300 bg-white p-3.5 hover:border-teal-700 hover:bg-teal-50/20 transition-all cursor-pointer text-center group"
                  >
                    <div className="h-9 w-9 rounded bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center text-slate-500 group-hover:text-teal-800 transition-colors">
                      <ImagePlus size={18} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-teal-800 group-hover:underline block">
                        Chọn ảnh cơ sở từ máy tính
                      </span>
                      <p className="text-[11px] text-slate-400">Hỗ trợ JPG, PNG, WEBP (Tối đa 10MB)</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-300 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded bg-teal-700 px-6 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-teal-800 hover:shadow-md active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <Save size={16} />
                <span>{editingBranch ? 'Lưu Thay Đổi' : 'Thêm Chi Nhánh'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
