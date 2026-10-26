package iuh.fit.backend.customercare.enums;

public enum CareStatus {
    PENDING("Chưa chăm sóc"),
    COMPLETED("Liên hệ thành công"),
    RECARE("Hẹn chăm sóc lại"),
    NO_ANSWER("Không nghe máy"),
    REJECTED("Từ chối"),
    FAILED("Gửi thất bại");

    private final String label;

    CareStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static CareStatus fromString(String val) {
        if (val == null || val.isBlank()) return PENDING;
        String trimmed = val.trim();
        try {
            return CareStatus.valueOf(trimmed.toUpperCase());
        } catch (IllegalArgumentException e) {
            for (CareStatus s : CareStatus.values()) {
                if (s.getLabel().equalsIgnoreCase(trimmed) || s.name().equalsIgnoreCase(trimmed)) return s;
            }
            if ("Hoàn thành".equalsIgnoreCase(trimmed) || "Đã chăm sóc".equalsIgnoreCase(trimmed) || "Đã gửi ưu đãi".equalsIgnoreCase(trimmed) || "Đã gửi".equalsIgnoreCase(trimmed)) {
                return COMPLETED;
            }
            if ("Cần chăm sóc lại".equalsIgnoreCase(trimmed) || "Cần gửi lại".equalsIgnoreCase(trimmed)) {
                return RECARE;
            }
            return PENDING;
        }
    }
}
