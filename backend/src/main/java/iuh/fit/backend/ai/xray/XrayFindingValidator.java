package iuh.fit.backend.ai.xray;

import java.util.*;

/**
 * Hậu kiểm nghiệp vụ kết quả AI đọc phim:
 * <ol>
 *   <li>Hợp nhất phát hiện của lượt đọc toàn cảnh và các lượt soi chi tiết từng vùng (ensemble) –
 *       phát hiện được nhiều lượt xác nhận được tăng độ tin cậy, phát hiện đơn lẻ bị hạ nhẹ.</li>
 *   <li>Kiểm tra tính nhất quán giải phẫu: vị trí khung tổn thương so với cung hàm của số răng FDI (phát hiện đánh số nhầm
 *       bên / nhầm hàm), nhóm răng trước/sau.</li>
 *   <li>Kiểm tra nhất quán lâm sàng: tổn thương trên răng đã mất, tuổi bệnh nhân với bộ răng, chất lượng phim kém.</li>
 *   <li>Đồng bộ sơ đồ răng với danh sách tổn thương.</li>
 * </ol>
 */
public final class XrayFindingValidator {

    private XrayFindingValidator() {
    }

    private static final Map<String, String> TYPE_GROUP = Map.ofEntries(
            Map.entry("CARIES", "CARIES"), Map.entry("DEEP_CARIES", "CARIES"), Map.entry("SECONDARY_CARIES", "CARIES"),
            Map.entry("PERIAPICAL_LESION", "PERIAPICAL"), Map.entry("CYST", "PERIAPICAL"),
            Map.entry("BONE_LOSS", "PERIO"), Map.entry("CALCULUS", "PERIO"),
            Map.entry("RESTORATION", "RESTORATION"), Map.entry("OVERHANG", "RESTORATION"));

    private static final Map<String, String> TYPE_TO_STATUS = Map.ofEntries(
            Map.entry("CARIES", "CARIES"), Map.entry("DEEP_CARIES", "CARIES"), Map.entry("SECONDARY_CARIES", "CARIES"),
            Map.entry("PERIAPICAL_LESION", "PERIAPICAL_LESION"), Map.entry("CYST", "PERIAPICAL_LESION"),
            Map.entry("IMPACTED", "IMPACTED"), Map.entry("MISSING", "MISSING"), Map.entry("RESTORATION", "RESTORED"),
            Map.entry("OVERHANG", "RESTORED"), Map.entry("ROOT_CANAL", "ROOT_CANAL_TREATED"), Map.entry("CROWN", "CROWN"),
            Map.entry("IMPLANT", "IMPLANT"), Map.entry("BONE_LOSS", "BONE_LOSS"), Map.entry("FRACTURE", "FRACTURE"),
            Map.entry("RESIDUAL_ROOT", "RESIDUAL_ROOT"));

    private static final Set<String> PATHOLOGY_PRIORITY = Set.of("CARIES", "PERIAPICAL_LESION", "FRACTURE",
            "RESIDUAL_ROOT", "IMPACTED", "BONE_LOSS");

    public static String group(Object type) {
        String t = type == null ? "OTHER" : String.valueOf(type);
        return TYPE_GROUP.getOrDefault(t, t);
    }

    // ===================================== ENSEMBLE MERGE =====================================

    /**
     * Hợp nhất các phát hiện từ lượt soi chi tiết vào danh sách lượt đọc toàn cảnh.
     * Các phát hiện tile đã được quy đổi toạ độ về khung ảnh gốc trước khi gọi.
     */
    @SuppressWarnings("unchecked")
    public static List<Map<String, Object>> mergeFindings(List<Map<String, Object>> primary,
                                                          List<Map<String, Object>> tileFindings) {
        List<Map<String, Object>> merged = new ArrayList<>();
        for (Map<String, Object> f : primary) {
            Map<String, Object> copy = new LinkedHashMap<>(f);
            copy.put("detectedBy", new ArrayList<>(List.of("FULL")));
            merged.add(copy);
        }
        for (Map<String, Object> t : tileFindings) {
            String source = "TILE:" + t.getOrDefault("_tile", "?");
            Map<String, Object> match = findMatch(merged, t);
            if (match != null) {
                List<String> sources = (List<String>) match.get("detectedBy");
                if (!sources.contains(source)) sources.add(source);
                double c = Math.max(num(match.get("confidence")), num(t.get("confidence")));
                match.put("confidence", c);
                if (match.get("box_2d") == null && t.get("box_2d") != null) match.put("box_2d", t.get("box_2d"));
                if (severityRank(t.get("severity")) > severityRank(match.get("severity"))) {
                    match.put("severity", t.get("severity"));
                    if (t.get("radiographicDepth") != null) match.put("radiographicDepth", t.get("radiographicDepth"));
                }
                if (isBlank(match.get("evidence")) && !isBlank(t.get("evidence"))) match.put("evidence", t.get("evidence"));
            } else {
                Map<String, Object> copy = new LinkedHashMap<>(t);
                copy.remove("_tile");
                copy.put("detectedBy", new ArrayList<>(List.of(source)));
                merged.add(copy);
            }
        }
        // Hiệu chỉnh độ tin cậy theo mức đồng thuận giữa các lượt đọc
        for (Map<String, Object> f : merged) {
            List<String> sources = (List<String>) f.get("detectedBy");
            double c = num(f.get("confidence"));
            boolean corroborated = sources.size() >= 2;
            if (corroborated) {
                c = Math.min(99, c + 5);
            } else if (!tileFindings.isEmpty()) {
                c = c * 0.9; // chỉ một lượt đọc phát hiện → hạ nhẹ, yêu cầu bác sĩ chú ý
            }
            f.put("confidence", round1(c));
            f.put("corroborated", corroborated);
            f.remove("_tile");
        }
        return merged;
    }

    private static Map<String, Object> findMatch(List<Map<String, Object>> list, Map<String, Object> t) {
        Object tooth = t.get("toothNumber");
        String g = group(t.get("type"));
        Map<String, Object> best = null;
        double bestScore = 0;
        for (Map<String, Object> f : list) {
            if (!g.equals(group(f.get("type")))) continue;
            double iou = iou(f.get("box_2d"), t.get("box_2d"));
            boolean sameTooth = tooth != null && tooth.equals(f.get("toothNumber"));
            // Cùng răng + cùng nhóm tổn thương → trùng; khác/không rõ số răng → cần chồng lấn khung đáng kể
            double score = sameTooth ? 1 + iou : (iou >= 0.3 ? iou : 0);
            if (score > bestScore) {
                best = f;
                bestScore = score;
            }
        }
        return best;
    }

    // ===================================== VALIDATION =====================================

    /**
     * Chạy toàn bộ luật hậu kiểm. Trả về danh sách cảnh báo; findings/teeth được cập nhật tại chỗ.
     */
    @SuppressWarnings("unchecked")
    public static List<Map<String, Object>> validate(Map<String, Object> result, Integer patientAge, String orientation) {
        List<Map<String, Object>> warnings = new ArrayList<>();
        String imageType = String.valueOf(result.getOrDefault("imageType", "OTHER"));
        List<Map<String, Object>> findings = (List<Map<String, Object>>) result.getOrDefault("findings", new ArrayList<>());
        List<Map<String, Object>> teeth = (List<Map<String, Object>>) result.getOrDefault("teeth", new ArrayList<>());
        Map<Integer, Map<String, Object>> teethByNo = new TreeMap<>();
        for (Map<String, Object> t : teeth) {
            if (t.get("toothNumber") instanceof Integer n) teethByNo.put(n, t);
        }

        // 1. Chất lượng phim
        String quality = result.get("imageQuality") instanceof Map<?, ?> q && q.get("rating") != null
                ? String.valueOf(q.get("rating")).toUpperCase(Locale.ROOT) : "";
        if ("POOR".equals(quality)) {
            warn(warnings, "POOR_IMAGE_QUALITY", "WARNING", null,
                    "Chất lượng phim kém – độ tin cậy các phát hiện bị giới hạn tối đa 70%. Cân nhắc chụp lại phim.");
            for (Map<String, Object> f : findings) {
                f.put("confidence", Math.min(70, num(f.get("confidence"))));
                f.put("requiresClinicalCheck", true);
            }
        }

        // 2. Định hướng phim
        boolean standardOrientation = orientation == null || "STANDARD".equals(orientation) || "UNKNOWN".equals(orientation);
        if (!standardOrientation) {
            warn(warnings, "NON_STANDARD_ORIENTATION", "WARNING", null,
                    "Phim có thể bị lật/xoay (" + orientation + ") – kiểm tra kỹ bên phải/trái trước khi xác nhận số răng.");
        }

        // 3. Nhất quán vị trí giải phẫu (chỉ áp dụng phim Panorama định hướng chuẩn)
        if ("PANORAMIC".equals(imageType) && standardOrientation) {
            for (Map<String, Object> f : findings) {
                if (!(f.get("toothNumber") instanceof Integer no) || !(f.get("box_2d") instanceof List<?> box)) continue;
                String issue = panoramicPositionIssue(no, box);
                if (issue != null) {
                    flag(f, "POSITION_MISMATCH");
                    f.put("confidence", round1(Math.max(0, num(f.get("confidence")) - 15)));
                    f.put("requiresClinicalCheck", true);
                    warn(warnings, "TOOTH_NUMBER_POSITION_MISMATCH", "WARNING", no,
                            "R" + no + ": " + issue + " – nghi đánh số răng nhầm, bác sĩ cần xác minh số răng trên phim.");
                }
            }
        }

        // 4. Tổn thương trên răng đã ghi nhận mất
        for (Map<String, Object> f : findings) {
            if (!(f.get("toothNumber") instanceof Integer no)) continue;
            Map<String, Object> tooth = teethByNo.get(no);
            String type = String.valueOf(f.get("type"));
            if (tooth != null && "MISSING".equals(tooth.get("status"))
                    && !Set.of("MISSING", "IMPLANT", "RESIDUAL_ROOT", "BONE_LOSS", "BONE_LESION", "CYST", "OTHER").contains(type)) {
                flag(f, "CONFLICT_MISSING_TOOTH");
                f.put("requiresClinicalCheck", true);
                warn(warnings, "FINDING_ON_MISSING_TOOTH", "WARNING", no,
                        "R" + no + " được ghi mất răng nhưng có phát hiện " + type + " – mâu thuẫn, cần đối chiếu.");
            }
        }

        // 5. Tuổi bệnh nhân và bộ răng
        if (patientAge != null) {
            boolean hasPrimary = teethByNo.entrySet().stream()
                    .anyMatch(e -> e.getKey() >= 51 && !"MISSING".equals(e.getValue().get("status")));
            if (patientAge >= 14 && hasPrimary) {
                warn(warnings, "RETAINED_PRIMARY_TOOTH", "INFO", null,
                        "Ghi nhận răng sữa ở bệnh nhân " + patientAge + " tuổi – xác nhận răng sữa tồn lưu / thiếu mầm răng vĩnh viễn.");
            }
            String dentition = String.valueOf(result.getOrDefault("dentition", ""));
            if (patientAge <= 10 && "PERMANENT".equals(dentition)) {
                warn(warnings, "DENTITION_AGE_MISMATCH", "WARNING", null,
                        "Bệnh nhân " + patientAge + " tuổi nhưng AI ghi nhận bộ răng vĩnh viễn – kiểm tra lại (thường là bộ răng hỗn hợp).");
            }
            if (patientAge >= 18 && "MIXED".equals(dentition)) {
                warn(warnings, "DENTITION_AGE_MISMATCH", "INFO", null,
                        "Bệnh nhân " + patientAge + " tuổi nhưng AI ghi nhận bộ răng hỗn hợp – kiểm tra răng sữa tồn lưu.");
            }
        }

        // 6. Loại phim và số răng
        long visible = teeth.stream().filter(t -> !"MISSING".equals(t.get("status"))).count();
        if (("PERIAPICAL".equals(imageType) && visible > 6) || ("BITEWING".equals(imageType) && visible > 12)) {
            warn(warnings, "IMAGE_TYPE_TEETH_MISMATCH", "INFO", null,
                    "Số răng ghi nhận (" + visible + ") không điển hình cho phim " + imageType + " – kiểm tra lại loại phim.");
        }

        // 7. Phát hiện độ tin cậy thấp / thiếu khung toạ độ
        for (Map<String, Object> f : findings) {
            if (num(f.get("confidence")) < 50) {
                flag(f, "LOW_CONFIDENCE");
                f.put("requiresClinicalCheck", true);
            }
            if (f.get("box_2d") == null) flag(f, "NO_LOCALIZATION");
        }

        // 8. Đồng bộ sơ đồ răng với tổn thương
        for (Map<String, Object> f : findings) {
            if (!(f.get("toothNumber") instanceof Integer no)) continue;
            String status = TYPE_TO_STATUS.get(String.valueOf(f.get("type")));
            if (status == null) continue;
            Map<String, Object> tooth = teethByNo.get(no);
            if (tooth == null) {
                tooth = new LinkedHashMap<>();
                tooth.put("toothNumber", no);
                tooth.put("status", status);
                tooth.put("note", String.valueOf(f.getOrDefault("label", "")));
                teethByNo.put(no, tooth);
            } else {
                String cur = String.valueOf(tooth.get("status"));
                if ("NORMAL".equals(cur) || (!PATHOLOGY_PRIORITY.contains(cur) && PATHOLOGY_PRIORITY.contains(status)
                        && !"MISSING".equals(cur))) {
                    tooth.put("status", status);
                    if (isBlank(tooth.get("note"))) tooth.put("note", String.valueOf(f.getOrDefault("label", "")));
                }
            }
        }
        result.put("teeth", new ArrayList<>(teethByNo.values()));
        return warnings;
    }

    /**
     * Phim Panorama chuẩn: x nhỏ (trái ảnh) = bên phải bệnh nhân (cung 1, 4); y nhỏ = hàm trên (cung 1, 2).
     * Ngưỡng nới rộng vì cung răng cong và phim có thể lệch tâm.
     */
    private static String panoramicPositionIssue(int tooth, List<?> box) {
        try {
            double ymin = num(box.get(0)), xmin = num(box.get(1)), ymax = num(box.get(2)), xmax = num(box.get(3));
            double cx = (xmin + xmax) / 2000.0;
            double cy = (ymin + ymax) / 2000.0;
            int q = tooth / 10;
            int pos = tooth % 10;
            if (q >= 5) q -= 4; // răng sữa → cung tương ứng
            boolean patientRight = q == 1 || q == 4;
            boolean upper = q == 1 || q == 2;
            List<String> issues = new ArrayList<>();
            if (patientRight && cx > 0.6) issues.add("khung nằm bên trái bệnh nhân (phải ảnh) trong khi răng thuộc bên phải");
            if (!patientRight && cx < 0.4) issues.add("khung nằm bên phải bệnh nhân (trái ảnh) trong khi răng thuộc bên trái");
            if (upper && cy > 0.72) issues.add("khung nằm ở vùng hàm dưới trong khi răng thuộc hàm trên");
            if (!upper && cy < 0.28) issues.add("khung nằm ở vùng hàm trên trong khi răng thuộc hàm dưới");
            boolean molar = (tooth < 50 && pos >= 6) || (tooth >= 50 && pos >= 4);
            boolean incisor = pos <= 2;
            double distFromMid = Math.abs(cx - 0.5);
            if (molar && distFromMid < 0.08) issues.add("răng hàm nhưng khung nằm sát đường giữa");
            if (incisor && distFromMid > 0.3) issues.add("răng cửa nhưng khung nằm ở vùng răng sau");
            return issues.isEmpty() ? null : String.join("; ", issues);
        } catch (Exception e) {
            return null;
        }
    }

    // ===================================== Helpers =====================================

    /** Quy đổi box của ảnh cắt về toạ độ ảnh gốc. */
    public static List<Integer> mapTileBox(List<?> box, XrayPromptLibrary.Tile tile) {
        if (box == null || box.size() != 4) return null;
        double w = tile.x1() - tile.x0();
        double h = tile.y1() - tile.y0();
        int ymin = (int) Math.round(tile.y0() * 1000 + num(box.get(0)) * h);
        int xmin = (int) Math.round(tile.x0() * 1000 + num(box.get(1)) * w);
        int ymax = (int) Math.round(tile.y0() * 1000 + num(box.get(2)) * h);
        int xmax = (int) Math.round(tile.x0() * 1000 + num(box.get(3)) * w);
        if (ymax <= ymin || xmax <= xmin) return null;
        return List.of(clamp(ymin), clamp(xmin), clamp(ymax), clamp(xmax));
    }

    private static int clamp(int v) {
        return Math.max(0, Math.min(1000, v));
    }

    public static double iou(Object a, Object b) {
        if (!(a instanceof List<?> la) || !(b instanceof List<?> lb) || la.size() != 4 || lb.size() != 4) return 0;
        double ay0 = num(la.get(0)), ax0 = num(la.get(1)), ay1 = num(la.get(2)), ax1 = num(la.get(3));
        double by0 = num(lb.get(0)), bx0 = num(lb.get(1)), by1 = num(lb.get(2)), bx1 = num(lb.get(3));
        double iw = Math.max(0, Math.min(ax1, bx1) - Math.max(ax0, bx0));
        double ih = Math.max(0, Math.min(ay1, by1) - Math.max(ay0, by0));
        double inter = iw * ih;
        double union = (ax1 - ax0) * (ay1 - ay0) + (bx1 - bx0) * (by1 - by0) - inter;
        return union <= 0 ? 0 : inter / union;
    }

    private static int severityRank(Object s) {
        String v = s == null ? "" : String.valueOf(s);
        return switch (v) {
            case "Nặng" -> 3;
            case "Trung bình" -> 2;
            case "Nhẹ" -> 1;
            default -> 0;
        };
    }

    @SuppressWarnings("unchecked")
    private static void flag(Map<String, Object> f, String code) {
        Object cur = f.get("flags");
        List<String> flags = cur instanceof List<?> l ? new ArrayList<>((List<String>) l) : new ArrayList<>();
        if (!flags.contains(code)) flags.add(code);
        f.put("flags", flags);
    }

    private static void warn(List<Map<String, Object>> list, String code, String level, Integer tooth, String message) {
        Map<String, Object> w = new LinkedHashMap<>();
        w.put("code", code);
        w.put("level", level);
        w.put("toothNumber", tooth);
        w.put("message", message);
        list.add(w);
    }

    private static boolean isBlank(Object o) {
        return o == null || String.valueOf(o).isBlank();
    }

    static double num(Object v) {
        if (v == null) return 0;
        if (v instanceof Number n) return n.doubleValue();
        try {
            return Double.parseDouble(String.valueOf(v).replace("%", "").trim());
        } catch (Exception e) {
            return 0;
        }
    }

    private static double round1(double d) {
        return Math.round(d * 10.0) / 10.0;
    }
}
