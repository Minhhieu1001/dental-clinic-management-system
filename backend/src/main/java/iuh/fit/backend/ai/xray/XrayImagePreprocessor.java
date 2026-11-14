package iuh.fit.backend.ai.xray;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;

/**
 * Tiền xử lý phim X-quang trước khi đưa vào mô hình thị giác:
 * <ul>
 *   <li>Chuyển về thang xám 8-bit (phim X-quang là ảnh đơn kênh, loại bỏ nhiễu màu do chụp màn hình / scan).</li>
 *   <li>Giới hạn kích thước cạnh dài (không phóng to ảnh nhỏ) để giữ chi tiết mà không vượt giới hạn token.</li>
 *   <li>Tạo bản tăng cường tương phản CLAHE (Contrast Limited Adaptive Histogram Equalization) – kỹ thuật chuẩn
 *       trong xử lý ảnh nha khoa giúp lộ rõ vùng thấu quang nhỏ (sâu kẽ, tổn thương chóp, mào xương).</li>
 *   <li>Cắt vùng (tile) phóng to theo sextant cho phim Panorama.</li>
 * </ul>
 * Mọi biến đổi đều giữ nguyên tỷ lệ khung hình nên toạ độ chuẩn hoá 0-1000 vẫn khớp với ảnh gốc.
 */
@Slf4j
@Component
public class XrayImagePreprocessor {

    /** Ảnh đã chuẩn bị. {@code gray} = null nếu Java không giải mã được (ví dụ WEBP) – khi đó gửi ảnh gốc. */
    public record PreparedImage(byte[] originalBytes, String originalMime,
                                BufferedImage gray, BufferedImage enhanced,
                                int sourceWidth, int sourceHeight) {
        public boolean decodable() {
            return gray != null;
        }

        public double aspectRatio() {
            return sourceHeight > 0 ? (double) sourceWidth / sourceHeight : 0;
        }
    }

    public PreparedImage prepare(byte[] bytes, String mime, int maxSide) {
        BufferedImage src = null;
        try {
            src = ImageIO.read(new ByteArrayInputStream(bytes));
        } catch (Exception e) {
            log.debug("Không giải mã được ảnh bằng ImageIO: {}", e.getMessage());
        }
        if (src == null) {
            return new PreparedImage(bytes, mime, null, null, 0, 0);
        }
        BufferedImage gray = toGray(src, maxSide);
        BufferedImage enhanced = clahe(gray, 8, 8, 2.0);
        return new PreparedImage(bytes, mime, gray, enhanced, src.getWidth(), src.getHeight());
    }

    /** Cắt vùng theo toạ độ tỉ lệ [0..1] và mã hoá PNG. */
    public byte[] cropPng(BufferedImage img, double x0, double y0, double x1, double y1) {
        int w = img.getWidth();
        int h = img.getHeight();
        int px0 = clamp((int) Math.floor(x0 * w), 0, w - 1);
        int py0 = clamp((int) Math.floor(y0 * h), 0, h - 1);
        int px1 = clamp((int) Math.ceil(x1 * w), px0 + 1, w);
        int py1 = clamp((int) Math.ceil(y1 * h), py0 + 1, h);
        BufferedImage sub = img.getSubimage(px0, py0, px1 - px0, py1 - py0);
        BufferedImage copy = new BufferedImage(sub.getWidth(), sub.getHeight(), BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = copy.createGraphics();
        g.drawImage(sub, 0, 0, null);
        g.dispose();
        return toPng(copy);
    }

    public byte[] toPng(BufferedImage img) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Không mã hoá được ảnh PNG", e);
        }
    }

    // ============================================================================================

    private BufferedImage toGray(BufferedImage src, int maxSide) {
        int w = src.getWidth();
        int h = src.getHeight();
        double scale = Math.min(1.0, (double) maxSide / Math.max(w, h));
        int nw = Math.max(1, (int) Math.round(w * scale));
        int nh = Math.max(1, (int) Math.round(h * scale));
        BufferedImage gray = new BufferedImage(nw, nh, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = gray.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
        g.drawImage(src, 0, 0, nw, nh, null);
        g.dispose();
        return gray;
    }

    /**
     * CLAHE đơn giản: chia ảnh thành lưới tiles, cân bằng histogram có giới hạn clip trên từng tile,
     * nội suy song tuyến giữa các tile để tránh hiệu ứng khối.
     */
    private BufferedImage clahe(BufferedImage gray, int tilesX, int tilesY, double clipLimit) {
        int w = gray.getWidth();
        int h = gray.getHeight();
        if (w < tilesX * 8 || h < tilesY * 8) return gray;

        byte[] px = new byte[w * h];
        gray.getRaster().getDataElements(0, 0, w, h, px);

        int tileW = (int) Math.ceil((double) w / tilesX);
        int tileH = (int) Math.ceil((double) h / tilesY);
        int[][][] lut = new int[tilesY][tilesX][256];

        for (int ty = 0; ty < tilesY; ty++) {
            for (int tx = 0; tx < tilesX; tx++) {
                int x0 = tx * tileW, y0 = ty * tileH;
                int x1 = Math.min(x0 + tileW, w), y1 = Math.min(y0 + tileH, h);
                int[] hist = new int[256];
                int count = 0;
                for (int y = y0; y < y1; y++) {
                    int row = y * w;
                    for (int x = x0; x < x1; x++) {
                        hist[px[row + x] & 0xFF]++;
                        count++;
                    }
                }
                if (count == 0) {
                    for (int i = 0; i < 256; i++) lut[ty][tx][i] = i;
                    continue;
                }
                int limit = Math.max(1, (int) (clipLimit * count / 256.0));
                int excess = 0;
                for (int i = 0; i < 256; i++) {
                    if (hist[i] > limit) {
                        excess += hist[i] - limit;
                        hist[i] = limit;
                    }
                }
                int add = excess / 256;
                int rem = excess % 256;
                for (int i = 0; i < 256; i++) hist[i] += add + (i < rem ? 1 : 0);
                long cdf = 0;
                for (int i = 0; i < 256; i++) {
                    cdf += hist[i];
                    lut[ty][tx][i] = (int) Math.min(255, Math.round(cdf * 255.0 / count));
                }
            }
        }

        byte[] outPx = new byte[w * h];
        for (int y = 0; y < h; y++) {
            double gy = (y + 0.5) / tileH - 0.5;
            int ty0 = clamp((int) Math.floor(gy), 0, tilesY - 1);
            int ty1 = clamp(ty0 + 1, 0, tilesY - 1);
            double fy = clamp01(gy - ty0);
            int row = y * w;
            for (int x = 0; x < w; x++) {
                double gx = (x + 0.5) / tileW - 0.5;
                int tx0 = clamp((int) Math.floor(gx), 0, tilesX - 1);
                int tx1 = clamp(tx0 + 1, 0, tilesX - 1);
                double fx = clamp01(gx - tx0);
                int v = px[row + x] & 0xFF;
                double top = lut[ty0][tx0][v] * (1 - fx) + lut[ty0][tx1][v] * fx;
                double bottom = lut[ty1][tx0][v] * (1 - fx) + lut[ty1][tx1][v] * fx;
                outPx[row + x] = (byte) clamp((int) Math.round(top * (1 - fy) + bottom * fy), 0, 255);
            }
        }
        BufferedImage out = new BufferedImage(w, h, BufferedImage.TYPE_BYTE_GRAY);
        out.getRaster().setDataElements(0, 0, w, h, outPx);
        return out;
    }

    private static int clamp(int v, int lo, int hi) {
        return Math.max(lo, Math.min(hi, v));
    }

    private static double clamp01(double v) {
        return Math.max(0, Math.min(1, v));
    }
}

