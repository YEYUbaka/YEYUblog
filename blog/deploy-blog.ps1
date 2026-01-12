# 博客部署脚本
# 将 Hugo 生成的静态文件部署到 Windows 服务器

param(
    [string]$DeployPath = "..\blog-deploy",
    [string]$WebRoot = "F:\home.github.io-1.0.7\home.github.io-1.0.7"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  博客部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Hugo 是否安装
Write-Host "[1/5] 检查 Hugo..." -ForegroundColor Yellow
try {
    $hugoVersion = hugo version 2>&1
    Write-Host "Hugo 版本: $hugoVersion" -ForegroundColor Green
} catch {
    Write-Host "[错误] 未检测到 Hugo！" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先安装 Hugo Extended:" -ForegroundColor Yellow
    Write-Host "1. 访问 https://gohugo.io/installation/" -ForegroundColor White
    Write-Host "2. 下载 Hugo Extended 版本" -ForegroundColor White
    Write-Host "3. 添加到系统 PATH" -ForegroundColor White
    Write-Host ""
    exit 1
}

# 获取脚本所在目录
$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = Get-Location
}

Set-Location $scriptDir

# 构建 Hugo 站点
Write-Host "[2/5] 构建 Hugo 站点..." -ForegroundColor Yellow
try {
    hugo --minify --cleanDestinationDir
    if ($LASTEXITCODE -ne 0) {
        throw "Hugo 构建失败"
    }
    Write-Host "构建成功！" -ForegroundColor Green
} catch {
    Write-Host "[错误] 构建失败: $_" -ForegroundColor Red
    exit 1
}

# 检查 public 目录
Write-Host "[3/5] 检查生成的文件..." -ForegroundColor Yellow
$publicDir = Join-Path $scriptDir "public"
if (-not (Test-Path $publicDir)) {
    Write-Host "[错误] public 目录不存在！" -ForegroundColor Red
    exit 1
}

$fileCount = (Get-ChildItem -Path $publicDir -Recurse -File).Count
Write-Host "生成了 $fileCount 个文件" -ForegroundColor Green

# 创建部署目录
Write-Host "[4/5] 准备部署目录..." -ForegroundColor Yellow
$blogDeployPath = Join-Path $WebRoot "blog"
if (-not (Test-Path $blogDeployPath)) {
    New-Item -ItemType Directory -Path $blogDeployPath -Force | Out-Null
    Write-Host "创建部署目录: $blogDeployPath" -ForegroundColor Green
} else {
    Write-Host "部署目录已存在: $blogDeployPath" -ForegroundColor Green
}

# 复制文件
Write-Host "[5/5] 复制文件到部署目录..." -ForegroundColor Yellow
try {
    # 备份旧文件（可选）
    $backupPath = Join-Path $WebRoot "blog-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    if (Test-Path $blogDeployPath) {
        Write-Host "备份旧文件到: $backupPath" -ForegroundColor Yellow
        Copy-Item -Path $blogDeployPath -Destination $backupPath -Recurse -Force
    }
    
    # 清空部署目录
    if (Test-Path $blogDeployPath) {
        Remove-Item -Path "$blogDeployPath\*" -Recurse -Force
    }
    
    # 复制新文件
    Copy-Item -Path "$publicDir\*" -Destination $blogDeployPath -Recurse -Force
    Write-Host "文件复制完成！" -ForegroundColor Green
} catch {
    Write-Host "[错误] 复制文件失败: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "部署信息:" -ForegroundColor Yellow
Write-Host "  源目录: $publicDir" -ForegroundColor White
Write-Host "  目标目录: $blogDeployPath" -ForegroundColor White
Write-Host "  文件数量: $fileCount" -ForegroundColor White
Write-Host ""
Write-Host "访问地址:" -ForegroundColor Yellow
Write-Host "  http://localhost/blog/" -ForegroundColor White
Write-Host ""

