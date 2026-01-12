// 博客发布服务器
// 使用: node blog-publisher-server.js

const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const app = express();
const PORT = 3000;

// 配置路径
const BLOG_ROOT = path.join(__dirname, 'blog');
const POSTS_DIR = path.join(BLOG_ROOT, 'content', 'posts');
const IMAGES_DIR = path.join(BLOG_ROOT, 'static', 'images', 'posts');

// 确保目录存在
async function ensureDirectories() {
    await fs.mkdir(POSTS_DIR, { recursive: true });
    await fs.mkdir(IMAGES_DIR, { recursive: true });
}

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        if (file.fieldname === 'coverImage' || file.fieldname === 'articleImages') {
            await ensureDirectories();
            cb(null, IMAGES_DIR);
        } else {
            cb(null, POSTS_DIR);
        }
    },
    filename: (req, file, cb) => {
        // 保持原始文件名
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// 提供静态文件服务（用于访问 HTML 页面）
app.use(express.static(__dirname));

// 启用 CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());

// 生成 Front Matter
function generateFrontMatter(data) {
    const date = new Date(data.date);
    const dateStr = date.toISOString().replace('Z', '+08:00');
    const lastmodStr = new Date().toISOString().replace('Z', '+08:00');
    
    const categories = JSON.parse(data.categories || '[]');
    const tags = JSON.parse(data.tags || '[]');

    let frontMatter = '---\n';
    frontMatter += `title: "${data.title}"\n`;
    frontMatter += `date: ${dateStr}\n`;
    frontMatter += `lastmod: ${lastmodStr}\n`;
    frontMatter += `draft: ${data.draft === 'true'}\n`;
    frontMatter += `author: "${data.author || 'YEYUbaka'}"\n`;
    frontMatter += `description: "${data.description}"\n`;

    if (tags.length > 0) {
        frontMatter += 'tags:\n';
        tags.forEach(tag => {
            frontMatter += `  - ${tag}\n`;
        });
    }

    if (categories.length > 0) {
        frontMatter += 'categories:\n';
        categories.forEach(cat => {
            frontMatter += `  - ${cat}\n`;
        });
    }

    if (data.coverImage) {
        const coverFileName = data.coverImage;
        frontMatter += 'cover:\n';
        frontMatter += `  image: "images/posts/${coverFileName}"\n`;
        frontMatter += `  alt: "${data.coverAlt || coverFileName}"\n`;
        frontMatter += `  caption: ""\n`;
        frontMatter += `  relative: true\n`;
    }

    frontMatter += `featured: ${data.featured === 'true'}\n`;
    frontMatter += `showToc: ${data.showToc === 'true'}\n`;
    frontMatter += `tocOpen: ${data.tocOpen === 'true'}\n`;
    frontMatter += '---\n\n';

    return frontMatter;
}

// 生成文件名
function generateFileName(title, date) {
    const dateStr = new Date(date).toISOString().slice(0, 10);
    const titleSlug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
    return `${dateStr}-${titleSlug}.md`;
}

// 发布接口
app.post('/api/publish', upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'articleImages', maxCount: 10 }
]), async (req, res) => {
    try {
        await ensureDirectories();

        const { title, author, description, date, draft, featured, showToc, tocOpen, coverAlt, categories, tags, markdown } = req.body;

        if (!title || !description || !markdown) {
            return res.status(400).json({ error: '缺少必填字段' });
        }

        // 处理封面图片
        let coverImageName = null;
        if (req.files && req.files.coverImage) {
            coverImageName = req.files.coverImage[0].filename;
        }

        // 处理文章图片
        const articleImageNames = [];
        if (req.files && req.files.articleImages) {
            req.files.articleImages.forEach(file => {
                articleImageNames.push(file.filename);
            });
        }

        // 生成 Front Matter
        const frontMatter = generateFrontMatter({
            title,
            author,
            description,
            date,
            draft,
            featured,
            showToc,
            tocOpen,
            coverAlt,
            categories,
            tags,
            coverImage: coverImageName
        });

        // 生成文件名
        const fileName = generateFileName(title, date);
        const filePath = path.join(POSTS_DIR, fileName);

        // 保存 Markdown 文件
        const fullContent = frontMatter + markdown;
        await fs.writeFile(filePath, fullContent, 'utf8');

        // 可选：自动构建博客
        const autoBuild = process.env.AUTO_BUILD === 'true';
        if (autoBuild) {
            try {
                const blogPath = BLOG_ROOT;
                const { stdout, stderr } = await execAsync('hugo --minify', { cwd: blogPath });
                console.log('Hugo 构建成功:', stdout);
            } catch (error) {
                console.error('Hugo 构建失败:', error.message);
            }
        }

        res.json({
            success: true,
            message: '发布成功！',
            file: fileName,
            path: filePath,
            images: {
                cover: coverImageName,
                articles: articleImageNames
            }
        });

    } catch (error) {
        console.error('发布错误:', error);
        res.status(500).json({ error: '发布失败: ' + error.message });
    }
});

// 获取已发布的文章列表
app.get('/api/posts', async (req, res) => {
    try {
        const files = await fs.readdir(POSTS_DIR);
        const posts = files
            .filter(file => file.endsWith('.md'))
            .map(file => ({
                name: file,
                path: path.join(POSTS_DIR, file)
            }));
        res.json({ posts });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 启动服务器
async function startServer() {
    await ensureDirectories();
    
    app.listen(PORT, () => {
        console.log('========================================');
        console.log('  博客发布服务器已启动');
        console.log('========================================');
        console.log(`  地址: http://localhost:${PORT}`);
        console.log(`  发布页面: http://localhost:${PORT}/blog-publisher.html`);
        console.log(`  博客目录: ${BLOG_ROOT}`);
        console.log(`  文章目录: ${POSTS_DIR}`);
        console.log(`  图片目录: ${IMAGES_DIR}`);
        console.log('');
        console.log('  提示:');
        console.log(`  - 在浏览器中访问 http://localhost:${PORT}/blog-publisher.html`);
        console.log('  - 设置环境变量 AUTO_BUILD=true 可自动构建博客');
        console.log('========================================');
    });
}

startServer().catch(console.error);

