# 心知天气组件设置指南

参考文档：[心知天气 API 文档](https://docs.seniverse.com/api/weather/now.html)

## 📋 设置步骤

### 步骤 1：注册心知天气账号并获取 API Key

1. 访问 [心知天气官网](https://www.seniverse.com/)
2. 注册一个账号（如果还没有）
3. 登录后，进入控制台
4. 创建应用，获取 **API Key**
5. 免费版每天有 500 次调用限制

### 步骤 2：配置天气组件

1. **编辑 `static/js/weather.js` 文件**

   找到配置部分：
   ```javascript
   const config = {
       apiKey: 'YOUR_API_KEY_HERE',  // 替换为您的 API Key
       location: 'beijing',           // 城市名称
       language: 'zh-Hans',           // 语言
       unit: 'c',                     // 单位：c（摄氏度）或 f（华氏度）
       updateInterval: 30 * 60 * 1000, // 更新间隔（30分钟）
   };
   ```
   
   修改为您的配置：
   ```javascript
   const config = {
       apiKey: '您的实际API_Key',
       location: 'beijing',  // 或 'shanghai', 'guangzhou' 等
       language: 'zh-Hans',
       unit: 'c',
       updateInterval: 30 * 60 * 1000,
   };
   ```

2. **启用天气组件**

   编辑 `config.toml`，找到天气配置部分：
   ```toml
   [params.weather]
     enable = false  # 改为 true
   ```
   
   改为：
   ```toml
   [params.weather]
     enable = true
   ```

### 步骤 3：自定义配置（可选）

在 `static/js/weather.js` 中可以修改以下配置：

```javascript
const config = {
    apiKey: '您的API_Key',
    location: 'beijing',        // 城市名称或城市ID
    language: 'zh-Hans',       // zh-Hans（简体）、zh-Hant（繁体）、en（英文）
    unit: 'c',                 // c（摄氏度）或 f（华氏度）
    updateInterval: 30 * 60 * 1000,  // 更新间隔（毫秒）
    containerId: 'weather-widget'    // 容器ID
};
```

## 🎨 样式定制

天气组件会自动适配夜间模式。如果需要自定义样式，可以：

1. **修改内联样式**

   编辑 `static/js/weather.js`，找到样式部分（`style.textContent`），修改 CSS。

2. **添加自定义 CSS**

   在 `static/css/custom.css` 中添加：
   ```css
   #weather-widget {
       /* 自定义样式 */
       margin: 10px 0;
       border-radius: 8px;
   }
   ```
   
   然后在 `config.toml` 中引入：
   ```toml
   [params]
     customCSS = ["css/custom.css"]
   ```

## 📍 位置调整

天气组件默认显示在导航栏下方。如果需要调整位置，可以编辑 `layouts/partials/header.html`：

```html
{{- if site.Params.weather.enable }}
<div id="weather-widget" style="position: fixed; top: 10px; right: 10px; z-index: 1000;"></div>
{{- end }}
```

## ✅ 验证

1. 重启 Hugo 服务器：
   ```powershell
   # 停止当前服务器（Ctrl+C）
   hugo server -D
   ```

2. 刷新浏览器，检查天气组件是否显示

3. 打开浏览器控制台（F12），查看是否有错误信息

4. 如果显示正常，说明配置成功！

## 🐛 常见问题

### 问题 1：天气组件不显示

**可能原因：**
- API Key 未配置或配置错误
- `enable` 未设置为 `true`
- JavaScript 文件路径错误
- 网络请求失败（CORS 问题）

**解决方法：**
- 检查 `static/js/weather.js` 中的 `apiKey` 是否正确
- 检查 `config.toml` 中 `params.weather.enable` 是否为 `true`
- 查看浏览器控制台是否有错误信息
- 检查网络请求是否成功

### 问题 2：显示"天气数据加载失败"

**可能原因：**
- API Key 无效或已过期
- 城市名称不正确
- API 调用次数超限（免费版每天 500 次）
- 网络问题

**解决方法：**
- 验证 API Key 是否正确
- 检查城市名称是否正确（支持中文和英文）
- 查看心知天气控制台的调用统计
- 检查网络连接

### 问题 3：城市名称不支持

**解决方法：**
- 使用城市ID代替城市名称
- 参考 [心知天气城市列表](https://docs.seniverse.com/api/start/common.html#地点-location)
- 或使用经纬度坐标

### 问题 4：样式不协调

**解决方法：**
- 修改 `static/js/weather.js` 中的样式代码
- 添加自定义 CSS
- 调整颜色和字体大小

## 📚 API 参数说明

### location（地点）

支持以下格式：
- 城市名称：`beijing`, `shanghai`, `guangzhou`
- 城市ID：`WX4FBXXFKE4F`（心知天气城市ID）
- 经纬度：`39.9042:116.4074`
- IP地址：`ip`（自动定位）

### language（语言）

- `zh-Hans` - 简体中文（默认）
- `zh-Hant` - 繁体中文
- `en` - 英文
- `ja` - 日文
- 等等...

### unit（单位）

- `c` - 摄氏度（默认）
- `f` - 华氏度

## 📊 API 返回数据说明

天气组件会显示以下信息：
- **城市名称**：从 API 返回的 `location.name`
- **温度**：`now.temperature`
- **天气现象**：`now.text`（如：晴、多云、雨等）
- **天气图标**：根据 `now.code` 自动匹配

更多字段说明请参考 [API 文档](https://docs.seniverse.com/api/weather/now.html)

## 💡 提示

1. **免费版限制**：每天 500 次调用，请合理设置更新间隔
2. **更新间隔**：建议设置为 30 分钟或更长，避免频繁调用
3. **错误处理**：组件会自动处理错误，失败时显示错误信息
4. **缓存**：可以考虑添加本地缓存，减少 API 调用

## 🔗 参考资源

- [心知天气官网](https://www.seniverse.com/)
- [API 文档](https://docs.seniverse.com/api/weather/now.html)
- [城市列表](https://docs.seniverse.com/api/start/common.html#地点-location)
- [账号注册](https://www.seniverse.com/register)

---

**提示：** 心知天气免费版每天有 500 次调用限制，请合理使用。如需更多调用次数，可以升级到付费版本。
