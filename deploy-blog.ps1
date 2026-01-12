# 博客一键部署脚本
# 自动构建并同步博客到服务器

param(
    [string]$LocalPath = $PSScriptRoot,
    [string]$ServerPath = "C:\web\home",
    [string]$ServerCommentsPath = "C:\web\comments",
    [string]$BlogBaseURL = "https://yeyubaka.top/blog/"
)

function Write-Step($msg) {
    Write-Host "`n==== $msg ====" -ForegroundColor Cyan
}

function Write-Success($msg) {
    Write-Host "✓ $msg" -ForegroundColor Green
}

function Write-Error($msg) {
    Write-Host "✗ $msg" -ForegroundColor Red
}

function Write-Info($msg) {
    Write-Host "→ $msg" -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  博客一键部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查本地路径
Write-Step "检查路径"
if (-not (Test-Path $LocalPath)) {
    Write-Error "本地路径不存在: $LocalPath"
    exit 1
}
Write-Success "本地路径: $LocalPath"

if (-not (Test-Path $ServerPath)) {
    Write-Error "服务器路径不存在: $ServerPath"
    Write-Info "请确认服务器上的网站根目录路径"
    exit 1
}
Write-Success "服务器路径: $ServerPath"

# 第一步：构建博客
Write-Step "构建博客"
$blogPath = Join-Path $LocalPath "blog"

if (-not (Test-Path $blogPath)) {
    Write-Error "未找到 blog 目录"
    exit 1
}

# 检查 Hugo 是否安装
if (-not (Get-Command hugo -ErrorAction SilentlyContinue)) {
    Write-Error "未找到 Hugo，无法构建博客"
    Write-Info "请先安装 Hugo 并加入 PATH"
    Write-Info "下载地址: https://gohugo.io/installation/"
    exit 1
}

Push-Location $blogPath
try {
    Write-Info "正在构建博客..."
    Write-Info "BaseURL: $BlogBaseURL"
    & hugo --minify --baseURL $BlogBaseURL
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "博客构建失败"
        Pop-Location
        exit 1
    }
    
    Write-Success "博客构建成功"
    
    # 检查 public 目录
    $publicPath = Join-Path $blogPath "public"
    if (-not (Test-Path $publicPath)) {
        Write-Error "构建后未找到 public 目录"
        Pop-Location
        exit 1
    }
    
    $fileCount = (Get-ChildItem -Path $publicPath -Recurse -File).Count
    Write-Info "生成了 $fileCount 个文件"
    
} catch {
    Write-Error "构建博客时出错: $_"
    Pop-Location
    exit 1
} finally {
    Pop-Location
}

# 第二步：同步博客文件到服务器
Write-Step "同步博客文件到服务器"

$blogPublicPath = Join-Path $blogPath "public"
$blogServerPath = Join-Path $ServerPath "blog"

try {
    # 备份旧文件（可选）
    if (Test-Path $blogServerPath) {
        $backupPath = Join-Path $ServerPath "blog-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Write-Info "备份旧文件到: $backupPath"
        Copy-Item $blogServerPath -Destination $backupPath -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    # 清空目标目录
    if (Test-Path $blogServerPath) {
        Write-Info "清空旧文件..."
        Remove-Item "$blogServerPath\*" -Recurse -Force -ErrorAction SilentlyContinue
    } else {
        New-Item -ItemType Directory -Path $blogServerPath -Force | Out-Null
    }
    
    # 复制构建后的文件
    Write-Info "正在复制文件到服务器..."
    Copy-Item "$blogPublicPath\*" -Destination $blogServerPath -Recurse -Force
    Write-Success "博客文件已同步到服务器"
    
    # 统计文件数量
    $syncedCount = (Get-ChildItem -Path $blogServerPath -Recurse -File).Count
    Write-Info "已同步 $syncedCount 个文件"
    
} catch {
    Write-Error "同步博客文件失败: $_"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "访问博客:" -ForegroundColor Yellow
Write-Host "  https://yeyubaka.top/blog/" -ForegroundColor White
Write-Host ""
Write-Host "提示:" -ForegroundColor Yellow
Write-Host "  - 如果看不到新文章，请清除浏览器缓存（Ctrl+F5）" -ForegroundColor White
Write-Host "  - 确保文章日期不是未来日期" -ForegroundColor White
Write-Host "  - 确保文章设置了 draft: false" -ForegroundColor White
Write-Host ""

