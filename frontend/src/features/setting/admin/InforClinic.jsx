import { useState, useRef } from 'react';
import {
  Building2,
  Building,
  Edit3,
  Save,
  X,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  UserCheck,
  FileText,
  Calendar,
  Sparkles,
  Check,
  Globe,
  Hash,
  Upload,
  ImagePlus,
  Trash2,
  Camera,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadImage } from '../../../services/media.service';

export default function InforClinic({ clinicInfo, onUpdateClinic, branchCount = 0, isSaving = false }) {
  const [isEditing, setIsEditing] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [formData, setFormData] = useState({
    ...clinicInfo,
    logo: clinicInfo?.logo || clinicInfo?.logoUrl || '',
    image: clinicInfo?.image || '',
  });

  const logoFileInputRef = useRef(null);
  const imageFileInputRef = useRef(null);

  const handleStartEdit = () => {
    setFormData({
      ...clinicInfo,
      logo: clinicInfo?.logo || clinicInfo?.logoUrl || '',
      image: clinicInfo?.image || '',
    });
    setLogoFile(null);
    setImageFile(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFormData({
      ...clinicInfo,
      logo: clinicInfo?.logo || clinicInfo?.logoUrl || '',
      image: clinicInfo?.image || '',
    });
    setLogoFile(null);
    setImageFile(null);
    setIsEditing(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước logo không được vượt quá 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh hợp lệ');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoFile(file);
        setFormData((prev) => ({
          ...prev,
          logo: reader.result,
          logoUrl: reader.result,
        }));
        toast.success('Đã tải logo nha khoa từ thiết bị!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormData((prev) => ({
      ...prev,
      logo: '',
      logoUrl: '',
    }));
    setLogoFile(null);
    if (logoFileInputRef.current) logoFileInputRef.current.value = '';
  };

  const handleImageChange = (e) => {
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
        setImageFile(file);
        setFormData((prev) => ({
          ...prev,
          image: reader.result,
        }));
        toast.success('Đã tải ảnh phòng khám từ thiết bị!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      image: '',
    }));
    setImageFile(null);
    if (imageFileInputRef.current) imageFileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!(formData.brandName || '').trim()) {
      toast.error('Vui lòng nhập tên thương hiệu nha khoa!');
      return;
    }
    let logoUrl = formData.logoUrl || formData.logo || '';
    let image = formData.image || '';
    try {
      if (logoFile) logoUrl = await uploadImage(logoFile);
      if (imageFile) image = await uploadImage(imageFile);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tải ảnh lên Cloudinary thất bại');
      return;
    }

    const updated = {
      ...formData,
      logoUrl,
      image,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    const saved = await onUpdateClinic(updated);
    if (saved !== false) {
      setIsEditing(false);
    }
  };

  const fallbackClinicImage =
    'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1200&q=80';

  return (
    <div className="rounded border border-slate-300 bg-white shadow-2xs overflow-hidden transition-all">
      {/* Top Header Bar - Đồng bộ màu với banner ở trên */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-gradient-to-r from-teal-950 via-teal-900 to-slate-900 text-white px-6 py-4 border-b border-teal-800/80">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded bg-teal-800 text-teal-200 border border-teal-600 shadow-xs transition-transform duration-300 hover:scale-105">
            <Building size={22} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-lg font-black text-white tracking-tight sm:text-xl">
                Hồ Sơ Doanh Nghiệp Nha Khoa
              </h2>
              {isEditing ? (
                <span className="inline-flex items-center gap-1 rounded bg-amber-400/20 px-2.5 py-0.5 text-xs font-bold text-amber-200 border border-amber-400/30 animate-pulse">
                  <Edit3 size={12} /> Đang Chỉnh Sửa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-200 border border-emerald-400/30">
                  <ShieldCheck size={14} /> Tiêu Chuẩn Bộ Y Tế
                </span>
              )}
            </div>
            <p className="text-xs text-teal-100/80 mt-0.5">
              Đơn vị quản lý mạng lưới chuỗi gồm <strong className="text-white font-black">{branchCount} cơ sở chi nhánh</strong>.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div>
          {isEditing ? (
            <div className="flex items-center gap-2 animate-fadeIn">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded border border-white/20 bg-slate-800/90 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white active:scale-95 transition-all duration-200 cursor-pointer"
              >
                <X size={15} /> Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded bg-teal-600 hover:bg-teal-500 active:scale-95 px-5 py-2 text-xs font-bold text-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {isSaving ? 'Đang lưu...' : 'Lưu Hồ Sơ'}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartEdit}
              className="inline-flex items-center gap-2 rounded bg-teal-700 hover:bg-teal-600 active:scale-95 px-4 py-2.5 text-xs font-bold text-white shadow-xs border border-teal-500/30 hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <Edit3 size={15} /> Chỉnh Sửa Hồ Sơ
            </button>
          )}
        </div>
      </div>

      {/* Main Content with smooth animation */}
      <div className="transition-all duration-300 ease-in-out">
        {isEditing ? (
          /* Edit Form - Góc nhọn, Chữ to rõ, hiệu ứng mượt mà */
          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 text-sm animate-fadeIn">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Mã Phòng Khám <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.clinicCode}
                  readOnly
                  className="w-full cursor-not-allowed rounded border border-slate-300 bg-slate-100 px-3.5 py-2.5 text-sm font-bold text-slate-500 uppercase outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Tên Thương Hiệu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Tên Pháp Lý Đầy Đủ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.legalName}
                  onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Mã Số Thuế <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Giấy Phép Hoạt Động <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessLicenseNo}
                  onChange={(e) => setFormData({ ...formData, businessLicenseNo: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Đại Diện Pháp Luật
                </label>
                <input
                  type="text"
                  value={formData.representative}
                  onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Hotline Tổng Đài <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-bold text-teal-900 outline-none focus:border-teal-700 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Email Tiếp Nhận <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                  required
                />
              </div>

              {/* Tải Logo Thương Hiệu từ máy */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Logo Thương Hiệu
                </label>
                <input
                  type="file"
                  ref={logoFileInputRef}
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />

                {formData.logo ? (
                  <div className="flex items-center gap-3 rounded border border-slate-300 bg-white p-2.5 shadow-2xs">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-50 flex items-center justify-center p-1">
                      <img
                        src={formData.logo}
                        alt="Logo Preview"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">Logo nha khoa</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          className="text-xs font-bold text-teal-800 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Upload size={12} /> Đổi logo
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="text-xs font-bold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => logoFileInputRef.current?.click()}
                    className="flex items-center gap-2.5 rounded border border-dashed border-slate-300 bg-white p-2.5 hover:border-teal-700 hover:bg-teal-50/20 transition-all cursor-pointer group"
                  >
                    <div className="h-9 w-9 shrink-0 rounded bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center text-slate-500 group-hover:text-teal-800 transition-colors">
                      <Camera size={16} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-teal-800 group-hover:underline block">
                        Chọn logo từ máy tính
                      </span>
                      <p className="text-[10px] text-slate-400">PNG, JPG, SVG (Max 5MB)</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Tải Hình Ảnh Phòng Khám từ máy */}
              <div>
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Hình Ảnh Phòng Khám
                </label>
                <input
                  type="file"
                  ref={imageFileInputRef}
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />

                {formData.image ? (
                  <div className="flex items-center gap-3 rounded border border-slate-300 bg-white p-2.5 shadow-2xs">
                    <div className="h-12 w-20 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-50">
                      <img
                        src={formData.image}
                        alt="Ảnh Bìa Preview"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">Ảnh đại diện nha khoa</p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => imageFileInputRef.current?.click()}
                          className="text-xs font-bold text-teal-800 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Upload size={12} /> Đổi ảnh
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="text-xs font-bold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => imageFileInputRef.current?.click()}
                    className="flex items-center gap-2.5 rounded border border-dashed border-slate-300 bg-white p-2.5 hover:border-teal-700 hover:bg-teal-50/20 transition-all cursor-pointer group"
                  >
                    <div className="h-9 w-9 shrink-0 rounded bg-slate-100 group-hover:bg-teal-100 flex items-center justify-center text-slate-500 group-hover:text-teal-800 transition-colors">
                      <ImagePlus size={16} />
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-teal-800 group-hover:underline block">
                        Chọn ảnh cơ sở từ máy
                      </span>
                      <p className="text-[10px] text-slate-400">JPG, PNG, WEBP (Max 10MB)</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Trụ Sở Chính Đăng Ký <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.registeredAddress || ''}
                  onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-slate-50/50 px-3.5 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                  required
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-bold text-slate-800 mb-1.5 text-xs uppercase tracking-wider">
                  Mô Tả Giới Thiệu
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded border border-slate-300 bg-slate-50/50 p-3.5 text-sm text-slate-900 outline-none focus:border-teal-700 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="rounded border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 hover:bg-slate-100 active:scale-95 transition-all duration-200 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded bg-teal-700 hover:bg-teal-600 active:scale-95 px-6 py-2 text-sm font-bold text-white shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Đang lưu...' : 'Lưu Thông Tin'}
              </button>
            </div>
          </form>
        ) : (
          /* Visual Overview - Bo góc nhọn, chữ to rõ, hiệu ứng mượt mà */
          <div className="p-6 md:p-8 animate-fadeIn">
            <div className="grid gap-6 lg:grid-cols-12 items-center">
              {/* Left Photo Showcase (5 Cols) - Bo góc nhọn */}
              <div className="lg:col-span-5 relative h-80 rounded border border-slate-300 overflow-hidden shadow-2xs group bg-slate-900">
                <img
                  src={clinicInfo.image || fallbackClinicImage}
                  alt={clinicInfo.brandName}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = fallbackClinicImage;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

              </div>

              {/* Right Information Grid (7 Cols) - Chữ to rõ ràng */}
              <div className="lg:col-span-7 space-y-4 text-sm">
                <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded border border-slate-200 bg-slate-50 p-1">
                    {(clinicInfo.logo || clinicInfo.logoUrl) ? (
                      <img
                        src={clinicInfo.logo || clinicInfo.logoUrl}
                        alt="Logo phòng khám"
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <Building size={24} className="text-slate-300" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Thông tin nhận diện
                    </span>
                    <h3 className="truncate text-xl font-black text-slate-900">
                      {clinicInfo.brandName || 'Chưa cập nhật tên thương hiệu'}
                    </h3>
                    <p className="truncate text-xs font-medium text-slate-500">
                      {clinicInfo.legalName || 'Chưa cập nhật tên pháp lý'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-xs tracking-wider flex items-center gap-1.5">
                      <Hash size={14} className="text-teal-700" /> Mã phòng khám
                    </span>
                    <p className="font-black text-slate-900">{clinicInfo.clinicCode || 'Chưa cập nhật'}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-xs tracking-wider flex items-center gap-1.5">
                      <FileText size={14} className="text-teal-700" /> Mã số thuế
                    </span>
                    <p className="font-bold text-slate-900">{clinicInfo.taxCode || 'Chưa cập nhật'}</p>
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <span className="font-bold text-slate-500 uppercase text-xs tracking-wider flex items-center gap-1.5">
                      <Building size={14} className="text-teal-700" /> Tên pháp lý
                    </span>
                    <p className="font-bold text-slate-900">
                      {clinicInfo.legalName || 'Chưa cập nhật'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-xs tracking-wider flex items-center gap-1.5">
                      <MapPin size={14} className="text-teal-700" /> Trụ sở chính đăng ký
                    </span>
                    <p className="font-bold text-slate-900 leading-relaxed text-sm">
                      {clinicInfo.registeredAddress}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-xs tracking-wider flex items-center gap-1.5">
                      <Phone size={14} className="text-teal-700" /> Hotline & Email
                    </span>
                    <p className="font-black text-teal-800 text-base">{clinicInfo.phoneNumber}</p>
                    <p className="text-xs text-slate-600 font-medium">{clinicInfo.email}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-xs tracking-wider flex items-center gap-1.5">
                      <Award size={14} className="text-teal-700" /> Pháp lý & Giấy phép
                    </span>
                    <p className="font-bold text-slate-900 text-sm">{clinicInfo.businessLicenseNo}</p>
                    <p className="text-xs text-slate-600 font-semibold">Mã số thuế: {clinicInfo.taxCode}</p>
                  </div>

                  <div className="space-y-1">
                    <span className="font-bold text-slate-500 uppercase text-xs tracking-wider flex items-center gap-1.5">
                      <UserCheck size={14} className="text-teal-700" /> Đại diện pháp luật
                    </span>
                    <p className="font-bold text-slate-900 text-sm">
                      {clinicInfo.representative || 'Chưa cập nhật'}
                    </p>
                    <p className="text-xs text-slate-500">
                      Ngày thành lập: {clinicInfo.createdAt || '2018-06-15'}
                    </p>
                  </div>
                </div>

              </div>
            </div>

            <div className="rounded border border-slate-200 bg-slate-50 p-4 text-sm mt-2">
              <span className="font-bold text-slate-600 uppercase text-xs tracking-wider block mb-1">
                Giới thiệu tổng quan hệ thống
              </span>
              <p className="text-slate-800 leading-relaxed">
                {clinicInfo.description || 'Chưa có thông tin mô tả giới thiệu nha khoa.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
