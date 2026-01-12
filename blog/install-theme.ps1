# 安装 Hugo Paper Mod 主题脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  安装 Hugo Paper Mod 主题" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptDir = $PSScriptRoot
if (-not $scriptDir) {
    $scriptDir = Get-Location
}

$themesDir = Join-Path $scriptDir "themes"
$themeDir = Join-Path $themesDir "paper"

# 检查 themes 目录
if (-not (Test-Path $themesDir)) {
    Write-Host "创建 themes 目录..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $themesDir -Force | Out-Null
}

# 检查主题是否已存在
if (Test-Path $themeDir) {
    Write-Host "[警告] 主题目录已存在: $themeDir" -ForegroundColor Yellow
    $overwrite = Read-Host "是否删除并重新安装？(Y/N)"
    if ($overwrite -eq "Y" -or $overwrite -eq "y") {
        Remove-Item -Path $themeDir -Recurse -Force
        Write-Host "已删除旧主题" -ForegroundColor Green
    } else {
        Write-Host "取消安装" -ForegroundColor Yellow
        exit 0
    }
}

# 检查 Git 是否安装
Write-Host "[1/3] 检查 Git..." -ForegroundColor Yellow
try {
    $gitVersion = git --version 2>&1
    Write-Host "Git 版本: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "[错误] 未检测到 Git！" -ForegroundColor Red
    Write-Host ""
    Write-Host "请先安装 Git:" -ForegroundColor Yellow
    Write-Host "1. 访问 https://git-scm.com/download/win" -ForegroundColor White
    Write-Host "2. 下载并安装 Git for Windows" -ForegroundColor White
    Write-Host ""
    Write-Host "或者手动下载主题:" -ForegroundColor Yellow
    Write-Host "1. 访问 https://github.com/adityatelange/hugo-PaperMod" -ForegroundColor White
    Write-Host "2. 点击 Code -> Download ZIP" -ForegroundColor White
    Write-Host "3. 解压到: $themeDir" -ForegroundColor White
    Write-Host ""
    exit 1
}

# 克隆主题
Write-Host "[2/3] 克隆主题..." -ForegroundColor Yellow
try {
    Set-Location $themesDir
    git clone https://github.com/adityatelange/hugo-PaperMod.git paper
    if ($LASTEXITCODE -ne 0) {
        throw "Git 克隆失败"
    }
    Write-Host "主题克隆成功！" -ForegroundColor Green
} catch {
    Write-Host "[错误] 克隆失败: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "请尝试手动下载:" -ForegroundColor Yellow
    Write-Host "1. 访问 https://github.com/adityatelange/hugo-PaperMod" -ForegroundColor White
    Write-Host "2. 点击 Code -> Download ZIP" -ForegroundColor White
    Write-Host "3. 解压到: $themeDir" -ForegroundColor White
    exit 1
}

# 清理 .git 目录（可选，如果不需要版本控制）
Write-Host "[3/3] 清理 Git 历史..." -ForegroundColor Yellow
$gitDir = Join-Path $themeDir ".git"
if (Test-Path $gitDir) {
    $keepGit = Read-Host "是否保留主题的 Git 历史？(Y/N，建议 N)"
    if ($keepGit -ne "Y" -and $keepGit -ne "y") {
        Remove-Item -Path $gitDir -Recurse -Force
        Write-Host "已清理 Git 历史" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  主题安装完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "主题位置: $themeDir" -ForegroundColor White
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "1. 编辑 config.toml，确保 theme = 'paper'" -ForegroundColor White
Write-Host "2. 运行: hugo server -D" -ForegroundColor White
Write-Host "3. 访问: http://localhost:1313/blog/" -ForegroundColor White
Write-Host ""

