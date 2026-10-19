package iuh.fit.backend.customercare.enums;

public enum CareStatus {
    PENDING("Chưa chăm sóc"),
    COMPLETED("Hoàn thành"),
    RECARE("Cần chăm sóc lại"),
    FAILED("Gửi thất bại"),
    NO_ANSWER("Không nghe máy");

    private final String label;

    CareStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static CareStatus fromString(String val) {
        if (val == null || val.isBlank()) return PENDING;
        try {
            return CareStatus.valueOf(val.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            for (CareStatus s : CareStatus.values()) {
                if (s.getLabel().equalsIgnoreCase(val.trim())) return s;
            }
            return PENDING;
        }
    }
}
