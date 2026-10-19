package iuh.fit.backend.customercare.enums;

public enum CareChannel {
    PHONE("Gọi điện"),
    SMS("Tin nhắn"),
    GMAIL("Gmail"),
    EMAIL("Gmail"),
    DIRECT("Trực tiếp"),
    GIFT("Tặng quà"),
    ZALO_SMS("Gmail");

    private final String label;

    CareChannel(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static CareChannel fromString(String val) {
        if (val == null || val.isBlank()) return PHONE;
        String upper = val.toUpperCase().trim();
        if ("GMAIL".equals(upper) || "EMAIL".equals(upper) || "ZALO_SMS".equals(upper) || "ZALO".equals(upper)) {
            return GMAIL;
        }
        try {
            return CareChannel.valueOf(upper);
        } catch (IllegalArgumentException e) {
            for (CareChannel c : CareChannel.values()) {
                if (c.getLabel().equalsIgnoreCase(val.trim())) return c;
            }
            return PHONE;
        }
    }
}
