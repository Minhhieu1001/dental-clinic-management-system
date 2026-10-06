package iuh.fit.backend.billing.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Kết quả trả về cho màn hình danh sách hóa đơn:
 * - invoices: danh sách theo năm / tháng / trạng thái / từ khóa
 * - summary : thống kê chỉ theo năm / tháng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceListResponse {
    private List<InvoiceResponse> invoices;
    private InvoiceSummaryResponse summary;
}
