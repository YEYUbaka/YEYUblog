# 菜单 404 问题修复说明

## 问题原因

菜单配置中的 URL 包含了 `/blog/` 前缀，但 `baseURL` 已经设置为 `http://localhost:1313/blog/`，导致路径重复：
- 配置：`url = "/blog/posts/"`
- baseURL：`http://localhost:1313/blog/`
- 最终 URL：`http://localhost:1313/blog/blog/posts/` ❌（路径重复）

## 解决方案

由于 `baseURL` 已包含 `/blog/`，菜单 URL 应该使用相对路径（相对于 baseURL）：

### 修复后的配置

```toml
[menu]
  [[menu.main]]
    url = "/"           # → http://localhost:1313/blog/
    url = "/posts/"     # → http://localhost:1313/blog/posts/
    url = "/categories/" # → http://localhost:1313/blog/categories/
    # ... 其他菜单项类似
```

### 返回主页的特殊处理

"返回主页"需要返回到网站根目录（blog 的上一级），所以使用完整 URL：

```toml
[[menu.main]]
  identifier = "main-home"
  name = "返回主页"
  url = "http://localhost:1313/"  # 本地开发
  # 部署时改为：url = "https://yourdomain.com/"
```

## 部署时的注意事项

### 本地开发环境
- baseURL：`http://localhost:1313/blog/`
- 返回主页 URL：`http://localhost:1313/`

### 生产环境
部署前需要更新 `config.toml`：

```toml
baseURL = 'https://yourdomain.com/blog/'

[menu]
  [[menu.main]]
    identifier = "main-home"
    url = "https://yourdomain.com/"  # 更新为实际域名
```

## 验证方法

1. 重启 Hugo 服务器：
   ```powershell
   # 停止当前服务器（Ctrl+C）
   hugo server -D
   ```

2. 点击各个菜单项，检查 URL：
   - 首页：`http://localhost:1313/blog/`
   - 文章：`http://localhost:1313/blog/posts/`
   - 分类：`http://localhost:1313/blog/categories/`
   - 等等...

3. 如果仍然 404，检查：
   - Hugo 是否正确生成了这些页面
   - 查看 `public/` 目录结构
   - 检查浏览器控制台的错误信息

## 常见问题

### 问题 1：某些页面仍然 404

**可能原因：**
- 页面内容不存在（如 `content/about.md`）
- Hugo 没有生成该页面

**解决：**
- 检查 `content/` 目录是否有对应文件
- 运行 `hugo --minify` 查看构建日志

### 问题 2：返回主页链接不正确

**解决：**
- 本地开发使用：`http://localhost:1313/`
- 生产环境使用：`https://yourdomain.com/`
- 或使用相对路径：`../../`（但可能不稳定）

