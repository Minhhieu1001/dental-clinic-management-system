import React from 'react';
import {
    Phone,
    ShieldCheck,
    Calendar,
    Mail,
    MapPin,
    HeartPulse,
    Activity,
    AlertTriangle,
    Pill,
    Stethoscope,
} from 'lucide-react';
import { calculateAge, formatDateDisplay } from '../medicalRecordDictionaries';

export default function PatientInfoSidebar({ selectedRecord }) {
    return (
        <div className="lg:col-span-4 xl:col-span-4 border-r border-slate-200 bg-white p-4 overflow-y-auto space-y-4">
            {/* Header Profile Box */}
            <div className="p-3.5 rounded-sm bg-gradient-to-br from-teal-50 via-white to-teal-50/50 border border-teal-200/80 shadow-2xs space-y-3">
                <div className="flex items-center gap-3">
                    {selectedRecord?.avatar ? (
                        <img
                            src={selectedRecord.avatar}
                            alt={selectedRecord.patientName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-teal-200 shadow-xs shrink-0"
                        />
                    ) : (
                        <div className="w-14 h-14 rounded-full bg-teal-700 text-white font-black text-xl flex items-center justify-center border-2 border-teal-100 shadow-xs shrink-0">
                            {selectedRecord?.patientName?.charAt(0) || 'P'}
                        </div>
                    )}
                    <div className="min-w-0">
                        <h3 className="font-bold text-base text-slate-900 truncate">{selectedRecord?.patientName}</h3>
                        <p className="text-xs font-semibold text-slate-600">
                            {selectedRecord?.gender === 'FEMALE' ? '♀ Nữ' : selectedRecord?.gender === 'MALE' ? '♂ Nam' : 'Khác'}{' '}
                            • {calculateAge(selectedRecord?.dateOfBirth)} tuổi
                        </p>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-sm text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-300">
                            {selectedRecord?.status || 'Đang điều trị'}
                        </span>
                    </div>
                </div>

                {/* Quick Info Grid */}
                <div className="grid grid-cols-1 gap-2 pt-2 border-t border-teal-100 text-xs">
                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <Phone size={13} className="text-teal-700" /> Điện thoại:
                        </span>
                        <strong className="text-slate-900 font-bold">{selectedRecord?.phone || 'Chưa cập nhật'}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <ShieldCheck size={13} className="text-teal-700" /> CCCD/CMND:
                        </span>
                        <strong className="text-slate-900 font-semibold">{selectedRecord?.cccd || 'Chưa cập nhật'}</strong>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <Calendar size={13} className="text-teal-700" /> Ngày sinh:
                        </span>
                        <span className="text-slate-800 font-medium">{formatDateDisplay(selectedRecord?.dateOfBirth)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <Mail size={13} className="text-teal-700" /> Email:
                        </span>
                        <span className="text-slate-800 font-medium truncate max-w-[170px]" title={selectedRecord?.email}>
                            {selectedRecord?.email || 'Chưa cập nhật'}
                        </span>
                    </div>

                    <div className="flex items-start justify-between gap-2">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5 shrink-0">
                            <MapPin size={13} className="text-teal-700" /> Địa chỉ:
                        </span>
                        <span className="text-slate-800 font-medium text-right text-[11px]" title={selectedRecord?.address}>
                            {selectedRecord?.address || 'Chưa cập nhật'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Tiền sử Y tế & Bệnh lý toàn thân */}
            <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-teal-800 flex items-center gap-1.5 uppercase tracking-wide border-b border-slate-200 pb-1.5">
                    <HeartPulse size={15} className="text-rose-600" />
                    Tiền Sử Y Tế & Bệnh Lý Toàn Thân
                </h4>

                {/* Bệnh lý toàn thân badges */}
                <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        <Activity size={12} className="text-rose-600" /> Bệnh lý nền:
                    </label>
                    {Array.isArray(selectedRecord?.systemicDiseases) && selectedRecord.systemicDiseases.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {selectedRecord.systemicDiseases.map((dis, i) => (
                                <span
                                    key={i}
                                    className="bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-sm text-[11px] font-bold"
                                >
                                    {dis}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded-sm border border-slate-200">
                            Không ghi nhận bệnh lý toàn thân đặc biệt.
                        </p>
                    )}
                </div>

                {/* Dị ứng */}
                <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        <AlertTriangle size={12} className="text-amber-600" /> Dị ứng thuốc / thức ăn:
                    </label>
                    <p className="text-xs font-semibold text-slate-800 bg-amber-50/50 border border-amber-200 p-2 rounded-sm">
                        {selectedRecord?.allergies || 'Không có ghi nhận dị ứng'}
                    </p>
                </div>

                {/* Thuốc đang dùng */}
                <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        <Pill size={12} className="text-purple-600" /> Thuốc đang sử dụng:
                    </label>
                    <p className="text-xs font-semibold text-slate-800 bg-purple-50/50 border border-purple-200 p-2 rounded-sm">
                        {selectedRecord?.currentMedications || 'Không sử dụng thuốc dài hạn'}
                    </p>
                </div>

                {/* Tiền sử phẫu thuật */}
                <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
                        <Stethoscope size={12} className="text-teal-700" /> Tiền sử phẫu thuật:
                    </label>
                    <p className="text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 p-2 rounded-sm">
                        {selectedRecord?.surgicalHistory || 'Chưa từng phẫu thuật nha khoa/toàn thân'}
                    </p>
                </div>
            </div>

            {/* Thông tin hồ sơ & quản trị */}
            <div className="p-3 rounded-sm bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-600">
                <div className="flex justify-between">
                    <span>Mã hồ sơ lưu trữ:</span>
                    <strong className="text-slate-900 font-semibold">{selectedRecord?.recordCode}</strong>
                </div>
                <div className="flex justify-between">
                    <span>Thời gian tạo:</span>
                    <strong className="text-slate-900">{formatDateDisplay(selectedRecord?.createdAt)}</strong>
                </div>
                <div className="flex justify-between">
                    <span>Bác sĩ phụ trách:</span>
                    <strong className="text-teal-800">{selectedRecord?.dentistName}</strong>
                </div>
            </div>
        </div>
    );
}
