// 博客评论系统服务器
// 使用: node blog-comments-server.js
// 要求: Node.js v18+ (内置 fetch) 或安装 node-fetch

const express = require('express');
const fs = require('fs').promises;
const path = require('path');

// 检查是否支持 fetch（Node.js 18+）
let fetch;
try {
    // Node.js 18+ 内置 fetch
    fetch = globalThis.fetch;
} catch (e) {
    // 如果不支持，尝试使用 node-fetch
    try {
        fetch = require('node-fetch');
    } catch (e2) {
        console.error('错误: 需要 Node.js v18+ 或安装 node-fetch');
        console.error('安装 node-fetch: npm install node-fetch');
        process.exit(1);
    }
}

const app = express();
const PORT = 3001;

// 配置路径
const COMMENTS_DIR = path.join('C:', 'web', 'home', 'blog', 'data', 'comments');
const COMMENTS_FILE = path.join(COMMENTS_DIR, 'comments.json');

// 确保目录存在
async function ensureDirectories() {
    await fs.mkdir(COMMENTS_DIR, { recursive: true });
    try {
        await fs.access(COMMENTS_FILE);
    } catch {
        // 文件不存在，创建空文件
        await fs.writeFile(COMMENTS_FILE, JSON.stringify({}, null, 2), 'utf8');
    }
}

// 获取客户端 IP
function getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           req.ip ||
           '127.0.0.1';
}

// IP 地理位置解析
async function getIpLocation(ip) {
    // 跳过本地 IP
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
        return '本地';
    }

    try {
        // 使用免费的 IP 地理位置 API
        // 选项1: ip-api.com (免费，无需 API Key，限制：45次/分钟)
        const response = await fetch(`http://ip-api.com/json/${ip}?lang=zh-CN`);
        const data = await response.json();

        if (data.status === 'success') {
            // 如果是中国，返回省份
            if (data.countryCode === 'CN') {
                return data.regionName || data.city || '中国';
            } else {
                // 其他国家返回国家名
                return data.country || '未知';
            }
        }
    } catch (error) {
        console.error('IP 地理位置解析失败:', error.message);
    }

    // 备用方案：使用 ipapi.co (需要注册，但这里作为备用)
    try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();

        if (!data.error) {
            if (data.country_code === 'CN') {
                return data.region || data.city || '中国';
            } else {
                return data.country_name || '未知';
            }
        }
    } catch (error) {
        console.error('备用 IP 解析失败:', error.message);
    }

    return '未知';
}

// 读取评论数据
async function readComments() {
    try {
        const data = await fs.readFile(COMMENTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            // 文件不存在，尝试创建
            console.log('评论文件不存在，正在创建...');
            try {
                await ensureDirectories();
                const data = await fs.readFile(COMMENTS_FILE, 'utf8');
                return JSON.parse(data);
            } catch (createError) {
                console.error('创建评论文件失败:', createError);
                return {};
            }
        } else {
            console.error('读取评论文件失败:', error);
            return {};
        }
    }
}

// 保存评论数据
async function saveComments(comments) {
    try {
        await fs.writeFile(COMMENTS_FILE, JSON.stringify(comments, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('保存评论文件失败:', error);
        return false;
    }
}

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

// 根路径 - 显示服务器信息
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>博客评论系统 API</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 800px;
            width: 100%;
        }
        h1 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 2em;
        }
        .status {
            display: inline-block;
            padding: 5px 15px;
            background: #28a745;
            color: white;
            border-radius: 20px;
            font-size: 0.9em;
            margin-bottom: 30px;
        }
        .api-section {
            margin-top: 30px;
            padding-top: 30px;
            border-top: 2px solid #e0e0e0;
        }
        .api-endpoint {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
        }
        .method {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.85em;
            margin-right: 10px;
        }
        .method.get { background: #28a745; color: white; }
        .method.post { background: #007bff; color: white; }
        code {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 0.9em;
        }
        .note {
            background: #fff3cd;
            border: 1px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
            color: #856404;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📝 博客评论系统 API</h1>
        <span class="status">● 运行中</span>
        <p style="color: #666; margin-top: 10px;">评论系统服务器已成功启动</p>
        
        <div class="api-section">
            <h2>API 接口</h2>
            
            <div class="api-endpoint">
                <span class="method get">GET</span>
                <strong>/api/comments</strong>
                <p style="margin-top: 10px; color: #666;">获取指定文章的评论列表</p>
                <p style="margin-top: 5px;"><code>?postId=/blog/posts/文章路径/</code></p>
            </div>
            
            <div class="api-endpoint">
                <span class="method post">POST</span>
                <strong>/api/comments</strong>
                <p style="margin-top: 10px; color: #666;">提交新评论</p>
                <p style="margin-top: 5px;"><code>Content-Type: application/json</code></p>
            </div>
            
            <div class="api-endpoint">
                <span class="method get">GET</span>
                <strong>/api/comments/all</strong>
                <p style="margin-top: 10px; color: #666;">获取所有评论（管理用）</p>
            </div>
        </div>
        
        <div class="note">
            <strong>提示：</strong>这是 API 服务器，不提供网页界面。请在博客文章页面使用评论功能。
        </div>
    </div>
</body>
</html>
    `);
});

// 获取评论列表
app.get('/api/comments', async (req, res) => {
    try {
        const postId = req.query.postId;
        if (!postId) {
            return res.status(400).json({ error: '缺少 postId 参数' });
        }

        const comments = await readComments();
        const postComments = comments[postId] || [];

        // 按时间倒序排列
        postComments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({
            success: true,
            comments: postComments,
            count: postComments.length
        });
    } catch (error) {
        console.error('获取评论失败:', error);
        res.status(500).json({ error: '获取评论失败' });
    }
});

// 提交评论
app.post('/api/comments', async (req, res) => {
    try {
        const { postId, postTitle, name, content } = req.body;

        if (!postId || !name || !content) {
            return res.status(400).json({ error: '缺少必填字段' });
        }

        // 验证输入
        if (name.length > 50) {
            return res.status(400).json({ error: '昵称过长' });
        }
        if (content.length > 1000) {
            return res.status(400).json({ error: '评论内容过长' });
        }

        // 获取客户端 IP
        const clientIp = getClientIp(req);
        console.log(`收到评论请求，IP: ${clientIp}`);

        // 解析 IP 地理位置
        const location = await getIpLocation(clientIp);
        console.log(`IP ${clientIp} 地理位置: ${location}`);

        // 读取现有评论
        const comments = await readComments();
        if (!comments[postId]) {
            comments[postId] = [];
        }

        // 创建新评论
        const newComment = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            postId: postId,
            postTitle: postTitle || '',
            name: name.trim(),
            content: content.trim(),
            location: location,
            ip: clientIp,
            createdAt: new Date().toISOString()
        };

        // 添加到评论列表
        comments[postId].push(newComment);

        // 保存评论
        const saved = await saveComments(comments);
        if (!saved) {
            return res.status(500).json({ error: '保存评论失败' });
        }

        console.log(`评论已保存: ${newComment.id}`);

        res.json({
            success: true,
            message: '评论发表成功',
            comment: {
                id: newComment.id,
                name: newComment.name,
                content: newComment.content,
                location: newComment.location,
                createdAt: newComment.createdAt
            }
        });

    } catch (error) {
        console.error('提交评论失败:', error);
        res.status(500).json({ error: '提交评论失败: ' + error.message });
    }
});

// 获取所有评论（管理用）
app.get('/api/comments/all', async (req, res) => {
    try {
        const comments = await readComments();
        res.json({
            success: true,
            comments: comments,
            totalPosts: Object.keys(comments).length
        });
    } catch (error) {
        console.error('获取所有评论失败:', error);
        res.status(500).json({ error: '获取评论失败' });
    }
});

// 启动服务器
async function startServer() {
    await ensureDirectories();
    
    // 监听 localhost（127.0.0.1），允许 Caddy 反向代理连接
    app.listen(PORT, '127.0.0.1', () => {
        console.log('========================================');
        console.log('  博客评论系统服务器已启动');
        console.log('========================================');
        console.log(`  地址: http://localhost:${PORT}`);
        console.log(`  评论数据: ${COMMENTS_FILE}`);
        console.log('');
        console.log('  API 接口:');
        console.log('  - GET  /api/comments?postId=xxx 获取评论');
        console.log('  - POST /api/comments 提交评论');
        console.log('  - GET  /api/comments/all 获取所有评论');
        console.log('');
        console.log('  提示:');
        console.log('  - 确保博客配置中启用了评论功能');
        console.log('  - 在 config.toml 中添加:');
        console.log('    [params.comments]');
        console.log('      apiUrl = "http://localhost:3001"');
        console.log('========================================');
    });
}

startServer().catch(console.error);

