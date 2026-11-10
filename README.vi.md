# TerraWorld Scripts

Kho script, tài liệu và nơi báo lỗi cho **thư viện script của TerraWorld** (`tw`).

TerraWorld là trình xem và sửa world Terraria chạy trên trình duyệt. Panel **Script** của app chạy các đoạn
JavaScript nhỏ trên world đang mở: đếm block, tìm item trong rương, đánh dấu Life Crystal trên bản đồ, làm báo cáo
có bảng và biểu đồ. Script chạy trong Web Worker cách ly và chỉ giao tiếp với app qua đối tượng toàn cục `tw`.

> **Trạng thái:** API script phiên bản **1**, chưa ổn định hẳn. Tên hàm có thể đổi trước khi chốt.
> Hiện script **chỉ đọc**: phân tích và đánh dấu bản đồ được, chưa sửa world được.

[English](README.md)

## Có gì trong repo

| Đường dẫn | Nội dung |
|---|---|
| [`samples/`](samples) | Script mẫu chính thức (giống menu *Sample scripts* có sẵn trong app) |
| [`community/<tác-giả>/`](community) | Script người dùng đóng góp, mỗi người một thư mục theo tên GitHub |
| [`docs/`](docs) | Hướng dẫn và tài liệu API (tiếng Anh) |
| [`types/`](types) | `terraworld.d.ts` và `jsconfig.json` để có gợi ý và kiểm tra kiểu trong VS Code |

## Cài script

TerraWorld đọc file `.js` và `.mjs` trong thư mục **`twscript`** nằm trong thư mục Terraria:

| Hệ điều hành | Thư mục |
|---|---|
| Windows | `Documents\My Games\Terraria\twscript` |
| macOS | `~/Library/Application Support/Terraria/twscript` |
| Linux | `~/.local/share/Terraria/twscript` |

Tạo thư mục `twscript` nếu chưa có, rồi chọn một trong hai cách:

**Clone repo này vào đó** (cập nhật dễ bằng `git pull`):

```bash
cd "Documents/My Games/Terraria/twscript"
git clone https://github.com/CrabPlayer/terraworld-scripts.git
```

**Hoặc chép từng file**: tải file `.js` bất kỳ trong `samples/` hay `community/` rồi bỏ vào `twscript`.

App đọc như sau:

- File `.js` và `.mjs`, trong tối đa **3 cấp thư mục con**. Bản clone repo này vừa đủ:
  `twscript/terraworld-scripts/community/<tác-giả>/script.js` là 3 cấp.
- Tối đa 300 file, mỗi file tối đa 512 KB. Bỏ qua file/thư mục bắt đầu bằng `.` và `node_modules`.
- Chỉ đọc: app không bao giờ ghi vào thư mục này.

## Chạy script

1. Mở TerraWorld bằng trình duyệt nhân Chromium (Chrome, Edge, Opera…) và nạp một world.
2. Vào **Data → Script** để mở panel Script.
3. Mở **Local scripts**. Lần đầu, chọn thư mục Terraria hoặc thư mục `twscript` và cho phép quyền đọc.
   Nếu World Library đã được cấp quyền thư mục Terraria thì app dùng lại quyền đó.
4. Chọn script. Script được nạp vào ô soạn thảo; bấm **Run** (hoặc <kbd>Ctrl</kbd>+<kbd>Enter</kbd>).
5. Nếu sửa file bằng trình soạn thảo khác, bấm **Reload from disk** để nạp lại.

Firefox và Safari không mở được thư mục trên máy. Trên đó bạn vẫn dán script vào ô soạn thảo để chạy,
hoặc bắt đầu từ menu **Sample scripts**.

## Tài liệu

- [Bắt đầu](docs/getting-started.md): script đầu tiên, từng bước
- [Tham chiếu API](docs/api-reference.md): mọi namespace `tw.*`
- [Khối UI, modal và prompt](docs/ui-blocks.md): `tw.ui`
- [Đánh dấu bản đồ](docs/map-marks.md): `tw.map`
- [Sandbox và giới hạn](docs/sandbox.md): những gì script không làm được
- [Hướng dẫn cho AI](docs/ai-guide.md): dán vào ChatGPT/Claude để nhờ AI viết script
- [Kiểu dữ liệu](types): `terraworld.d.ts`, mô tả chính xác API; khi tài liệu khác `.d.ts` thì `.d.ts` đúng

## Đóng góp

- **Chia sẻ script:** mở pull request thêm `community/<tên-github>/<script>.js`, hoặc dùng form issue
  *Script submission* nếu bạn không dùng Git. Xem [CONTRIBUTING.md](CONTRIBUTING.md).
- **Nhờ viết script:** dùng form issue *Script request*.
- **Báo lỗi** API `tw` hoặc panel Script: dùng form issue *Bug report*.

Mỗi script bắt đầu bằng header:

```js
// @name Mark Life Crystals
// @author ten-github-cua-ban
// @description Marks every Life Crystal on the map and lists the ones closest to spawn.
// @tw-api 1
```

## Giấy phép

[MIT](LICENSE). Khi đóng góp script, bạn đồng ý phát hành script theo cùng giấy phép này.
Terraria là thương hiệu của Re-Logic; dự án này không liên kết với Re-Logic.
