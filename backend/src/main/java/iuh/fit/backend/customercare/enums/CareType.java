package iuh.fit.backend.customercare.enums;

public enum CareType {
    APPOINTMENT_REMINDER("Nhắc lịch hẹn"),
    POST_TREATMENT("Sau điều trị"),
    BIRTHDAY("Ngày sinh nhật"),
    GENERAL_CARE("Chăm sóc tổng hợp"),
    PAYMENT("Thanh toán"),
    PROMOTION("Khuyến mãi");

    private final String label;

    CareType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static CareType fromString(String val) {
        if (val == null || val.isBlank()) return GENERAL_CARE;
        String trimmed = val.trim();
        try {
            return CareType.valueOf(trimmed.toUpperCase());
        } catch (IllegalArgumentException e) {
            for (CareType t : CareType.values()) {
                if (t.getLabel().equalsIgnoreCase(trimmed) || t.name().equalsIgnoreCase(trimmed)) return t;
            }
            if (trimmed.equalsIgnoreCase("Sau điều trị") || trimmed.equalsIgnoreCase("Khám xong") || trimmed.equalsIgnoreCase("Tái khám")) {
                return POST_TREATMENT;
            }
            return GENERAL_CARE;
        }
    }
}
