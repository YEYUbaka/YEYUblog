# Windows 云服务器快速部署脚本
# 使用 IIS 部署静态网站

param(
    [string]$SiteName = "home-blog",
    [int]$Port = 80,
    [string]$SitePath = $PSScriptRoot
)

# 检查是否以管理员身份运行
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "错误: 请以管理员身份运行此脚本！" -ForegroundColor Red
    Write-Host "右键点击 PowerShell，选择'以管理员身份运行'" -ForegroundColor Yellow
    exit 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  个人博客网站部署脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 IIS 是否安装
Write-Host "[1/5] 检查 IIS 安装状态..." -ForegroundColor Yellow
$iisFeature = Get-WindowsFeature -Name Web-Server -ErrorAction SilentlyContinue
if ($null -eq $iisFeature -or $iisFeature.InstallState -ne "Installed") {
    Write-Host "IIS 未安装，正在安装..." -ForegroundColor Yellow
    Install-WindowsFeature -Name Web-Server -IncludeManagementTools
    if ($LASTEXITCODE -ne 0) {
        Write-Host "IIS 安装失败！" -ForegroundColor Red
        exit 1
    }
    Write-Host "IIS 安装成功！" -ForegroundColor Green
} else {
    Write-Host "IIS 已安装" -ForegroundColor Green
}

# 导入 WebAdministration 模块
Write-Host "[2/5] 导入 IIS 管理模块..." -ForegroundColor Yellow
Import-Module WebAdministration -ErrorAction SilentlyContinue
if (-not (Get-Module WebAdministration)) {
    Write-Host "无法导入 WebAdministration 模块！" -ForegroundColor Red
    exit 1
}
Write-Host "模块导入成功" -ForegroundColor Green

# 检查网站路径
Write-Host "[3/5] 检查网站路径..." -ForegroundColor Yellow
if (-not (Test-Path $SitePath)) {
    Write-Host "错误: 网站路径不存在: $SitePath" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path (Join-Path $SitePath "index.html"))) {
    Write-Host "警告: 未找到 index.html 文件" -ForegroundColor Yellow
}
Write-Host "网站路径: $SitePath" -ForegroundColor Green

# 检查网站是否已存在
Write-Host "[4/5] 配置网站..." -ForegroundColor Yellow
$existingSite = Get-Website -Name $SiteName -ErrorAction SilentlyContinue
if ($existingSite) {
    Write-Host "网站 '$SiteName' 已存在，正在删除..." -ForegroundColor Yellow
    Remove-Website -Name $SiteName
}

# 检查端口是否被占用
$portInUse = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "警告: 端口 $Port 已被占用" -ForegroundColor Yellow
    Write-Host "占用端口的进程:" -ForegroundColor Yellow
    $portInUse | ForEach-Object {
        $process = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "  - $($process.ProcessName) (PID: $($process.Id))" -ForegroundColor Yellow
        }
    }
    $continue = Read-Host "是否继续？(Y/N)"
    if ($continue -ne "Y" -and $continue -ne "y") {
        exit 0
    }
}

# 创建网站
try {
    New-WebSite -Name $SiteName -Port $Port -PhysicalPath $SitePath -ErrorAction Stop
    Write-Host "网站创建成功！" -ForegroundColor Green
} catch {
    Write-Host "网站创建失败: $_" -ForegroundColor Red
    exit 1
}

# 设置默认文档
Write-Host "[5/5] 配置默认文档..." -ForegroundColor Yellow
try {
    $defaultDocs = Get-WebConfigurationProperty -Filter "system.webServer/defaultDocument/files" -Name Collection -PSPath "IIS:\Sites\$SiteName"
    $indexExists = $defaultDocs | Where-Object { $_.value -eq "index.html" }
    
    if (-not $indexExists) {
        Add-WebConfigurationProperty -Filter "system.webServer/defaultDocument/files" -Name Collection -Value @{value="index.html"} -PSPath "IIS:\Sites\$SiteName"
        Write-Host "已添加 index.html 为默认文档" -ForegroundColor Green
    } else {
        Write-Host "index.html 已存在" -ForegroundColor Green
    }
    
    # 确保 index.html 在列表顶部
    $allDocs = Get-WebConfigurationProperty -Filter "system.webServer/defaultDocument/files" -Name Collection -PSPath "IIS:\Sites\$SiteName"
    $indexDoc = $allDocs | Where-Object { $_.value -eq "index.html" }
    if ($indexDoc) {
        Clear-WebConfiguration -Filter "system.webServer/defaultDocument/files" -PSPath "IIS:\Sites\$SiteName"
        Add-WebConfigurationProperty -Filter "system.webServer/defaultDocument/files" -Name Collection -Value @{value="index.html"} -PSPath "IIS:\Sites\$SiteName"
        $allDocs | Where-Object { $_.value -ne "index.html" } | ForEach-Object {
            Add-WebConfigurationProperty -Filter "system.webServer/defaultDocument/files" -Name Collection -Value @{value=$_.value} -PSPath "IIS:\Sites\$SiteName"
        }
    }
} catch {
    Write-Host "配置默认文档时出错: $_" -ForegroundColor Yellow
}

# 配置防火墙规则
Write-Host "配置防火墙规则..." -ForegroundColor Yellow
$firewallRule = Get-NetFirewallRule -DisplayName "HTTP-Port-$Port" -ErrorAction SilentlyContinue
if (-not $firewallRule) {
    try {
        New-NetFirewallRule -DisplayName "HTTP-Port-$Port" -Direction Inbound -Protocol TCP -LocalPort $Port -Action Allow -ErrorAction Stop | Out-Null
        Write-Host "防火墙规则已添加" -ForegroundColor Green
    } catch {
        Write-Host "添加防火墙规则失败: $_" -ForegroundColor Yellow
    }
} else {
    Write-Host "防火墙规则已存在" -ForegroundColor Green
}

# 获取服务器 IP 地址
$ipAddresses = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" } | Select-Object -ExpandProperty IPAddress

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  部署完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "网站信息:" -ForegroundColor Yellow
Write-Host "  网站名称: $SiteName" -ForegroundColor White
Write-Host "  端口: $Port" -ForegroundColor White
Write-Host "  路径: $SitePath" -ForegroundColor White
Write-Host ""
Write-Host "访问地址:" -ForegroundColor Yellow
Write-Host "  http://localhost" -ForegroundColor White
if ($ipAddresses) {
    foreach ($ip in $ipAddresses) {
        Write-Host "  http://$ip" -ForegroundColor White
    }
}
Write-Host ""
Write-Host "管理网站:" -ForegroundColor Yellow
Write-Host "  打开 IIS 管理器: 运行 'inetmgr'" -ForegroundColor White
Write-Host "  或使用命令: Get-Website" -ForegroundColor White
Write-Host ""

