package iuh.fit.backend.customercare.enums;

public enum CareChannel {
    PHONE("Gọi điện"),
    SMS("Tin nhắn SMS"),
    ZALO("Zalo"),
    GMAIL("Gmail"),
    EMAIL("Email"),
    DIRECT("Trực tiếp"),
    GIFT("Tặng quà"),
    ZALO_SMS("Zalo");

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
        if ("ZALO".equals(upper) || "ZALO_SMS".equals(upper)) {
            return ZALO;
        }
        if ("GMAIL".equals(upper) || "EMAIL".equals(upper)) {
            return GMAIL;
        }
        try {
            return CareChannel.valueOf(upper);
        } catch (IllegalArgumentException e) {
            for (CareChannel c : CareChannel.values()) {
                if (c.getLabel().equalsIgnoreCase(val.trim())) return c;
            }
            if (val.toLowerCase().contains("gọi")) return PHONE;
            if (val.toLowerCase().contains("zalo")) return ZALO;
            if (val.toLowerCase().contains("tin") || val.toLowerCase().contains("sms")) return SMS;
            if (val.toLowerCase().contains("mail")) return GMAIL;
            if (val.toLowerCase().contains("trực tiếp")) return DIRECT;
            return PHONE;
        }
    }
}
