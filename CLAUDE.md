# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个个人主页 + Hugo 博客的组合项目，部署在 Windows 服务器上（阿里云），使用 Caddy 作为 Web 服务器。

## 项目架构

```
yeyubakahome_Web/
├── index.html              # 主页（静态 HTML，使用 Bing 壁纸 + 一言 API）
├── about.html              # 关于页面
├── resume.html/pdf         # 简历
├── assets/                 # 主页静态资源（CSS、JS、图片、字体）
│   └── json/images.json    # Bing 壁纸 URL（由 GitHub Action 每日更新）
├── blog/                   # Hugo 博客子项目
│   ├── config.toml         # Hugo 配置（baseURL: https://yeyubaka.top/blog/）
│   ├── content/posts/      # Markdown 文章
│   ├── static/images/      # 博客静态图片
│   ├── themes/paper/       # PaperMod 主题
│   ├── layouts/            # 自定义布局覆盖
│   └── public/             # Hugo 构建输出（部署用）
├── blog-publisher-server.js    # 博客发布 API 服务器（Express，端口 3000）
├── blog-comments-server.js     # 评论系统 API 服务器（Express，端口 3001）
├── Caddyfile               # Caddy 反向代理配置
└── .github/workflows/      # GitHub Action（获取 Bing 壁纸）
```

## 常用命令

### Hugo 博客开发
```powershell
# 本地开发预览（包含草稿）
cd blog
hugo server -D

# 构建静态文件
hugo --minify

# 创建新文章
hugo new posts/2025-01-15-文章标题.md
```

### 部署
```powershell
# 一键构建并部署博客到服务器
.\deploy-blog.ps1

# 同步所有文件到服务器
.\sync-files.ps1

# 同步主页文件
.\sync-homepage.ps1
```

### 服务器端服务
```powershell
# 启动博客发布服务器（端口 3000）
node blog-publisher-server.js

# 启动评论系统服务器（端口 3001）
node blog-comments-server.js

# 启动 Caddy（需要管理员权限）
caddy run --config Caddyfile
```

## 关键配置

### 服务器路径
- 网站根目录：`C:\web\home`
- 博客目录：`C:\web\home\blog`
- 评论数据：`C:\web\home\blog\data\comments\comments.json`

### 域名配置
- 主站：`https://yeyubaka.top/`
- 博客：`https://yeyubaka.top/blog/`
- 评论 API：通过 Caddy 反向代理到 `localhost:3001`

### Hugo 博客配置要点
- 主题：PaperMod（目录名为 `paper`）
- 语言：中文（`languageCode = 'zh-cn'`）
- 菜单 URL 不需要 `/blog/` 前缀（baseURL 已包含）
- 评论系统通过 `[params.comments]` 配置

## 文章 Front Matter 模板

```yaml
---
title: "文章标题"
date: 2025-01-15T10:00:00+08:00
draft: false
author: "YEYUbaka"
description: "文章描述"
tags:
  - 标签1
categories:
  - 分类1
cover:
  image: "images/posts/cover.jpg"
  alt: "封面描述"
  relative: true
---
```

## 注意事项

- 图片放在 `blog/static/images/posts/`，引用时使用 `images/posts/文件名`
- 文章设置 `draft: false` 才会发布
- 修改博客后需要运行 `hugo --minify` 重新构建
- 服务器部署路径与本地开发路径不同，注意 `deploy-blog.ps1` 中的路径配置
