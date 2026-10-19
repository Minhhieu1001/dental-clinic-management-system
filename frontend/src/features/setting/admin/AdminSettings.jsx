import { useEffect, useState } from 'react';
import { Layers, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Loading from '../../../components/ui/Loading';

import InforClinic from './InforClinic.jsx';
import InforBranch from './InforBranch.jsx';
import ActionBranch from './action/ActionBranch.jsx';
import {
  createBranch,
  createClinic,
  deleteBranch,
  getClinics,
  updateBranch,
  updateClinic,
} from '../../../services/clinic.service.js';

const EMPTY_CLINIC = {
  clinicId: '',
  clinicCode: '',
  brandName: '',
  legalName: '',
  taxCode: '',
  businessLicenseNo: '',
  establishedYear: '',
  representative: '',
  phoneNumber: '',
  email: '',
  logoUrl: '',
  registeredAddress: '',
  description: '',
  image: '',
  branches: [],
};

const normalizeBranch = (branch) => ({
  ...branch,
  openTime: branch.openTime?.slice(0, 5) || '08:00',
  closeTime: branch.closeTime?.slice(0, 5) || '20:00',
});

const normalizeClinic = (clinic) => ({
  ...EMPTY_CLINIC,
  ...clinic,
  clinicId: clinic.clinicId || '',
  clinicCode: clinic.clinicCode || `CLN-${Date.now().toString().slice(-6)}`,
  brandName: clinic.brandName || '',
  legalName: clinic.legalName || '',
  taxCode: clinic.taxCode || '',
  businessLicenseNo: clinic.businessLicenseNo || '',
  representative: clinic.representative || '',
  phoneNumber: clinic.phoneNumber || '',
  email: clinic.email || '',
  logoUrl: clinic.logoUrl || '',
  registeredAddress: clinic.registeredAddress || '',
  description: clinic.description || '',
  image: clinic.image || '',
});

export default function AdminSettings() {
  const [clinicInfo, setClinicInfo] = useState(EMPTY_CLINIC);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [branchToDelete, setBranchToDelete] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadClinicData = async () => {
      try {
        const clinics = await getClinics();
        const clinic = normalizeClinic(clinics?.[0] || EMPTY_CLINIC);
        if (isMounted) {
          setClinicInfo(clinic);
          setBranches((clinic.branches || []).map(normalizeBranch));
        }
      } catch (error) {
        if (isMounted) {
          toast.error(error.response?.data?.message || 'Không thể tải thông tin phòng khám');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadClinicData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdateClinic = async (clinicData) => {
    setProcessingAction('clinic');
    try {
      const payload = {
        clinicCode: clinicData.clinicCode,
        brandName: clinicData.brandName,
        legalName: clinicData.legalName,
        taxCode: clinicData.taxCode,
        businessLicenseNo: clinicData.businessLicenseNo,
        establishedYear: clinicData.establishedYear ? Number(clinicData.establishedYear) : null,
        representative: clinicData.representative,
        phoneNumber: clinicData.phoneNumber,
        email: clinicData.email,
        logoUrl: clinicData.logoUrl || clinicData.logo || null,
        registeredAddress: clinicData.registeredAddress,
        description: clinicData.description,
        image: clinicData.image,
      };
      const savedClinic = clinicInfo.clinicId
        ? await updateClinic(clinicInfo.clinicId, payload)
        : await createClinic(payload);
      setClinicInfo(normalizeClinic(savedClinic));
      setBranches((savedClinic.branches || branches).map(normalizeBranch));
      toast.success('Đã lưu thông tin nha khoa thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu thông tin phòng khám');
      return false;
    } finally {
      setProcessingAction(null);
    }
  };

  const handleSaveBranch = async (branchData) => {
    setProcessingAction(editingBranch ? 'branch-update' : 'branch-create');
    try {
      const payload = {
        clinicId: clinicInfo.clinicId,
        branchCode: branchData.branchCode,
        branchName: branchData.branchName,
        phoneNumber: branchData.phoneNumber,
        email: branchData.email,
        address: branchData.address,
        openTime: branchData.openTime,
        closeTime: branchData.closeTime,
        imageBranch: branchData.imageBranch,
        status: branchData.status,
      };
      const savedBranch = editingBranch
        ? await updateBranch(editingBranch.branchId, payload)
        : await createBranch(payload);
      const normalized = {
        ...normalizeBranch(savedBranch),
      };
      setBranches((current) =>
        editingBranch
          ? current.map((branch) =>
            branch.branchId === editingBranch.branchId
              ? { ...branch, ...normalized }
              : branch
          )
          : [...current, normalized]
      );
      setIsBranchModalOpen(false);
      setEditingBranch(null);
      toast.success(editingBranch ? 'Đã cập nhật chi nhánh thành công!' : 'Đã thêm chi nhánh thành công!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể lưu chi nhánh');
      return false;
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDeleteBranch = async (branchId) => {
    const target = branches.find((branch) => branch.branchId === branchId);
    if (!target) return;
    setBranchToDelete(target);
  };

  const confirmDeleteBranch = async () => {
    if (!branchToDelete) return;
    try {
      setProcessingAction('branch-delete');
      await deleteBranch(branchToDelete.branchId);
      setBranches((current) => current.filter((branch) => branch.branchId !== branchToDelete.branchId));
      setBranchToDelete(null);
      toast.success('Đã xóa chi nhánh thành công!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xóa chi nhánh');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleToggleStatus = (branchId) => {
    const target = branches.find((branch) => branch.branchId === branchId);
    if (!target) return;
    handleSaveBranch({
      ...target,
      status: target.status === 'ACTIVE' ? 'MAINTENANCE' : 'ACTIVE',
    });
  };

  if (isLoading) {
    return <Loading title="Đang tải thông tin phòng khám..." subtitle="Vui lòng đợi trong giây lát" />;
  }

  return (
    <div className="space-y-6 pb-12">
      {processingAction && (
        <Loading
          fullscreen
          title="Đang xử lý dữ liệu..."
          subtitle="Vui lòng không đóng trang hoặc thao tác lại"
        />
      )}
      {/* PHẦN 1: THÔNG TIN NHA KHOA (CLINIC) */}
      <InforClinic
        clinicInfo={clinicInfo}
        onUpdateClinic={handleUpdateClinic}
        branchCount={branches.length}
        isSaving={processingAction === 'clinic'}
      />

      {/* Đường nối trực quan */}
      <div className="flex items-center gap-3 px-2">
        <div className="h-px flex-1 bg-slate-200" />
        <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-slate-400">
          <Layers size={14} className="text-teal-700" />
          <span>Mạng Lưới Chi Nhánh Cơ Sở Thuộc {clinicInfo.brandName}</span>
        </div>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      {/* PHẦN 2: DANH SÁCH CÁC CHI NHÁNH (BRANCHES) */}
      <InforBranch
        branches={branches}
        isProcessing={Boolean(processingAction)}
        canCreateBranch={Boolean(clinicInfo.clinicId)}
        onOpenAddModal={() => {
          if (!clinicInfo.clinicId) return;
          setEditingBranch(null);
          setIsBranchModalOpen(true);
        }}
        onOpenEditModal={(branch) => {
          setEditingBranch(branch);
          setIsBranchModalOpen(true);
        }}
        onDeleteBranch={handleDeleteBranch}
        onToggleStatus={handleToggleStatus}
      />

      {/* MODAL THAO TÁC CHI NHÁNH */}
      <ActionBranch
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onSave={handleSaveBranch}
        isSaving={processingAction === 'branch-create' || processingAction === 'branch-update'}
        editingBranch={editingBranch}
        clinicInfo={clinicInfo}
      />

      {branchToDelete && !processingAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs animate-fadeIn"
          onClick={(event) => {
            if (event.target === event.currentTarget) setBranchToDelete(null);
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl animate-scaleUp">
            <div className="border-b border-rose-100 bg-gradient-to-r from-rose-50 to-white px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                  <Trash2 size={18} />
                </div>
                <h3 className="text-lg font-black text-slate-900">Xác nhận xóa chi nhánh</h3>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm leading-relaxed text-slate-600">
              Bạn có chắc chắn muốn xóa chi nhánh{' '}
              <strong className="text-slate-900">{branchToDelete.branchName}</strong> không?
              Thao tác này không thể hoàn tác.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
              <button
                type="button"
                onClick={() => setBranchToDelete(null)}
                className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition-all duration-200 hover:bg-slate-100 active:scale-95"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmDeleteBranch}
                className="rounded bg-rose-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-rose-700 hover:shadow-md active:scale-95"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
