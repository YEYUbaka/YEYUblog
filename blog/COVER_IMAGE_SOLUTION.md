# 封面图片显示问题解决方案

## 问题分析

由于 `baseURL = 'http://localhost:1313/blog/'`，图片路径需要特殊处理。

Hugo 的 `absURL` 函数行为：
- 如果路径以 `/` 开头，它会被视为网站根目录的绝对路径
- `absURL("/images/posts/cover.png")` → `http://localhost:1313/images/posts/cover.png` ❌
- 但实际文件在 `http://localhost:1313/blog/images/posts/cover.png` ✅

## 解决方案

### 方案 1：使用相对路径（推荐）

```yaml
cover:
  image: "images/posts/cover.png"  # 不带前导斜杠
  alt: "封面描述"
  relative: true
```

**优点：** 自动适配 baseURL，本地和生产环境都可用

### 方案 2：修改 baseURL（如果可能）

将 `config.toml` 中的 baseURL 改为：
```toml
baseURL = 'http://localhost:1313/'
```

然后使用：
```yaml
cover:
  image: "/images/posts/cover.png"
  alt: "封面描述"
  relative: false
```

**注意：** 这会影响所有链接，需要确保与部署环境一致

### 方案 3：使用完整路径（当前方案）

```yaml
cover:
  image: "/images/posts/cover.png"
  alt: "封面描述"
  relative: false
```

但需要修改主题模板或使用自定义配置。

## 推荐配置

**当前最佳方案：**

```yaml
cover:
  image: "images/posts/cover.png"
  alt: "欢迎"
  relative: true
```

这样无论 baseURL 是什么，都能正确显示。

## 验证步骤

1. 重启 Hugo 服务器：
   ```powershell
   # 停止当前服务器（Ctrl+C）
   hugo server -D
   ```

2. 在浏览器中访问文章页面

3. 如果图片仍不显示，检查浏览器控制台的网络请求：
   - 打开开发者工具（F12）
   - 查看 Network 标签
   - 找到图片请求，查看实际请求的 URL
   - 与预期 URL 对比

4. 直接访问图片 URL 测试：
   - http://localhost:1313/blog/images/posts/cover.png
   - 如果可以直接访问，说明文件位置正确

## 如果仍然不显示

1. **检查文件是否存在：**
   ```powershell
   Test-Path "blog\static\images\posts\cover.png"
   ```

2. **检查 Hugo 是否复制了文件：**
   ```powershell
   Test-Path "blog\public\images\posts\cover.png"
   ```

3. **清理并重新构建：**
   ```powershell
   cd blog
   Remove-Item -Path "public" -Recurse -Force
   hugo --minify
   ```

4. **查看生成的 HTML：**
   在浏览器中查看页面源代码，找到 `<img>` 标签，检查 `src` 属性

