/**
 * Cấu hình thông tin tài khoản ngân hàng thụ hưởng của Phòng khám (VietQR / Casso)
 * Bạn có thể dễ dàng chỉnh sửa thông tin ngân hàng tại đây bất kỳ lúc nào.
 */
export const CLINIC_BANK_CONFIG = {
  bankId: 'MB',                             // Mã ngân hàng Napas (MB, VCB, ICB, BIDV, TCB, ACB, VPB, TPB,...)
  bankName: 'MBBank',                        // Tên ngắn ngân hàng
  bankFullName: 'Ngân hàng TMCP Quân Đội',   // Tên đầy đủ ngân hàng
  accountNo: '038391001',                   // Số tài khoản thụ hưởng
  accountName: 'NHA KHOA SMILE CARE',       // Tên chủ tài khoản (viết hoa không dấu)
  qrTemplate: 'compact2',                   // Template giao diện mã QR (compact2, compact, qr_only)
};
