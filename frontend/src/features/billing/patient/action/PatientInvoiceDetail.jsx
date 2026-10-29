import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowLeft,
    Building2,
    CalendarDays,
    Download,
    IdCard,
    Phone,
    ReceiptText,
    UserRound,
    UserRoundCog,
} from 'lucide-react';

import { getPatientById } from '../../../../services/patient.service';

const BUTTON_INTERACTION_CLASSES = 'cursor-pointer transition-colors hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-600 motion-reduce:transition-none';

const currencyFormatter = new Intl.NumberFormat('vi-VN');
const currency = (value) =>
    `${currencyFormatter.format(Number(value) || 0)} đ`;

const dateLabel = (value) => {
    if (!value) return 'Chưa cập nhật';

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString('vi-VN');
};

function InfoItem({ icon: Icon, label, children }) {
    return (
        <div className="flex items-center gap-3 min-w-0">
            <span className="grid place-items-center w-9 h-9 rounded-lg bg-teal-50 text-teal-700 shrink-0">
                <Icon size={25} aria-hidden="true" />
            </span>

            <div className="min-w-0">
                <span className="block text-slate-500 text-xs mb-1">
                    {label}
                </span>

                <div className="font-semibold wrap-anywhere">
                    {children || 'Chưa cập nhật'}
                </div>
            </div>
        </div>
    );
}

function InvoiceSection({ id, title, children }) {
    return (
        <section aria-labelledby={id} className="mt-1 rounded-lg bg-white p-4">
            <h2 id={id} className="mb-4 text-base font-bold">{title}</h2>
            {children}
        </section>
    );
}

export default function PatientInvoiceDetail({ invoice, onBack }) {
    const reduceMotion = useReducedMotion();
    const patientId = invoice?.patientId;
    const [patientResult, setPatientResult] = useState(null);

    useEffect(() => {
        if (!patientId) return;

        let active = true;
        getPatientById(patientId)
            .then((patient) => {
                if (active) setPatientResult({ patientId, patient });
            })
            .catch((error) => {
                if (active) {
                    setPatientResult({ patientId, patient: null });
                    console.warn('Không thể tải thông tin bệnh nhân cho hóa đơn:', error);
                }
            });

        return () => { active = false; };
    }, [patientId]);

    const patientDob = patientResult?.patientId === patientId
        ? patientResult?.patient?.dateOfBirth ?? invoice?.patientDob
        : invoice?.patientDob;
    const buttonMotion = {
        whileHover: { y: reduceMotion ? 0 : -1 },
        whileTap: { scale: reduceMotion ? 1 : 0.97 },
        transition: { duration: reduceMotion ? 0 : 0.15 },
    };

    if (!invoice) return null;

    const services = invoice.services || [];

    const statusClasses =
        invoice.status === 'Đã thanh toán'
            ? 'bg-emerald-50 text-emerald-700'
            : invoice.status === 'Thanh toán một phần'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-rose-50 text-rose-700';

    return (
        <article
            aria-labelledby="patient-invoice-title"
            className="text-slate-700 bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-5 text-sm"
        >
            <header className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div className="flex items-center gap-3 min-w-0">
                    <motion.button
                        {...buttonMotion}
                        type="button"
                        onClick={onBack}
                        aria-label="Quay lại danh sách hóa đơn"
                        className={`grid place-items-center w-10 h-10 shrink-0 border border-teal-100 rounded-lg text-teal-700 bg-white ${BUTTON_INTERACTION_CLASSES}`}
                    >
                        <ArrowLeft size={20} />
                    </motion.button>

                    <h1
                        id="patient-invoice-title"
                        className="m-0 text-lg sm:text-[22px] font-bold wrap-anywhere"
                    >
                        Chi tiết hóa đơn #{invoice.id}
                    </h1>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    <motion.button
                        {...buttonMotion}
                        type="button"
                        onClick={() => window.print()}
                        title="Chọn Lưu dưới dạng PDF / Save as PDF trong hộp thoại in"
                        className={`inline-flex items-center justify-center gap-2 bg-teal-700 text-white border-0 rounded-lg px-4 py-3 text-[13px] font-semibold ${BUTTON_INTERACTION_CLASSES}`}
                    >
                        <Download size={17} />
                        Tải hóa đơn (PDF)
                    </motion.button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 mb-2">
                <div className="flex items-center gap-3 min-w-0 p-4">
                    <span className="grid place-items-center w-14 h-16 bg-teal-100 text-teal-700 rounded-xl shrink-0">
                        <ReceiptText size={35} />
                    </span>

                    <div className="min-w-0">
                        <h2 className="m-0 text-[15px] font-bold wrap-anywhere">
                            Mã hóa đơn: {invoice.id}
                        </h2>

                        <span
                            className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md mt-1 text-[11px] font-semibold ${statusClasses}`}
                        >
                            <span
                                className="w-1.5 h-1.5 rounded-full bg-current"
                            />
                            {invoice.status}
                        </span>

                        <p className="text-xs text-slate-500 mt-1.5">
                            Ngày lập: {invoice.date || 'Chưa cập nhật'}
                        </p>
                    </div>
                </div>

                <div className="p-4">
                    <InfoItem icon={Building2} label="Chi nhánh">
                        <strong>{invoice.branchName || 'Chưa cập nhật'}</strong>

                        {invoice.branchAddress && (
                            <p className="font-normal mt-1 leading-relaxed">
                                {invoice.branchAddress}
                            </p>
                        )}
                    </InfoItem>
                </div>

                <div className="p-4">
                    <InfoItem icon={UserRoundCog} label="Người tạo hóa đơn">
                        <strong>{invoice.employeeName || 'Chưa cập nhật'}</strong>
                    </InfoItem>
                </div>
            </div>

            <InvoiceSection id="invoice-patient-heading" title="Thông tin bệnh nhân">

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 pb-1">
                    <InfoItem icon={UserRound} label="Họ và tên">
                        {invoice.patientName}
                    </InfoItem>

                    <InfoItem icon={CalendarDays} label="Ngày sinh">
                        {dateLabel(patientDob)}
                    </InfoItem>

                    <InfoItem icon={Phone} label="Số điện thoại">
                        {invoice.patientPhone}
                    </InfoItem>

                    <InfoItem icon={IdCard} label="Mã bệnh nhân">
                        {invoice.patientCode}
                    </InfoItem>
                </div>
            </InvoiceSection>

            <InvoiceSection id="invoice-services-heading" title="Danh sách dịch vụ">

                <div
                    role="region"
                    aria-label="Danh sách dịch vụ hóa đơn"
                    tabIndex={0}
                    className="overflow-x-auto border border-slate-200 rounded-md"
                >
                    <table className="w-full border-collapse text-[13px]">
                        <thead>
                            <tr className="bg-teal-50">
                                <th
                                    scope="col"
                                    className="px-3.5 py-3 border-b border-b-slate-200 border-r border-r-slate-100 text-center font-bold"
                                >
                                    STT
                                </th>

                                <th
                                    scope="col"
                                    className="px-3.5 py-3 border-b border-b-slate-200 border-r border-r-slate-100 text-left w-2/5 min-w-45 font-bold"
                                >
                                    Dịch vụ
                                </th>

                                <th
                                    scope="col"
                                    className="px-3.5 py-3 border-b border-b-slate-200 border-r border-r-slate-100 text-right whitespace-nowrap font-bold"
                                >
                                    Đơn giá
                                </th>

                                <th
                                    scope="col"
                                    className="px-3.5 py-3 border-b border-b-slate-200 border-r border-r-slate-100 text-center whitespace-nowrap font-bold"
                                >
                                    Số lượng
                                </th>

                                <th
                                    scope="col"
                                    className="px-3.5 py-3 border-b border-slate-200 text-right whitespace-nowrap font-bold"
                                >
                                    Thành tiền
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {services.map((service, index) => (
                                <tr
                                    key={service.treatmentServiceId || index}
                                    className="group bg-white even:bg-slate-50"
                                >
                                    <td className="px-3.5 py-3 border-b border-b-slate-200 group-last:border-b-0 border-r border-r-slate-100 text-center">
                                        {index + 1}
                                    </td>

                                    <td className="px-3.5 py-3 border-b border-b-slate-200 group-last:border-b-0 border-r border-r-slate-100 text-left w-2/5 min-w-45">
                                        {service.name}
                                    </td>

                                    <td className="px-3.5 py-3 border-b border-b-slate-200 group-last:border-b-0 border-r border-r-slate-100 text-right whitespace-nowrap">
                                        {currency(service.price)}
                                    </td>

                                    <td className="px-3.5 py-3 border-b border-b-slate-200 group-last:border-b-0 border-r border-r-slate-100 text-center">
                                        {service.quantity ?? 1}
                                    </td>

                                    <td className="px-3.5 py-3 border-b border-slate-200 group-last:border-b-0 text-right whitespace-nowrap">
                                        {currency(service.total)}
                                    </td>
                                </tr>
                            ))}

                            {!services.length && (
                                <tr>
                                    <td
                                        colSpan={5}
                                        className="text-center p-7 text-slate-500"
                                    >
                                        Chưa có dịch vụ trong hóa đơn này.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <dl className="w-full max-w-95 mt-4 ml-auto">
                    <div className="flex justify-between items-baseline gap-4 px-3 py-2.5">
                        <dt>Tổng tiền dịch vụ</dt>
                        <dd className="m-0 font-semibold whitespace-nowrap">
                            {currency(invoice.totalAmount)}
                        </dd>
                    </div>

                    <div className="flex justify-between items-baseline gap-4 px-3 py-2.5">
                        <dt>Giảm giá</dt>
                        <dd className="m-0 font-semibold whitespace-nowrap">
                            {currency(invoice.discountAmount)}
                        </dd>
                    </div>

                    <div className="flex justify-between items-baseline gap-4 px-3 py-2.5 bg-teal-50 rounded-md font-bold">
                        <dt>Tổng thanh toán</dt>
                        <dd className="m-0 text-teal-700 text-xl font-bold whitespace-nowrap">
                            {currency(invoice.finalAmount)}
                        </dd>
                    </div>
                </dl>
            </InvoiceSection>

        </article>
    );
}
