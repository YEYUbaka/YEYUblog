#requires -RunAsAdministrator

param(
    [string]$RepoPath      = "C:\web\home",
    [string]$BlogBaseURL   = "https://yeyubaka.top/blog/",
    [string]$WebRoot       = "C:\web\home",
    [string]$SiteName      = "home-blog",
    [int]   $HttpPort      = 80,
    [int]   $HttpsPort     = 443,
    [string[]]$HostNames   = @("yeyubaka.top","www.yeyubaka.top"),
    [string]$CertThumbprint = "2317d651ec588a8757c290609c98bfca67757900"    # 已安装证书指纹，可在 certmgr.msc 的“个人/证书”中查看
)

function Step($msg) { Write-Host "`n==== $msg ====" -ForegroundColor Cyan }

if (-not (Get-Command hugo -ErrorAction SilentlyContinue)) {
    throw "未找到 Hugo，请先安装并加入 PATH。"
}

if (-not (Test-Path $RepoPath)) { throw "仓库路径不存在：$RepoPath" }

# 1. 构建 Hugo
Step "构建 Hugo 博客"
Push-Location (Join-Path $RepoPath "blog")
& hugo --minify --baseURL $BlogBaseURL
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Hugo 构建失败" }
Pop-Location

# 2. 准备 WebRoot
Step "准备部署目录"
if (-not (Test-Path $WebRoot)) { New-Item -ItemType Directory -Path $WebRoot | Out-Null }

Step "同步主页文件"
$exclude = @(".git",".github","blog","node_modules",".vscode",".cursor","deploy-all.ps1")
Get-ChildItem $RepoPath -Force | Where-Object { $exclude -notcontains $_.Name } | ForEach-Object {
    $dest = Join-Path $WebRoot $_.Name
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Copy-Item $_.FullName -Destination $dest -Recurse -Force
}

Step "同步博客静态文件"
$blogDest = Join-Path $WebRoot "blog"
if (Test-Path $blogDest) { Remove-Item $blogDest -Recurse -Force }
Copy-Item (Join-Path $RepoPath "blog\public") -Destination $blogDest -Recurse -Force

# 3. 配置 IIS
Import-Module WebAdministration

Step "创建/更新 IIS 网站"
if (-not (Test-Path "IIS:\Sites\$SiteName")) {
    New-Website -Name $SiteName -PhysicalPath $WebRoot -Port $HttpPort -Force | Out-Null
} else {
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name physicalPath -Value $WebRoot
}

Step "配置主机头绑定"
$existingBindings = (Get-Item "IIS:\Sites\$SiteName").Bindings.Collection
foreach ($host in $HostNames) {
    if (-not ($existingBindings.bindingInformation -contains "*:${HttpPort}:$host")) {
    New-WebBinding -Name $SiteName -Protocol "http" -Port $HttpPort -HostHeader $host | Out-Null
    }
}

if ($CertThumbprint) {
    foreach ($host in $HostNames) {
        if (-not ($existingBindings.bindingInformation -contains "*:${HttpsPort}:$host")) {
            New-WebBinding -Name $SiteName -Protocol "https" -Port $HttpsPort -HostHeader $host | Out-Null
        }
        $bindingPath = "IIS:\SslBindings\0.0.0.0!$HttpsPort!$host"
        if (Test-Path $bindingPath) {
            Remove-Item $bindingPath
        }
        New-Item $bindingPath -Thumbprint $CertThumbprint -SSLFlags 1 | Out-Null
    }
}

# 默认文档
$default = Get-WebConfiguration -Filter "system.webServer/defaultDocument/files/add[@value='index.html']" -PSPath "IIS:\Sites\$SiteName"
if (-not $default) {
    Add-WebConfiguration -Filter "system.webServer/defaultDocument/files" -Value @{value="index.html"} -PSPath "IIS:\Sites\$SiteName"
}

# 4. 防火墙
Step "配置防火墙"
foreach ($port in @($HttpPort,$HttpsPort)) {
    if (-not (Get-NetFirewallRule -DisplayName "Web-$port" -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule -DisplayName "Web-$port" -Direction Inbound -Protocol TCP -LocalPort $port -Action Allow | Out-Null
    }
}

# 5. 重启网站
Step "重启 IIS 网站"
Restart-WebItem "IIS:\Sites\$SiteName"

Write-Host "`n部署完成，可访问: http://$($HostNames[0]) / https://$($HostNames[0])" -ForegroundColor Green

