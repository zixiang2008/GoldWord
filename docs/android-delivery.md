# Android 本地构建与安全配置

GoldWord 2.0 使用 Capacitor 8、JDK 21、Android API 36，最低支持 Android 7（API 24）。

## API 设置

- 默认基础地址：`https://api.caisheng.art/v1`
- API Key 只在应用“个人中心 → GPT 服务设置”中填写，保存在当前设备的应用数据中。
- 源码、GitHub、CI 和 APK 均不包含默认 Key。聊天或其他公开位置出现过的 Key 应先轮换。
- 可配置备用 OpenAI 兼容源、备用模型、独立 Key 与 3–120 秒超时。主源网络错误、限流或服务端错误时自动尝试备用源。
- Android 正式包只允许 HTTPS；本地 HTTP 调试请使用 Web 版，或在专门的调试清单中显式放行。

## 构建

```bash
npm ci
npm test
npx cap sync android
cd android && ./gradlew assembleDebug
```

调试 APK 使用 Android 自动生成的 debug 证书签名，可直接侧载测试。正式发布必须使用所有者自己的长期 release keystore，并通过环境变量传入路径、别名和密码；keystore 与密码不得提交到 Git。

## 平板连续播放检查

1. 安装 APK，首次启动后确认系统已安装英语和中文 TTS 语音包。
2. 依次测试 `英1`、`英1中1`、`英2`、`英2中1` 四种模式。
3. 开启自动播放至少 20 张卡，确认朗读结束后才翻面/换词，无重叠、无卡死。
4. 切到后台再回前台，继续/暂停各一次；关闭自动播放时应立即停止原生和 Web TTS。
5. 在无网状态确认词卡与 TTS 可用；GPT 功能应显示网络错误但不影响本地学习。
