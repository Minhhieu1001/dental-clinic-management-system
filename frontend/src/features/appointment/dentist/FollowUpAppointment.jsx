
export default function FollowUpAppointment() {

    return (
        <div className="mx-auto max-w-[1440px] space-y-6 p-4 sm:p-6 bg-[#F4F7F6]/60 min-h-screen text-slate-800 font-sans">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
                <div>
                    <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-teal-50 text-teal-700">

                        </div>
                        Quản Lý Lịch Tái Khám
                    </h1>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        Theo dõi, hẹn tái khám và đánh giá tiến trình điều trị của bệnh nhân
                    </p>
                </div>
            </div>
        </div>
    );
}
