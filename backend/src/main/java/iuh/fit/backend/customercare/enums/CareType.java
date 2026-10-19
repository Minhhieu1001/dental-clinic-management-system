package iuh.fit.backend.customercare.enums;

public enum CareType {
    APPOINTMENT_REMINDER("Nhắc lịch hẹn"),
    BIRTHDAY("Ngày sinh nhật"),
    GENERAL_CARE("Chăm sóc tổng hợp");

    private final String label;

    CareType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static CareType fromString(String val) {
        if (val == null || val.isBlank()) return GENERAL_CARE;
        try {
            return CareType.valueOf(val.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            for (CareType t : CareType.values()) {
                if (t.getLabel().equalsIgnoreCase(val.trim())) return t;
            }
            return GENERAL_CARE;
        }
    }
}
