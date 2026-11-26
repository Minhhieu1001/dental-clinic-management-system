import { useCallback, useEffect, useState } from 'react';
import { Edit3, Plus, RefreshCw, Settings2, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  createPrimaryDiagnosis,
  createToothStatus,
  deletePrimaryDiagnosis,
  deleteToothStatus,
  getPrimaryDiagnoses,
  getToothStatuses,
  updatePrimaryDiagnosis,
  updateToothStatus,
} from '../../../services/systemDictionary.service.js';

const EMPTY_DIAGNOSIS = {
  primaryDiagnosisName: '',
  status: true,
};

const EMPTY_TOOTH_STATUS = {
  toothCode: '',
  label: '',
  color: '#94A3B8',
};

const getErrorMessage = (error, fallback) =>
  error?.response?.data?.message || fallback;

function SectionHeader({ title, description, onAdd, onRefresh, loading }) {
  return (
    <div className="flex min-h-28 flex-col justify-between gap-3 border-b border-slate-200 pb-4">
      <div className="min-w-0">
        <h2 className="text-base font-black text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-xs text-slate-500">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Làm mới
        </button>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800"
        >
          <Plus size={14} />
          Thêm mới
        </button>
      </div>
    </div>
  );
}

function DictionaryModal({ type, item, onClose, onSaved }) {
  const isDiagnosis = type === 'diagnosis';
  const [form, setForm] = useState(() =>
    isDiagnosis
      ? { ...EMPTY_DIAGNOSIS, ...(item || {}) }
      : { ...EMPTY_TOOTH_STATUS, ...(item || {}) }
  );
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(item?.id);

  const handleChange = (event) => {
    const { name, value, type: inputType, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: inputType === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (isDiagnosis) {
        const payload = {
          primaryDiagnosisName: form.primaryDiagnosisName.trim(),
          status: Boolean(form.status),
        };
        if (!payload.primaryDiagnosisName) {
          toast.error('Tên chẩn đoán không được để trống');
          return;
        }
        await (isEdit
          ? updatePrimaryDiagnosis(item.id, payload)
          : createPrimaryDiagnosis(payload));
      } else {
        const payload = {
          toothCode: form.toothCode.trim().toUpperCase(),
          label: form.label.trim(),
          color: form.color,
        };
        if (!payload.toothCode || !payload.label || !payload.color) {
          toast.error('Vui lòng nhập đầy đủ thông tin trạng thái răng');
          return;
        }
        await (isEdit
          ? updateToothStatus(item.id, payload)
          : createToothStatus(payload));
      }
      toast.success(isEdit ? 'Đã cập nhật thành công' : 'Đã thêm mới thành công');
      await onSaved();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể lưu dữ liệu'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-base font-black text-slate-900">
            {isEdit ? 'Cập nhật' : 'Thêm'} {isDiagnosis ? 'chẩn đoán chính' : 'tình trạng răng'}
          </h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {isDiagnosis ? (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Tên chẩn đoán chính
                </label>
                <input
                  name="primaryDiagnosisName"
                  value={form.primaryDiagnosisName}
                  onChange={handleChange}
                  placeholder="Ví dụ: K02.1 - Sâu ngà răng"
                  className="w-full rounded border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-700"
                  autoFocus
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  name="status"
                  checked={Boolean(form.status)}
                  onChange={handleChange}
                  className="h-4 w-4 accent-teal-700"
                />
                Đang sử dụng
              </label>
            </>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Mã tình trạng
                </label>
                <input
                  name="toothCode"
                  value={form.toothCode}
                  onChange={handleChange}
                  placeholder="Ví dụ: CARIES"
                  className="w-full rounded border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-teal-700"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Tên tình trạng
                </label>
                <input
                  name="label"
                  value={form.label}
                  onChange={handleChange}
                  placeholder="Ví dụ: Sâu răng"
                  className="w-full rounded border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-teal-700"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Màu hiển thị
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                    className="h-10 w-14 cursor-pointer rounded border border-slate-300 bg-white p-1"
                  />
                  <input
                    name="color"
                    value={form.color}
                    onChange={handleChange}
                    className="flex-1 rounded border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none focus:border-teal-700"
                  />
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">
              Hủy
            </button>
            <button type="submit" disabled={saving} className="rounded bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-50">
              {saving ? 'Đang lưu...' : 'Lưu dữ liệu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SystemDictionaryManagement() {
  const [diagnoses, setDiagnoses] = useState([]);
  const [toothStatuses, setToothStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [diagnosisData, statusData] = await Promise.all([
        getPrimaryDiagnoses(),
        getToothStatuses(),
      ]);
      setDiagnoses(Array.isArray(diagnosisData?.data) ? diagnosisData.data : []);
      setToothStatuses(Array.isArray(statusData?.data) ? statusData.data : []);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể tải danh mục hệ thống'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  const handleDelete = async (type, item) => {
    const label = type === 'diagnosis' ? item.primaryDiagnosisName : item.label;
    if (!window.confirm(`Bạn có chắc muốn xóa "${label}" không?`)) return;
    try {
      if (type === 'diagnosis') {
        await deletePrimaryDiagnosis(item.id);
      } else {
        await deleteToothStatus(item.id);
      }
      toast.success('Đã xóa dữ liệu thành công');
      await loadData(false);
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xóa dữ liệu'));
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-start gap-3 border-b border-slate-200 pb-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
          <Settings2 size={22} />
        </div>
        <div>
          <h1 className="text-xl font-black text-slate-900">Danh mục nha khoa</h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý chẩn đoán chính và các tình trạng răng được sử dụng trong hồ sơ khám.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="rounded border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
          Đang tải danh mục...
        </div>
      ) : (
        <div className="grid items-stretch gap-5 xl:grid-cols-2">
          <section className="min-w-0 rounded border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title={`Chẩn đoán chính (${diagnoses.length})`}
              description="Danh sách chẩn đoán được sử dụng trong hồ sơ khám."
              onAdd={() => setModal({ type: 'diagnosis', item: null })}
              onRefresh={() => loadData(false)}
              loading={loading}
            />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[440px] table-fixed text-left text-sm">
                <colgroup><col className="w-[62%]" /><col className="w-[22%]" /><col className="w-[16%]" /></colgroup>
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-2 py-3">Tên chẩn đoán</th>
                    <th className="px-2 py-3 whitespace-nowrap">Trạng thái</th>
                    <th className="px-2 py-3 text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {diagnoses.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="break-words px-2 py-3 font-semibold text-slate-800">{item.primaryDiagnosisName}</td>
                      <td className="px-2 py-3">
                        <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-bold ${item.status ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {item.status ? 'Đang dùng' : 'Ngừng dùng'}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => setModal({ type: 'diagnosis', item })} className="rounded p-2 text-sky-700 hover:bg-sky-50" title="Sửa">
                            <Edit3 size={15} />
                          </button>
                          <button type="button" onClick={() => handleDelete('diagnosis', item)} className="rounded p-2 text-rose-700 hover:bg-rose-50" title="Xóa">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!diagnoses.length && <p className="py-8 text-center text-sm text-slate-500">Chưa có chẩn đoán nào.</p>}
            </div>
          </section>

          <section className="min-w-0 rounded border border-slate-200 bg-white p-5 shadow-sm">
            <SectionHeader
              title={`Tình trạng răng (${toothStatuses.length})`}
              description="Danh mục tình trạng và màu hiển thị trên sơ đồ răng."
              onAdd={() => setModal({ type: 'toothStatus', item: null })}
              onRefresh={() => loadData(false)}
              loading={loading}
            />
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[440px] table-fixed text-left text-sm">
                <colgroup><col className="w-[20%]" /><col className="w-[29%]" /><col className="w-[32%]" /><col className="w-[19%]" /></colgroup>
                <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-2 py-3">Mã</th>
                    <th className="px-2 py-3">Tên</th>
                    <th className="px-2 py-3">Màu</th>
                    <th className="px-2 py-3 text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {toothStatuses.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="break-all px-2 py-3 font-mono text-xs font-bold text-slate-700">{item.toothCode}</td>
                      <td className="break-words px-2 py-3 font-semibold text-slate-800">{item.label}</td>
                      <td className="px-2 py-3">
                        <span className="inline-flex items-center gap-2 whitespace-nowrap">
                          <span className="h-5 w-5 rounded border border-slate-300" style={{ backgroundColor: item.color }} />
                          <span className="font-mono text-xs text-slate-500">{item.color}</span>
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => setModal({ type: 'toothStatus', item })} className="rounded p-2 text-sky-700 hover:bg-sky-50" title="Sửa">
                            <Edit3 size={15} />
                          </button>
                          <button type="button" onClick={() => handleDelete('toothStatus', item)} className="rounded p-2 text-rose-700 hover:bg-rose-50" title="Xóa">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!toothStatuses.length && <p className="py-8 text-center text-sm text-slate-500">Chưa có tình trạng răng nào.</p>}
            </div>
          </section>
        </div>
      )}

      {modal && (
        <DictionaryModal
          type={modal.type}
          item={modal.item}
          onClose={() => setModal(null)}
          onSaved={() => loadData(false)}
        />
      )}
    </div>
  );
}
