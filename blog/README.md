# 博客模块

这是基于 Hugo 的静态博客系统。

## 快速开始

### 1. 安装 Hugo

访问 [Hugo 官网](https://gohugo.io/installation/) 下载 Hugo Extended 版本。

**Windows 安装方式：**

1. 使用 Chocolatey：
   ```powershell
   choco install hugo-extended
   ```

2. 手动安装：
   - 下载：https://github.com/gohugoio/hugo/releases
   - 选择 `hugo_extended_X.X.X_windows-amd64.zip`
   - 解压到 `C:\Hugo\`
   - 添加到系统 PATH

3. 验证安装：
   ```powershell
   hugo version
   ```

### 2. 初始化项目（首次使用）

```powershell
cd blog
hugo new site . --force
```

### 3. 安装主题

**方式一：使用安装脚本（推荐）**

```powershell
.\install-theme.ps1
```

**方式二：手动克隆**

```powershell
cd themes
git clone https://github.com/adityatelange/hugo-PaperMod.git paper
```

**方式三：手动下载**

1. 访问：https://github.com/adityatelange/hugo-PaperMod
2. 点击 "Code" → "Download ZIP"
3. 解压到 `themes/paper/` 目录

### 4. 本地开发

```powershell
hugo server -D
```

访问：http://localhost:1313/blog/

### 5. 构建静态文件

```powershell
hugo --minify
```

生成的文件在 `public/` 目录。

## 目录说明

- `content/` - Markdown 文章
- `themes/` - 主题文件
- `static/` - 静态资源（图片等）
- `public/` - 生成的静态文件（部署用）
- `config.toml` - Hugo 配置文件

## 编写文章

### 创建新文章

```powershell
hugo new posts/2025-01-15-文章标题.md
```

### 文章 Front Matter 模板

见 `content/posts/_template.md`

## 部署

使用 `deploy-blog.ps1` 脚本自动部署。

