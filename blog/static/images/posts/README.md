# 文章图片目录

将文章的封面图片和内容图片放在这个目录下。

## 目录结构

```
static/images/posts/
├── hello-world.jpg      # 示例文章封面
├── article-1-cover.jpg  # 其他文章封面
└── ...
```

## 使用方法

### 1. 添加封面图片

1. 将图片文件（如 `my-article-cover.jpg`）放到此目录
2. 在文章的 Front Matter 中配置：

```yaml
cover:
  image: "/images/posts/my-article-cover.jpg"
  alt: "封面图片描述"
  relative: false
```

### 2. 在文章中使用图片

在 Markdown 内容中引用：

```markdown
![图片描述](/images/posts/my-image.jpg)
```

## 图片要求

- **格式**：推荐 JPG、PNG、WebP
- **尺寸**：封面图片建议 1200x630 像素（16:9 比例）
- **大小**：建议压缩到 200KB 以内，提升加载速度
- **命名**：使用小写字母、数字和连字符，避免空格和中文

## 图片优化工具

- [TinyPNG](https://tinypng.com/) - 在线压缩图片
- [Squoosh](https://squoosh.app/) - Google 图片压缩工具
- [ImageOptim](https://imageoptim.com/) - 批量优化工具

## 注意事项

- 图片路径以 `/images/` 开头（相对于网站根目录）
- 如果图片不存在，封面区域会显示占位符或空白
- 建议为每篇文章准备一张高质量的封面图片

