import React from 'react';
import { Printer, X } from 'lucide-react';
import { Dialog, DialogContent } from '@mui/material';
import { formatDateDisplay, calculateAge, CARIES_LOCATION_MAP, CARIES_DEPTH_MAP } from './medicalRecordDictionaries';

export default function PrintMedicalRecordModal({
  open = false,
  onClose = () => {},
  selectedRecord = null,
  detailExams = [],
  detailPlans = [],
  detailPrescriptions = [],
}) {
  if (!open || !selectedRecord) return null;

  const handlePrint = () => {
    window.print();
  };

  const patientName = selectedRecord?.patientName || 'CHƯA CẬP NHẬT';
  const patientCode = selectedRecord?.patientCode || '-';
  const recordCode = selectedRecord?.recordCode || selectedRecord?.medicalRecordCode || '-';
  const dentistName = selectedRecord?.dentistName || 'BS. Nguyễn Thị Phương';
  const createdAtFormatted = formatDateDisplay(selectedRecord?.createdAt || new Date());
  const genderDisplay = selectedRecord?.gender === 'FEMALE' ? 'Nữ' : selectedRecord?.gender === 'MALE' ? 'Nam' : 'Khác';
  const ageDisplay = calculateAge(selectedRecord?.dateOfBirth);
  const dobFormatted = formatDateDisplay(selectedRecord?.dateOfBirth);
  const phone = selectedRecord?.phone || '-';
  const cccd = selectedRecord?.cccd || '-';
  const address = selectedRecord?.address || 'Chưa cập nhật';
  const email = selectedRecord?.email || '-';

  // Medical History string extraction
  const systemicDiseases = Array.isArray(selectedRecord?.systemicDiseases) && selectedRecord.systemicDiseases.length > 0
    ? selectedRecord.systemicDiseases.map((d) => (typeof d === 'string' ? d : (d?.name || d?.label || String(d)))).join(', ')
    : (typeof selectedRecord?.systemicDisease === 'string' ? selectedRecord.systemicDisease : 'Không ghi nhận');
  const allergies = typeof selectedRecord?.allergies === 'string' ? selectedRecord.allergies : 'Không';
  const currentMedications = typeof selectedRecord?.currentMedications === 'string' ? selectedRecord.currentMedications : 'Không';
  const surgicalHistory = typeof selectedRecord?.surgicalHistory === 'string' ? selectedRecord.surgicalHistory : 'Không';

  const formatDiagnosisItem = (diag) => {
    if (!diag) return '';
    if (typeof diag === 'string') return diag;
    const name = diag.primaryDiagnosis || diag.name || diag.label || diag.diagnosis || 'Bệnh lý răng hàm mặt';
    const tooth = diag.toothPosition || diag.toothNumber ? ` (Vị trí răng: ${diag.toothPosition || diag.toothNumber})` : '';
    const note = diag.diagnosticNotes ? ` - Ghi chú: ${diag.diagnosticNotes}` : '';
    return `${name}${tooth}${note}`;
  };

  const getToothStatusLabel = (t) => {
    const s = t.statusName || t.toothStatus || t.status || t.condition || '-';
    if (typeof s === 'string') return s;
    if (typeof s === 'object' && s !== null) return s.label || s.name || s.statusName || '-';
    return String(s);
  };

  const getSymptomText = (exam) => {
    const sym = exam.symptoms || exam.reason;
    if (!sym) return 'Khám và tư vấn răng hàm mặt';
    if (typeof sym === 'string') return sym;
    if (typeof sym === 'object') return sym.label || sym.name || sym.description || 'Khám và tư vấn răng hàm mặt';
    return String(sym);
  };

  return (
    <>
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 14mm 12mm 14mm;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-medical-record, #printable-medical-record * {
            visibility: visible !important;
          }
          #printable-medical-record {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            color: #000 !important;
            font-family: "Times New Roman", Times, serif !important;
          }
          .MuiDialog-paper, .MuiDialog-container, .MuiDialog-root {
            position: static !important;
            overflow: visible !important;
            box-shadow: none !important;
            background: transparent !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            padding: 0 !important;
          }
          .MuiBackdrop-root {
            display: none !important;
          }
          .no-print {
            display: none !important;
          }
          .page-break-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      <Dialog
        open={open}
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          onClose();
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: '6px',
            overflow: 'hidden',
            maxWidth: '860px',
            maxHeight: '94vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f1f5f9',
          },
        }}
      >
        {/* Top Header Bar for Preview */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800 shrink-0 no-print">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-teal-600/30 text-teal-300 rounded">
              <Printer size={18} />
            </div>
            <div>
              <span className="font-bold text-sm block leading-tight">Xem trước Sổ Bệnh Án Nha Khoa</span>
              <span className="text-[11px] text-slate-400">Định dạng văn bản chuẩn sổ y bạ giấy A4</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-1.5 rounded transition-all cursor-pointer shadow-xs border border-teal-500"
            >
              <Printer size={14} />
              <span>In hồ sơ bệnh án</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Đóng"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Paper Container - Looks like real medical booklet page */}
        <DialogContent sx={{ p: { xs: 1.5, sm: 3 }, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
          <div
            id="printable-medical-record"
            className="w-full max-w-[794px] bg-white text-slate-900 p-8 sm:p-10 shadow-lg border border-slate-300 rounded-xs font-serif leading-relaxed"
            style={{ minHeight: '1120px' }}
          >
            {/* BOOKLET BORDER FRAME */}
            <div className="border border-slate-900/80 p-5 sm:p-6 relative">
              {/* Corner Accents */}
              <div className="absolute top-1 left-1 w-2 h-2 border-t-2 border-l-2 border-slate-900"></div>
              <div className="absolute top-1 right-1 w-2 h-2 border-t-2 border-r-2 border-slate-900"></div>
              <div className="absolute bottom-1 left-1 w-2 h-2 border-b-2 border-l-2 border-slate-900"></div>
              <div className="absolute bottom-1 right-1 w-2 h-2 border-b-2 border-r-2 border-slate-900"></div>

              {/* 1. OFFICIAL MEDICAL HEADER */}
              <div className="grid grid-cols-12 gap-2 pb-3 border-b-2 border-slate-900">
                <div className="col-span-7">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-700">SỞ Y TẾ TP. HÀ NỘI / TP. HỒ CHÍ MINH</p>
                  <h3 className="text-sm sm:text-base font-extrabold uppercase text-slate-900">HỆ THỐNG NHA KHOA CROWN DENTAL</h3>
                  <p className="text-[11.5px] text-slate-600 mt-0.5">Địa chỉ: 328 Phố Huế, Q. Hai Bà Trưng, Hà Nội</p>
                  <p className="text-[11px] text-slate-600">Hotline: 1900 8059 • Website: crowndental.vn</p>
                </div>
                <div className="col-span-5 text-right space-y-0.5 text-[11px] font-sans">
                  <p><span className="text-slate-600 font-medium">Mẫu số:</span> <strong className="font-bold">01/BA-RHM</strong></p>
                  <p><span className="text-slate-600 font-medium">Mã BN:</span> <strong className="font-bold font-mono text-xs">{patientCode}</strong></p>
                  <p><span className="text-slate-600 font-medium">Số HSBA:</span> <strong className="font-bold font-mono text-xs text-teal-900">{recordCode}</strong></p>
                  <p><span className="text-slate-600 font-medium">Ngày lập:</span> <strong>{createdAtFormatted}</strong></p>
                </div>
              </div>

              {/* 2. TITLE SECTION */}
              <div className="text-center py-4 my-1">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-slate-900">
                  HỒ SƠ BỆNH ÁN NHA KHOA
                </h1>
                <p className="text-xs italic text-slate-600 mt-0.5 font-sans uppercase tracking-wider">
                  (DENTAL OUTPATIENT MEDICAL RECORD)
                </p>
                <p className="text-xs font-semibold text-slate-700 mt-1">
                  Bác sĩ phụ trách chuyên môn: <strong className="underline underline-offset-2">{dentistName}</strong>
                </p>
              </div>

              {/* 3. SECTION I: ADMINISTRATIVE DETAILS */}
              <div className="space-y-1.5 py-2">
                <div className="flex items-center gap-2 border-b border-slate-900/60 pb-1">
                  <span className="font-bold text-xs uppercase tracking-wide bg-slate-900 text-white px-2 py-0.5 font-sans">
                    I. Phần hành chính
                  </span>
                  <span className="text-[11px] italic text-slate-500 font-sans">(Thông tin cá nhân người bệnh)</span>
                </div>

                <div className="grid grid-cols-12 gap-y-1.5 gap-x-3 text-xs pt-1.5">
                  <div className="col-span-8">
                    1. Họ và tên người bệnh: <strong className="text-sm font-bold uppercase text-slate-900 ml-1">{patientName}</strong>
                  </div>
                  <div className="col-span-2">
                    Giới tính: <strong>{genderDisplay}</strong>
                  </div>
                  <div className="col-span-2 text-right">
                    Tuổi: <strong>{ageDisplay ? `${ageDisplay} tuổi` : '-'}</strong>
                  </div>

                  <div className="col-span-6">
                    2. Ngày sinh: <strong>{dobFormatted || 'Chưa rõ'}</strong>
                  </div>
                  <div className="col-span-6">
                    3. Số CCCD/CMND: <strong className="font-mono">{cccd}</strong>
                  </div>

                  <div className="col-span-6">
                    4. Điện thoại liên hệ: <strong className="font-mono">{phone}</strong>
                  </div>
                  <div className="col-span-6">
                    5. Email: <span>{email}</span>
                  </div>

                  <div className="col-span-12">
                    6. Địa chỉ cư trú: <span>{address}</span>
                  </div>
                </div>
              </div>

              {/* 4. SECTION II: MEDICAL HISTORY */}
              <div className="space-y-1.5 py-3 page-break-avoid">
                <div className="flex items-center gap-2 border-b border-slate-900/60 pb-1">
                  <span className="font-bold text-xs uppercase tracking-wide bg-slate-900 text-white px-2 py-0.5 font-sans">
                    II. Tiền sử y tế & bệnh lý toàn thân
                  </span>
                </div>

                <table className="w-full text-xs border border-slate-800 border-collapse mt-2">
                  <tbody>
                    <tr className="border-b border-slate-800">
                      <td className="w-1/3 p-1.5 font-bold bg-slate-100 border-r border-slate-800">Bệnh lý nền toàn thân:</td>
                      <td className="p-1.5 text-slate-900 font-medium">{systemicDiseases}</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-800">Dị ứng (thuốc, thức ăn, chất tê):</td>
                      <td className="p-1.5 text-slate-900">{allergies}</td>
                    </tr>
                    <tr className="border-b border-slate-800">
                      <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-800">Thuốc đang sử dụng định kỳ:</td>
                      <td className="p-1.5 text-slate-900">{currentMedications}</td>
                    </tr>
                    <tr>
                      <td className="p-1.5 font-bold bg-slate-100 border-r border-slate-800">Tiền sử phẫu thuật / Chảy máu:</td>
                      <td className="p-1.5 text-slate-900">{surgicalHistory}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 5. SECTION III: CLINICAL EXAMINATION & DENTAL CHART */}
              <div className="space-y-2 py-3 page-break-avoid">
                <div className="flex items-center gap-2 border-b border-slate-900/60 pb-1">
                  <span className="font-bold text-xs uppercase tracking-wide bg-slate-900 text-white px-2 py-0.5 font-sans">
                    III. Khám lâm sàng & Tình trạng răng miệng
                  </span>
                </div>

                {detailExams.length === 0 ? (
                  <p className="text-xs italic text-slate-500 py-1">Chưa ghi nhận đợt khám lâm sàng nào.</p>
                ) : (
                  detailExams.map((exam, examIdx) => {
                    const toothRecords = exam.toothRecords || [];
                    const examDateStr = formatDateDisplay(exam.examinationDate || exam.createdAt);
                    const examDoctor = exam.dentistName || selectedRecord?.dentistName || 'Bác sĩ phụ trách';
                    const branchName = exam.branchName || 'Crown Dental';

                    const rawDiagnoses = Array.isArray(exam.diagnoses)
                      ? exam.diagnoses
                      : exam.diagnosis
                        ? [exam.diagnosis]
                        : [];

                    return (
                      <div key={exam.id || examIdx} className="space-y-2 pt-1 pb-3">
                        {/* Exam Meta */}
                        <div className="text-xs bg-slate-50 p-2.5 border border-slate-400 font-sans">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span>Đợt khám: <strong>{examDateStr}</strong></span>
                            <span>Bác sĩ khám: <strong className="text-slate-900">{examDoctor}</strong></span>
                            <span>Cơ sở: <strong>{branchName}</strong></span>
                          </div>
                          <div className="mt-1.5 pt-1.5 border-t border-slate-200">
                            <strong>Lý do đến khám / Triệu chứng:</strong>{' '}
                            <span className="text-slate-900 font-medium">{getSymptomText(exam)}</span>
                          </div>
                          {rawDiagnoses.length > 0 && (
                            <div className="mt-1.5 pt-1.5 border-t border-slate-200">
                              <strong>Chẩn đoán của bác sĩ ({rawDiagnoses.length} chẩn đoán):</strong>
                              <ul className="list-disc pl-5 mt-1 space-y-0.5">
                                {rawDiagnoses.map((d, dIdx) => (
                                  <li key={d.id || dIdx} className="font-semibold text-slate-900">
                                    {formatDiagnosisItem(d)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Tooth status table */}
                        {toothRecords.length > 0 && (
                          <div className="mt-2">
                            <p className="text-[11px] font-bold uppercase mb-1 font-sans">
                              Bảng ghi nhận bệnh lý từng vị trí răng ({toothRecords.length} răng):
                            </p>
                            <table className="w-full text-[11px] border border-slate-800 border-collapse text-center">
                              <thead>
                                <tr className="bg-slate-100 border-b border-slate-800">
                                  <th className="p-1 border-r border-slate-800 w-8">STT</th>
                                  <th className="p-1 border-r border-slate-800 w-16">Vị trí răng</th>
                                  <th className="p-1 border-r border-slate-800">Tình trạng</th>
                                  <th className="p-1 border-r border-slate-800 w-14">Sâu răng</th>
                                  <th className="p-1 border-r border-slate-800">Vị trí sâu</th>
                                  <th className="p-1 border-r border-slate-800">Mức độ sâu</th>
                                  <th className="p-1 border-r border-slate-800">Lung lay</th>
                                  <th className="p-1">Nướu quanh răng</th>
                                </tr>
                              </thead>
                              <tbody>
                                {toothRecords.map((t, tIdx) => {
                                  const locLabel = CARIES_LOCATION_MAP[t.cariesLocation] || t.cariesLocation || '-';
                                  const depthLabel = CARIES_DEPTH_MAP[t.cariesDepth] || t.cariesDepth || '-';
                                  return (
                                    <tr key={t.id || tIdx} className="border-b border-slate-800">
                                      <td className="p-1 border-r border-slate-800">{tIdx + 1}</td>
                                      <td className="p-1 border-r border-slate-800 font-bold">Răng {t.toothNumber}</td>
                                      <td className="p-1 border-r border-slate-800 font-medium">{getToothStatusLabel(t)}</td>
                                      <td className="p-1 border-r border-slate-800">{t.hasDecay ? 'Có' : 'Không'}</td>
                                      <td className="p-1 border-r border-slate-800">{locLabel}</td>
                                      <td className="p-1 border-r border-slate-800">{depthLabel}</td>
                                      <td className="p-1 border-r border-slate-800">{t.mobilityDegree || 'Không'}</td>
                                      <td className="p-1">{t.gingivitisStatus || 'Bình thường'}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* 6. SECTION IV: TREATMENT PLANS (If any) */}
              {detailPlans && detailPlans.length > 0 && (
                <div className="space-y-1.5 py-2 page-break-avoid">
                  <div className="flex items-center gap-2 border-b border-slate-900/60 pb-1">
                    <span className="font-bold text-xs uppercase tracking-wide bg-slate-900 text-white px-2 py-0.5 font-sans">
                      IV. Kế hoạch & Phác đồ điều trị
                    </span>
                  </div>
                  <div className="text-xs space-y-1 pt-1">
                    {detailPlans.map((p, pIdx) => (
                      <div key={p.id || pIdx} className="flex justify-between items-center py-1 border-b border-slate-200">
                        <span>{pIdx + 1}. <strong>{p.planName || p.name || 'Kế hoạch điều trị'}</strong></span>
                        <span className="font-sans font-semibold text-slate-700">{p.status || 'Đang thực hiện'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. SECTION V: PRESCRIPTIONS (If any) */}
              {detailPrescriptions && detailPrescriptions.length > 0 && (
                <div className="space-y-1.5 py-2 page-break-avoid">
                  <div className="flex items-center gap-2 border-b border-slate-900/60 pb-1">
                    <span className="font-bold text-xs uppercase tracking-wide bg-slate-900 text-white px-2 py-0.5 font-sans">
                      V. Đơn thuốc & Hướng dẫn dùng thuốc
                    </span>
                  </div>
                  <div className="text-xs space-y-1 pt-1">
                    {detailPrescriptions.map((rx, rxIdx) => (
                      <div key={rx.id || rxIdx} className="text-xs py-1 border-b border-slate-200">
                        <span>Đơn ngày {formatDateDisplay(rx.createdAt || rx.date)} - Bác sĩ kê: <strong>{rx.dentistName || dentistName}</strong></span>
                        {Array.isArray(rx.items) && rx.items.length > 0 && (
                          <ul className="list-disc pl-5 mt-1 space-y-0.5">
                            {rx.items.map((item, iIdx) => (
                              <li key={iIdx}>
                                <strong>{item.medicineName || item.name}</strong> - SL: {item.quantity} {item.unit || 'viên'} ({item.usage || item.instructions || 'Theo chỉ định'})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. DOCTOR'S NOTE & SIGNATURES */}
              <div className="pt-4 page-break-avoid">
                <div className="border border-slate-800 p-2 text-xs bg-slate-50/50">
                  <strong>* Lời dặn của bác sĩ điều trị:</strong>
                  <p className="mt-0.5 text-slate-800 italic">
                    Người bệnh tuân thủ đúng hướng dẫn vệ sinh răng miệng, dùng thuốc theo đơn (nếu có), tái khám theo đúng lịch hẹn hoặc khi có triệu chứng bất thường (đau nhức, chảy máu, sưng tấy).
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 text-center text-xs">
                  <div>
                    <p className="font-bold uppercase tracking-wider text-slate-900">NGƯỜI BỆNH / ĐẠI DIỆN</p>
                    <p className="text-[11px] italic text-slate-500 font-sans">(Ký và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                    <p className="font-bold uppercase text-slate-900">{patientName}</p>
                  </div>

                  <div>
                    <p className="italic text-[11px] text-slate-600 font-sans">
                      Ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}
                    </p>
                    <p className="font-bold uppercase tracking-wider text-slate-900 mt-0.5">BÁC SĨ ĐIỀU TRỊ</p>
                    <p className="text-[11px] italic text-slate-500 font-sans">(Ký, đóng dấu và ghi rõ họ tên)</p>
                    <div className="h-16"></div>
                    <p className="font-bold text-slate-900">{dentistName}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
