# FollowUp - 客戶管理系統 PWA

一個離線客戶管理與跟進系統的 Progressive Web App (PWA)。

## 功能特色

- 📱 可安裝為原生應用程式
- 🔄 離線工作能力
- 💾 本地資料儲存
- 📊 客戶評估與跟進管理
- 📤 資料匯出/匯入功能
- 🖨️ 報表列印功能
- 📱 **智能 QR 碼生成** - 自動檢測虛擬環境並生成可掃描的 QR 碼

## 快速開始

### 方法一：使用啟動腳本（推薦）

1. 確保你已安裝 Python 3.x
2. 在終端機中執行：
   ```bash
   ./start.sh
   ```
3. 開啟瀏覽器前往 `https://localhost:8000`
4. 按照螢幕指示安裝 PWA

### 方法二：手動啟動

1. 安裝 Python 3.x
2. 在專案目錄中執行：
   ```bash
   python3 -m http.server 8000
   ```
3. 開啟瀏覽器前往 `http://localhost:8000`

### 使用自訂埠號

```bash
# 使用埠號 9001
./start.sh 9001

# 自動殺死佔用埠號的程序
./start.sh 9001 --kill-port

# 使用預設埠號但自動殺死佔用程序
./start.sh --kill-port
```

## 📱 iPhone 快速連接

### 方法一：QR 碼掃描（推薦）

1. **生成 QR 碼：**
   ```bash
   python3 qr-generator.py
   ```

2. **用 iPhone 掃描：**
   - 開啟 iPhone 相機
   - 對準終端機中的 QR 碼
   - 點擊通知開啟網址
   - 接受安全警告
   - 點擊分享按鈕 📤 → 加入主畫面

### 方法二：手動輸入網址

1. **查看網路網址：**
   ```bash
   ./show-qr.sh
   ```

2. **在 iPhone Safari 中輸入：**
   - 開啟 Safari
   - 輸入顯示的網址（例如：`https://192.168.0.111:8000`）
   - 接受安全警告
   - 點擊分享按鈕 📤 → 加入主畫面

## 安裝為 PWA

### Chrome/Edge 瀏覽器

1. 開啟應用程式網址
2. 在網址列右側尋找安裝圖示 ⚙️
3. 點擊「安裝 FollowUp」
4. 確認安裝

### Safari (iOS)

1. 開啟應用程式網址
2. 點擊分享按鈕 📤
3. 選擇「加入主畫面」
4. 確認加入

### Android Chrome

1. 開啟應用程式網址
2. 點擊選單按鈕 ⋮
3. 選擇「安裝應用程式」
4. 確認安裝

## 系統需求

- 現代瀏覽器（Chrome 67+, Firefox 67+, Safari 11.1+, Edge 79+）
- 支援 Service Workers
- 支援 Web App Manifest
- Python 3.x（用於 QR 碼生成和本地伺服器）

## 專案結構

```
FollowUp/
├── index.html          # 主頁面
├── manifest.json       # PWA 設定檔
├── sw.js              # Service Worker
├── start.sh           # 智能啟動腳本
├── show-qr.sh         # QR 碼顯示腳本
├── qr-generator.py    # 智能 QR 碼生成器
├── .gitignore         # Git 忽略檔案
├── icons/             # 應用程式圖示
├── js/                # JavaScript 檔案
├── styles/            # CSS 樣式檔案
└── README.md          # 說明文件
```

## 安全性注意事項

### SSL 憑證

⚠️ **重要：請勿將 SSL 憑證檔案上傳到版本控制系統！**

- `localhost.pem` 和 `localhost-key.pem` 是本地開發用的自簽憑證
- 這些檔案已加入 `.gitignore`，不會被 Git 追蹤
- 每次在新環境中執行 `./start.sh` 時會自動重新生成
- 這些憑證僅用於本地 HTTPS 測試，不適合生產環境

### 資料安全

- 所有客戶資料儲存在瀏覽器的 IndexedDB 中
- 資料不會上傳到任何伺服器
- 請定期備份重要資料（使用匯出功能）

## 開發

### 本地開發

1. 複製專案到本地
2. 執行 `./start.sh`
3. 開啟瀏覽器開發者工具進行除錯

### QR 碼生成器

智能 QR 碼生成器會自動處理 Python 套件安裝：

```bash
# 自動檢測並使用現有虛擬環境
python3 qr-generator.py

# 如果沒有虛擬環境，會自動建立並安裝必要套件
```

**功能特色：**
- 🔍 自動檢測現有虛擬環境
- ⚡ 使用現有環境（如果可用）
- 🔧 自動建立新環境（如果需要）
- 📦 自動安裝 qrcode 套件
- ❌ 清晰的錯誤訊息

### 部署

1. 將所有檔案上傳到支援 HTTPS 的網頁伺服器
2. 確保 `manifest.json` 和 `sw.js` 在根目錄
3. 測試 PWA 安裝功能

## 故障排除

### PWA 無法安裝

- 確保使用 HTTPS 連線
- 檢查瀏覽器是否支援 PWA
- 確認 `manifest.json` 格式正確

### 離線功能無法使用

- 檢查 Service Worker 是否正確註冊
- 確認瀏覽器支援 Service Workers
- 清除瀏覽器快取後重試

### 資料遺失

- 檢查瀏覽器的 IndexedDB 設定
- 確認瀏覽器未處於無痕模式
- 檢查儲存空間是否充足

### 埠號被佔用

```bash
# 檢查埠號使用情況
lsof -i :8000

# 殺死佔用埠號的程序
./start.sh --kill-port

# 使用不同埠號
./start.sh 9001
```

### QR 碼生成問題

```bash
# 如果 QR 碼生成失敗，手動建立虛擬環境
python3 -m venv venv
source venv/bin/activate
pip install qrcode[pil]
python3 qr-generator.py
```

### iPhone 連接問題

1. **確保在同一 WiFi 網路：**
   - 電腦和 iPhone 必須連接同一個 WiFi 網路

2. **檢查防火牆設定：**
   - 確保埠號 8000 沒有被防火牆阻擋

3. **使用正確的網址：**
   - 使用網路 IP 地址，不是 localhost
   - 例如：`https://192.168.0.111:8000`

## 授權

此專案僅供學習和個人使用。

## 支援

如有問題，請檢查瀏覽器開發者工具的控制台訊息。 