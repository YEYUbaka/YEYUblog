# 封面图片路径修复说明

## 问题原因

由于 `baseURL` 设置为 `http://localhost:1313/blog/`，封面图片路径需要正确配置才能显示。

## 解决方案

### 方案 1：使用完整路径（推荐）

```yaml
cover:
  image: "/blog/images/posts/cover.png"
  alt: "封面描述"
  relative: false
```

**说明：**
- 路径以 `/blog/` 开头（与 baseURL 的路径部分匹配）
- `relative: false` 表示使用绝对路径

### 方案 2：使用相对路径

```yaml
cover:
  image: "images/posts/cover.png"
  alt: "封面描述"
  relative: true
```

**说明：**
- 路径不以 `/` 开头
- `relative: true` 表示相对于当前页面

## 路径规则

### 本地开发（baseURL = `http://localhost:1313/blog/`）

- ✅ `/blog/images/posts/cover.png` + `relative: false`
- ✅ `images/posts/cover.png` + `relative: true`

### 生产环境（baseURL = `https://yourdomain.com/blog/`）

- ✅ `/blog/images/posts/cover.png` + `relative: false`
- ✅ `images/posts/cover.png` + `relative: true`

## 图片位置

图片文件应放在：
```
blog/static/images/posts/cover.png
```

Hugo 会将 `static/` 目录的内容复制到网站根目录，所以：
- `static/images/posts/cover.png` → `/images/posts/cover.png`（网站根目录）
- 但由于 baseURL 是 `/blog/`，实际访问路径是 `/blog/images/posts/cover.png`

## 验证方法

1. 检查图片文件是否存在：
   ```powershell
   Test-Path "blog\static\images\posts\cover.png"
   ```

2. 在浏览器中直接访问：
   - 本地：http://localhost:1313/blog/images/posts/cover.png
   - 如果可以直接访问，说明路径配置正确

3. 查看页面源代码，检查 `<img>` 标签的 `src` 属性是否正确

## 常见问题

### 问题 1：图片显示为占位符

**原因：** 路径配置错误或文件不存在

**解决：**
- 检查文件是否存在
- 验证路径格式是否正确
- 尝试在浏览器中直接访问图片 URL

### 问题 2：图片路径 404

**原因：** baseURL 配置与路径不匹配

**解决：**
- 确保路径包含 baseURL 的路径部分（`/blog/`）
- 或使用相对路径并设置 `relative: true`

### 问题 3：部署后图片不显示

**原因：** 生产环境的 baseURL 与本地不同

**解决：**
- 部署前更新 `config.toml` 中的 `baseURL`
- 确保路径配置与 baseURL 匹配

