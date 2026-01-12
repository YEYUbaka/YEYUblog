// 博客发布服务器（服务器版本）
// 部署到服务器后使用此文件
// 使用: node blog-publisher-server-server.js

const express = require('express');
const multer = require('multer');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const app = express();
const PORT = 3002; // 使用不同端口，避免与评论服务器冲突

// 服务器路径配置
const BLOG_ROOT = path.join('C:', 'web', 'home', 'home.github.io-1.0.7', 'blog');
const POSTS_DIR = path.join(BLOG_ROOT, 'content', 'posts');
const IMAGES_DIR = path.join(BLOG_ROOT, 'static', 'images', 'posts');
const PUBLIC_DIR = path.join(BLOG_ROOT, 'public');
const SERVER_BLOG_DIR = path.join('C:', 'web', 'home', 'blog');
const HOME_DIR = path.join('C:', 'web', 'home'); // 网站根目录

// 确保目录存在
async function ensureDirectories() {
    await fs.mkdir(POSTS_DIR, { recursive: true });
    await fs.mkdir(IMAGES_DIR, { recursive: true });
}

// 清理文件名，处理编码问题
function sanitizeFileName(filename) {
    if (!filename) {
        return Date.now().toString() + '.png';
    }
    
    // 获取文件扩展名
    const ext = path.extname(filename) || '.png';
    // 获取文件名（不含扩展名）
    let name = path.basename(filename, ext);
    
    // 如果文件名已经是乱码，使用时间戳
    // 检查是否包含大量非ASCII字符且看起来像乱码
    const nonAsciiCount = (name.match(/[^\x00-\x7F]/g) || []).length;
    const totalLength = name.length;
    
    // 如果非ASCII字符占比过高且文件名看起来不正常，使用时间戳
    if (totalLength > 0 && nonAsciiCount / totalLength > 0.5 && name.length > 20) {
        console.warn('检测到可能的乱码文件名，使用时间戳:', name);
        name = Date.now().toString();
    } else {
        // 清理文件名
        // 移除 Windows 不允许的字符
        name = name.replace(/[<>:"/\\|?*\x00-\x1F]/g, '');
        
        // 空格替换为连字符
        name = name.replace(/\s+/g, '-');
        
        // 保留中文、字母、数字、连字符和下划线
        name = name.replace(/[^\w\u4e00-\u9fa5\-_]/g, '');
        
        // 多个连字符合并为一个
        name = name.replace(/-+/g, '-');
        
        // 移除开头和结尾的连字符
        name = name.replace(/^-|-$/g, '');
        
        // 如果清理后的名称为空，使用时间戳
        if (!name || name.length === 0) {
            name = Date.now().toString();
        }
        
        // 限制文件名长度（考虑中文字符）
        // 中文字符通常占用更多字节，但这里我们按字符数限制
        if (name.length > 100) {
            name = name.substring(0, 100);
        }
    }
    
    const finalName = name + ext;
    return finalName;
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
        // 清理文件名，避免编码问题
        const cleanName = sanitizeFileName(file.originalname);
        console.log('原始文件名:', file.originalname);
        console.log('清理后文件名:', cleanName);
        cb(null, cleanName);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// 提供静态文件服务（用于访问 HTML 页面）
// 从网站根目录提供 blog-publisher.html
app.use(express.static(HOME_DIR));

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

// 格式化日期为 YYYY-MM-DDTHH:mm:ss+08:00 格式（保持本地时间）
// datetime-local 输入格式: YYYY-MM-DDTHH:mm
function formatLocalDateTime(dateInput) {
    // 如果输入是 datetime-local 格式 (YYYY-MM-DDTHH:mm)，直接解析
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateInput)) {
        // 直接使用输入值，添加秒和时区
        return dateInput + ':00+08:00';
    }
    
    // 否则使用 Date 对象
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+08:00`;
}

// 生成 Front Matter
function generateFrontMatter(data) {
    // 直接使用输入的日期字符串（datetime-local 格式），避免时区转换
    const dateStr = formatLocalDateTime(data.date);
    const lastmodStr = formatLocalDateTime(new Date());
    
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
        // 确保使用相对路径（移除开头的 /）
        const imagePath = coverFileName.startsWith('/') 
            ? coverFileName.substring(1) 
            : (coverFileName.startsWith('images/posts/') 
                ? coverFileName 
                : `images/posts/${coverFileName}`);
        frontMatter += `  image: "${imagePath}"\n`;
        frontMatter += `  relative: true\n`;
        if (data.coverAlt) {
            frontMatter += `  alt: "${data.coverAlt}"\n`;
        }
        console.log('封面图片路径已添加到 Front Matter:', imagePath);
    }

    if (data.featured === 'true') {
        frontMatter += 'featured: true\n';
    }

    if (data.showToc === 'true') {
        frontMatter += 'showToc: true\n';
        if (data.tocOpen === 'true') {
            frontMatter += 'tocOpen: true\n';
        }
    }

    frontMatter += '---\n\n';
    return frontMatter;
}

// 生成文件名
function generateFileName(title, date) {
    const dateObj = new Date(date);
    const dateStr = dateObj.toISOString().split('T')[0];
    const titleSlug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

    return `${dateStr}-${titleSlug}.md`;
}

// 查找 Hugo 可执行文件路径
async function findHugoPath() {
    try {
        // 先尝试直接使用 hugo 命令（检查是否在 PATH 中）
        const { stdout } = await execAsync('hugo version', { shell: true });
        if (stdout && stdout.trim()) {
            console.log('Hugo 在 PATH 中找到');
            return 'hugo';
        }
    } catch (error) {
        console.log('Hugo 不在 PATH 中，尝试查找...');
        // 如果找不到，尝试常见路径
        const commonPaths = [
            'C:\\Hugo\\bin\\hugo.exe',
            'C:\\Program Files\\Hugo\\hugo.exe',
            'C:\\tools\\hugo\\hugo.exe',
            path.join(process.env.USERPROFILE || '', 'Hugo', 'bin', 'hugo.exe')
        ];
        
        for (const hugoPath of commonPaths) {
            try {
                await fs.access(hugoPath);
                console.log('找到 Hugo:', hugoPath);
                return `"${hugoPath}"`;
            } catch (err) {
                continue;
            }
        }
    }
    console.log('使用默认 hugo 命令（假设在 PATH 中）');
    return 'hugo'; // 默认返回，让系统 PATH 处理
}

// 构建博客
async function buildBlog() {
    try {
        console.log('开始构建博客...');
        console.log('博客目录:', BLOG_ROOT);
        
        // 检查博客目录是否存在
        try {
            await fs.access(BLOG_ROOT);
            console.log('博客目录存在');
            
            // 列出目录内容，帮助诊断
            try {
                const dirContents = await fs.readdir(BLOG_ROOT);
                console.log('目录内容:', dirContents.join(', '));
            } catch (err) {
                console.warn('无法读取目录内容:', err.message);
            }
        } catch (err) {
            console.error('博客目录不存在:', BLOG_ROOT);
            console.error('请检查路径配置是否正确');
            return false;
        }
        
        // 检查 config.toml 是否存在
        const configFile = path.join(BLOG_ROOT, 'config.toml');
        try {
            await fs.access(configFile);
            console.log('找到配置文件:', configFile);
        } catch (err) {
            console.error('配置文件不存在:', configFile);
            console.error('');
            console.error('可能的原因:');
            console.error('1. 服务器上只有构建后的文件，没有完整的博客源文件');
            console.error('2. 博客目录路径配置不正确');
            console.error('');
            console.error('解决方案:');
            console.error('1. 如果要在服务器上自动构建，需要上传完整的博客源文件到:');
            console.error('   ' + BLOG_ROOT);
            console.error('   包括: config.toml, content/, themes/, static/ 等');
            console.error('');
            console.error('2. 或者修改 BLOG_ROOT 路径指向正确的博客源文件目录');
            console.error('');
            console.error('3. 如果不需要自动构建，可以在发布时取消勾选"自动构建"选项');
            return false;
        }
        
        // 查找 Hugo 路径
        const hugoPath = await findHugoPath();
        console.log('使用 Hugo:', hugoPath);
        
        const blogBaseURL = 'https://yeyubaka.top/blog/';
        const command = `"${hugoPath}" --minify --baseURL "${blogBaseURL}"`;
        console.log('执行命令:', command);
        console.log('工作目录:', BLOG_ROOT);
        
        const { stdout, stderr } = await execAsync(command, {
            cwd: BLOG_ROOT,
            maxBuffer: 10 * 1024 * 1024, // 10MB buffer
            shell: true,
            env: { ...process.env, PATH: process.env.PATH }
        });
        
        if (stdout) {
            console.log('Hugo 输出:', stdout);
        }
        if (stderr) {
            console.warn('Hugo 警告:', stderr);
        }
        
        // 检查 public 目录是否生成
        try {
            await fs.access(PUBLIC_DIR);
            const files = await fs.readdir(PUBLIC_DIR);
            console.log(`构建成功，生成了 ${files.length} 个文件/目录`);
        } catch (err) {
            console.warn('警告: public 目录未生成或为空');
        }
        
        console.log('Hugo 构建成功');
        return true;
    } catch (error) {
        console.error('Hugo 构建失败:');
        console.error('错误消息:', error.message);
        if (error.stdout) {
            console.error('标准输出:', error.stdout.toString());
        }
        if (error.stderr) {
            console.error('错误输出:', error.stderr.toString());
        }
        if (error.code) {
            console.error('错误代码:', error.code);
        }
        return false;
    }
}

// 同步构建结果到网站目录
async function syncBlogToServer() {
    try {
        console.log('开始同步博客文件到网站目录...');
        
        if (!await fs.access(PUBLIC_DIR).then(() => true).catch(() => false)) {
            console.error('public 目录不存在，请先构建博客');
            return false;
        }

        // 清空目标目录
        if (await fs.access(SERVER_BLOG_DIR).then(() => true).catch(() => false)) {
            const files = await fs.readdir(SERVER_BLOG_DIR);
            for (const file of files) {
                await fs.rm(path.join(SERVER_BLOG_DIR, file), { recursive: true, force: true });
            }
        } else {
            await fs.mkdir(SERVER_BLOG_DIR, { recursive: true });
        }

        // 复制文件
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        // 使用 xcopy 复制（Windows）
        await execAsync(`xcopy /E /I /Y "${PUBLIC_DIR}\\*" "${SERVER_BLOG_DIR}\\"`);
        
        console.log('博客文件已同步到网站目录');
        return true;
    } catch (error) {
        console.error('同步博客文件失败:', error.message);
        return false;
    }
}

// 发布接口
app.post('/api/publish', upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'articleImages', maxCount: 10 }
]), async (req, res) => {
    try {
        await ensureDirectories();

        const { title, author, description, date, draft, featured, showToc, tocOpen, coverAlt, categories, tags, markdown, autoBuild } = req.body;

        if (!title || !description || !markdown) {
            return res.status(400).json({ error: '缺少必填字段' });
        }

        // 处理封面图片
        let coverImageName = null;
        if (req.files && req.files.coverImage) {
            coverImageName = req.files.coverImage[0].filename;
            console.log('封面图片已上传:', coverImageName);
            console.log('封面图片保存路径:', path.join(IMAGES_DIR, coverImageName));
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

        // 修复 Markdown 正文中的图片路径（将绝对路径改为相对路径）
        let processedMarkdown = markdown;
        // 修复 Markdown 图片语法: ![alt](/images/posts/...) -> ![alt](images/posts/...)
        processedMarkdown = processedMarkdown.replace(/!\[([^\]]*)\]\(\/images\/posts\//g, '![$1](images/posts/');
        // 修复 HTML img 标签: <img src="/images/posts/..." -> <img src="images/posts/..."
        processedMarkdown = processedMarkdown.replace(/<img\s+([^>]*\s+)?src=["']\/images\/posts\//g, '<img $1src="images/posts/');

        // 保存 Markdown 文件
        const fullContent = frontMatter + processedMarkdown;
        await fs.writeFile(filePath, fullContent, 'utf8');

        let buildResult = null;
        let syncResult = null;

        // 自动构建和部署（如果启用）
        if (autoBuild === 'true') {
            buildResult = await buildBlog();
            if (buildResult) {
                syncResult = await syncBlogToServer();
            }
        }

        res.json({
            success: true,
            message: '发布成功！' + (buildResult ? ' 博客已自动构建并部署。' : ' 请手动构建并部署。'),
            file: fileName,
            path: filePath,
            images: {
                cover: coverImageName,
                articles: articleImageNames
            },
            build: {
                built: buildResult,
                synced: syncResult
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
    
    app.listen(PORT, '127.0.0.1', () => {
        console.log('========================================');
        console.log('  博客发布工具服务器已启动（服务器版）');
        console.log('========================================');
        console.log(`  地址: http://127.0.0.1:${PORT}`);
        console.log(`  博客目录: ${BLOG_ROOT}`);
        console.log(`  文章目录: ${POSTS_DIR}`);
        console.log(`  图片目录: ${IMAGES_DIR}`);
        console.log('');
        console.log('  功能:');
        console.log('  - 接收文章发布请求');
        console.log('  - 保存 Markdown 文件和图片');
        console.log('  - 可选：自动构建和部署博客');
        console.log('');
        console.log('  提示:');
        console.log('  - 通过 Caddy 反向代理访问');
        console.log('  - 访问地址: https://yeyubaka.top/publisher/');
        console.log('========================================');
    });
}

startServer().catch(console.error);

