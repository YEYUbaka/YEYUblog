# 文章目录

在这里创建您的博客文章。

## 创建新文章

使用 Hugo 命令创建新文章：

```powershell
hugo new posts/2025-01-15-文章标题.md
```

## Front Matter 模板

创建文章时，Hugo 会自动使用 `archetypes/default.md` 作为模板。

### 标准 Front Matter 格式

```yaml
---
title: "文章标题"
date: 2025-01-15T10:00:00+08:00
lastmod: 2025-01-15T10:00:00+08:00
draft: false
author: "您的名字"
description: "文章摘要，用于 SEO 和列表展示，建议 150 字以内"
tags:
  - 标签1
  - 标签2
categories:
  - 分类1
封面图片（可选）
cover:
  image: "/images/posts/cover.png"
  alt: "封面图片描述"
  caption: "图片说明（可选）"
  relative: false
featured: false  # 是否在首页推荐
showToc: true  # 是否显示目录
tocOpen: false  # 目录默认是否展开
---
```

## 字段说明

- `title` - 文章标题（必填）
- `date` - 发布日期（必填）
- `lastmod` - 最后修改日期（可选）
- `draft` - 是否为草稿，`false` 表示发布（必填）
- `author` - 作者名称（可选）
- `description` - 文章摘要，用于 SEO（必填）
- `tags` - 标签列表（可选）
- `categories` - 分类列表（可选）
- `cover` - 封面图片配置（可选，如果图片不存在请注释掉）
- `featured` - 是否在首页推荐（可选）
- `showToc` - 是否显示文章目录（可选）

## 封面图片

### 如何添加封面图片

1. 将图片放到 `static/images/posts/` 目录
2. 在文章 Front Matter 中取消注释并配置：

```yaml
cover:
  image: "/images/posts/your-image.jpg"
  alt: "图片描述"
  relative: false
```

### 如果图片不存在

如果配置了封面但图片文件不存在，页面会显示占位符。解决方法：
- 添加对应的图片文件
- 或者注释掉 `cover` 配置

## 图片存放

将文章图片放在 `static/images/posts/` 目录，然后在文章中使用：

```markdown
![图片描述](/images/posts/图片文件名.jpg)
```
