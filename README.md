# Google Authenticator 兩步驟驗證實作範例

## 使用說明

### 產生讓使用者掃的 QRCode
[POST] http://localhost:9999/2fa_create
需帶入 uid: {"uid":"579548"}

### 第一次驗證使用者輸入的 token 
[POST] http://localhost:9999/2fa_verify
需帶入 uid, token: {"token":"3031153","uid":"579548"}

### 第一次驗證完成之後，每次使用者登入時的 token 驗證
[POST] http://localhost:9999/2fa_auth
需帶入 uid, token: {"token":"3031153","uid":"579548"}