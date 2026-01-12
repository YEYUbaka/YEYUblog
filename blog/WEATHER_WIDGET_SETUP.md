# 心知天气插件设置指南

参考文档：[心知天气插件使用文档](https://docs.seniverse.com/widget/start/usage.html)

## 📋 两种使用方式

### 方式一：使用官方插件（推荐，最简单）

官方插件无需自己处理 API 调用，不会有 CORS 问题，使用更简单。

#### 步骤 1：生成插件代码

1. 访问 [心知天气插件生成页面](https://www.seniverse.com/widget)
2. 选择插件样式（固定极简、浮动气泡等）
3. 配置插件参数（城市、样式、位置等）
4. 点击"生成代码"
5. 复制生成的完整代码

#### 步骤 2：集成到博客

**方法 A：在 extend_head.html 中直接添加**

编辑 `blog/layouts/partials/extend_head.html`，找到天气组件部分，取消注释并替换：

```html
{{- if site.Params.weather.enable }}
<script>
// 将官网生成的代码粘贴到这里
(function(d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) return;
    js = d.createElement(s);
    js.id = id;
    js.src = "https://widget.seniverse.com/weather-widget.js";
    js.charset = "utf-8";
    fjs.parentNode.insertBefore(js, fjs);
}(document, "script", "seniverse-weather-widget"));
</script>
{{- end }}
```

**方法 B：使用独立的 JS 文件**

1. 将生成的代码保存到 `blog/static/js/weather-widget.js`
2. 在 `extend_head.html` 中引入：
   ```html
   {{- if site.Params.weather.enable }}
   <script src="{{ "js/weather-widget.js" | relURL }}"></script>
   {{- end }}
   ```

#### 步骤 3：确保容器存在

容器已在 `header.html` 中配置：
```html
<div id="tp-weather-widget"></div>
```

这是官方插件的默认容器 ID。

#### 步骤 4：启用插件

编辑 `config.toml`：
```toml
[params.weather]
  enable = true
```

### 方式二：使用 API 方式（当前方式）

如果继续使用 API 方式，需要：
- 确保 API Key 正确
- 确保城市名称格式正确
- 处理可能的 CORS 问题

## 🎨 插件样式选择

心知天气提供多种插件样式：

1. **固定极简** - 固定在页面指定位置
2. **浮动气泡** - 可拖动的浮动窗口
3. **其他样式** - 根据需求选择

## 📍 插件位置配置

### 在生成插件时配置

在插件生成页面可以设置：
- 水平位置：left, center, right
- 垂直位置：top, middle, bottom
- 是否固定：fixed 或 relative

### 通过 CSS 自定义

如果需要更精细的控制，可以在 `static/css/custom.css` 中添加：

```css
#tp-weather-widget {
    /* 自定义位置和样式 */
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 1000;
}
```

## ✅ 验证步骤

1. **生成插件代码**
   - 访问 https://www.seniverse.com/widget
   - 配置并生成代码

2. **集成代码**
   - 将代码添加到 `extend_head.html` 或 `weather-widget.js`

3. **启用插件**
   - 设置 `params.weather.enable = true`

4. **重启 Hugo**
   ```powershell
   hugo server -D
   ```

5. **查看效果**
   - 刷新浏览器
   - 检查插件是否正常显示

## 🔄 从 API 方式切换到插件方式

如果您想从当前的 API 方式切换到官方插件：

1. **备份当前配置**
   ```powershell
   copy static\js\weather.js static\js\weather.js.backup
   ```

2. **生成插件代码**
   - 访问插件生成页面
   - 生成代码

3. **更新 extend_head.html**
   - 注释掉 `weather.js` 的引用
   - 添加官方插件代码

4. **更新容器 ID**
   - 确保使用 `tp-weather-widget`（已在 header.html 中配置）

## 💡 优势对比

### 官方插件优势
- ✅ 无需处理 API 调用
- ✅ 无 CORS 问题
- ✅ 样式丰富，可自定义
- ✅ 自动更新
- ✅ 使用简单

### API 方式优势
- ✅ 完全自定义
- ✅ 可以获取更多数据
- ✅ 可以自定义显示逻辑

## 🔗 参考资源

- [插件使用文档](https://docs.seniverse.com/widget/start/usage.html)
- [插件生成页面](https://www.seniverse.com/widget)
- [个性化配置](https://docs.seniverse.com/widget/start/personalize.html)

---

**推荐：** 使用官方插件方式，更简单可靠！

