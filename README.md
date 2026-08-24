# 再購入ツール — Streamlit 部署版

## 專案檔案

- `streamlit_app.py`：Streamlit 入口程式
- `index.html`：工具畫面
- `styles.css`：介面樣式
- `app.js`：CSV 讀取、分析、預覽及下載功能
- `requirements.txt`：Python 套件
- `.streamlit/config.toml`：Streamlit 設定

## 部署到 GitHub／Streamlit Community Cloud

1. 將這個資料夾內的所有檔案上傳到 GitHub repository。
2. 開啟 https://share.streamlit.io/ 並登入。
3. 選擇 `Create app`。
4. 選擇 GitHub repository 與 `main` branch。
5. Main file path 填入 `streamlit_app.py`。
6. 按下 Deploy。

## 使用方式

1. 開啟部署完成的 Streamlit 網址。
2. 點擊「上傳 CSV 檔」。
3. 選擇 `upload file_2025_2026_6_900_一+新舊_受注ID去重.csv` 或其他相同格式的 CSV。
4. 設定商品名稱、目標新客年月、販促代碼及回購期間。
5. 點擊「開始分析與篩選」。
6. 分別下載回購與未回購名單。

CSV 會在使用者瀏覽器內處理，不會預先放入 GitHub repository。
