import { Image } from 'lucide-react';

const formatDate = (value) => {
    if (!value) return 'Chưa rõ ngày';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString('vi-VN');
};

const treatmentLabel = (item) => item.treatmentPlanName?.trim()
    ? `${item.treatmentPlanName.trim()} (đợt khám ${formatDate(item.examinationDate)})`
    : `Chưa có kế hoạch điều trị (đợt khám ${formatDate(item.examinationDate)})`;

export default function DentalImagesTab({ analyses = [], error = false }) {
    if (error) {
        return <p className="rounded-lg border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">Không tải được phim X-quang. Vui lòng mở lại hồ sơ để thử lại.</p>;
    }

    if (!analyses.length) {
        return (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
                <Image className="mx-auto mb-3 text-teal-700" size={32} />
                <p className="font-semibold">Hồ sơ này chưa có phim X-quang đã lưu.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Phim X-quang ({analyses.length})</h3>
            <div className="grid gap-4 md:grid-cols-2">
                {analyses.map((item, index) => (
                    <div key={item.analysisId || index} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                        <div className="flex min-h-52 items-center justify-center bg-slate-900">
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt={`Phim X-quang thuộc ${treatmentLabel(item)}`} className="max-h-[420px] w-full object-contain" />
                            ) : (
                                <p className="p-6 text-center text-sm text-slate-300">Chưa có ảnh X-quang.</p>
                            )}
                        </div>
                        <div className="space-y-1 p-4 text-sm text-slate-700">
                            <p><span className="font-semibold">Ngày phân tích:</span> {formatDate(item.analyzedAt || item.captureDate)}</p>
                            <p><span className="font-semibold">Đợt điều trị:</span> {treatmentLabel(item)}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
