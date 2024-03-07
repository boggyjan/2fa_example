import express from 'express'
import speakeasy from 'speakeasy'
import qrcode from 'qrcode'

const app = express()
app.use(express.json())

// 測試用資料
const users = {
  '579548': {
    nickname: 'Bob Dylan',
    temp_2fa_secret: null,
    two_fa_secret: null
  }
}

// 建立 google authenticator 用的 qrcode
// post 需傳入 uid
app.post('/2fa_create', (req, res) => {
  const uid = req.body.uid
  const user = users[uid]

  if (uid && user) {
    const secret = speakeasy.generateSecret({ name: `網站名稱:${user.nickname}` })
    // 將 secret 存入 user.temp_2fa_secret
    // 作為等待驗證 token 的 secret
    user.temp_2fa_secret = secret.base32

    qrcode.toDataURL(secret.otpauth_url, (err, imageUrl) => {
      if (err) {
        console.error('Error generating QR code:', err)
        return
      }
      res.send(`2FA QRCode: <img src="${imageUrl}">`)
    })
  } else {
    res.status(404).send('error!')
  }
})

// 驗證使用者輸入的 google authenticator token 是否正確
// post 需傳入 uid, token
app.post('/2fa_verify', (req, res) => {
  const userToken = req.body.token // OTP entered by the user
  const uid = req.body.uid
  const user = users[uid]

  if (userToken && uid && user && user.temp_2fa_secret) {
    const secret = user.temp_2fa_secret
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: userToken,
      window: 1 // Allow a time window of 1 unit (default is 0)
    })

    if (verified) {
      // 驗證成功時，將 user.temp_2fa_secret 存到 user.two_fa_secret
      // 將 user.temp_2fa_secret 設為 null
      // 這樣就紀錄了使用者第一次驗證成功，啟用了兩步驟登入
      user.two_fa_secret = user.temp_2fa_secret
      user.temp_2fa_secret = null
      res.send('OTP verified successfully. Two-factor authentication enabled!')

      console.log(users)
    } else {
      res.status(401).send('OTP verification failed. Please try again.')
    }
  } else {
    res.status(404).send('error!')
  }
})

// 每次登入時的兩步驟驗證
// post 需傳入 uid, token
app.post('/2fa_auth', (req, res) => {
  const userToken = req.body.token // OTP entered by the user
  const uid = req.body.uid
  const user = users[uid]

  if (userToken && uid && user && user.two_fa_secret) {
    const secret = user.two_fa_secret
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: userToken,
      window: 1 // Allow a time window of 1 unit (default is 0)
    })

    if (verified) {
      // 登入成功
      res.send('Authed!')
    } else {
      // 登入失敗
      res.status(401).send('Auth Failed.')
    }
  } else {
    res.status(404).send('error!')
  }
})

app.listen(9999)