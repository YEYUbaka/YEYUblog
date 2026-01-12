# YEYUblog

我的个人主页 + Hugo 博客项目。

**在线访问：[yeyubaka.top](https://yeyubaka.top)**

## 项目介绍

这是一个融合了个人主页和博客系统的网站项目：

- **主页**：基于 [dmego/home.github.io](https://github.com/dmego/home.github.io) 二次开发，添加了个人定制内容
- **博客**：使用 Hugo 静态网站生成器 + PaperMod 主题，自己用 Cursor 搭建

## 功能特性

### 主页
- Bing 每日壁纸（通过 GitHub Action 自动更新）
- 一言 API 随机句子
- APlayer 音乐播放器
- 响应式设计，支持移动端

### 博客
- Hugo 静态博客
- PaperMod 主题
- 文章分类、标签、归档
- 自定义评论系统
- 心知天气组件

## 技术栈

| 组件 | 技术 |
|------|------|
| 主页 | HTML + CSS + JavaScript |
| 博客 | Hugo + PaperMod 主题 |
| 服务器 | 阿里云 + Caddy |
| 自动化 | GitHub Actions |

## 项目结构

```
YEYUblog/
├── index.html              # 主页
├── about.html              # 关于页面
├── blog/                   # Hugo 博客
│   ├── config.toml         # 博客配置
│   ├── content/posts/      # 文章目录
│   ├── themes/paper/       # PaperMod 主题
│   └── layouts/            # 自定义布局
├── assets/                 # 静态资源
│   ├── css/
│   ├── js/
│   └── img/
└── .github/workflows/      # GitHub Actions
```

## 本地开发

### 环境要求
- [Hugo Extended](https://gohugo.io/installation/) v0.110+
- Node.js v18+（可选，用于评论服务）

### 运行主页
```bash
npx http-server -p 8080
# 访问 http://localhost:8080
```

### 运行博客
```bash
cd blog
hugo server -D
# 访问 http://localhost:1313/blog/
```

### 构建博客
```bash
cd blog
hugo --minify
```

### 创建新文章
```bash
cd blog
hugo new posts/2025-01-15-文章标题.md
```

## 配置说明

### GitHub Action 配置（Bing 壁纸自动更新）

1. 在 [GitHub Settings > Tokens](https://github.com/settings/tokens) 创建 Personal Access Token
   - Expiration 选择 `No expiration`
   - 勾选 `repo` 权限
2. 在仓库 Settings > Secrets > Actions 中添加 `GH_TOKEN`，值为上一步生成的 Token

### 心知天气配置

1. 在 [心知天气](https://www.seniverse.com/) 注册并获取 API Key
2. 编辑 `blog/static/js/weather.js`，修改配置：
   ```javascript
   const config = {
       apiKey: '你的API_Key',
       location: 'wuhan',  // 城市名
       // ...
   };
   ```
3. 在 `blog/config.toml` 中启用：
   ```toml
   [params.weather]
     enable = true
   ```

### 文章 Front Matter 模板

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

## 致谢

- 主页模板：[dmego/home.github.io](https://github.com/dmego/home.github.io)
- 博客主题：[PaperMod](https://github.com/adityatelange/hugo-PaperMod)
- 一言 API：[hitokoto.cn](https://hitokoto.cn/)
- 天气服务：[心知天气](https://www.seniverse.com/)
- 音乐播放器：[APlayer](https://aplayer.js.org/)

## License

MIT License
