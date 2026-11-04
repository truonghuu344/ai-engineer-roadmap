# Lộ trình AI Engineer

Website tĩnh gồm lộ trình học AI Engineer (11 giai đoạn, 42 bài), các trang lý thuyết tương tác và notebook thực hành có ô tự chấm.

| File | Nội dung |
|---|---|
| `index.html` | Lộ trình, checklist tiến độ (lưu trong trình duyệt) |
| `bai01.html` | Bài 1 · Mạng nơ-ron học thế nào |
| `diffusion-gd1.html` | Dự án Diffusion · Giai đoạn 1 |
| `notebooks.html` | Danh sách notebook để tải |
| `notebooks/` | Các file `.ipynb` (bài tập và lời giải) |

## Mở trên máy

Giải nén rồi mở `index.html` bằng Chrome, Edge hoặc Firefox. Không cần cài gì thêm. Font chữ tải từ Google Fonts nên cần có mạng để hiển thị đúng font; không có mạng trang vẫn chạy bằng font hệ thống.

Khi mở trực tiếp từ máy (đường dẫn `file://`), một số trình duyệt mở notebook thay vì tải về. Khi đó lấy file trong thư mục `notebooks/`. Trên GitHub Pages nút tải hoạt động bình thường.

## Đưa lên mạng bằng GitHub Pages (miễn phí)

1. Tạo repo mới trên GitHub, ví dụ `ai-engineer-roadmap`.
2. Tải toàn bộ file trong thư mục này lên repo (kéo thả vào trang repo, hoặc `git add . && git commit -m "site" && git push`).
3. Vào **Settings → Pages**, phần *Build and deployment* chọn **Deploy from a branch**, branch `main`, thư mục `/ (root)`, bấm **Save**.
4. Sau khoảng 1 phút, website có địa chỉ `https://<tên-github>.github.io/ai-engineer-roadmap/`.

## Lưu ý về tiến độ

Tiến độ (các ô đã tích, bài tính tay đã giải, điểm kiểm tra) lưu trong `localStorage` của trình duyệt: mỗi trình duyệt, mỗi máy có tiến độ riêng, và xóa dữ liệu trình duyệt sẽ mất tiến độ.
