# 数据迁移脚本：将 content/ 目录数据上传到对应 COS 桶
param(
    [string]$Region = "ap-guangzhou",
    [string]$AppId = ""
)

if (-not $AppId) {
    Write-Host "Error: Please provide AppId with -AppId parameter" -ForegroundColor Red
    exit 1
}

Write-Host "=== Migrating data to COS ===" -ForegroundColor Cyan

# 迁移笔记
Write-Host "Uploading notes..." -ForegroundColor Yellow
coscmd config -b "personal-site-notes-$AppId" -r $Region
if (Test-Path "content/notes") {
    Get-ChildItem "content/notes/*.mdx" | ForEach-Object {
        # 将 MDX 转为 JSON 格式上传（需要手动处理）
        Write-Host "  Note: $($_.Name) (manual conversion needed)"
    }
}

# 迁移书签
Write-Host "Uploading bookmarks..." -ForegroundColor Yellow
coscmd config -b "personal-site-bookmarks-$AppId" -r $Region
if (Test-Path "content/bookmarks.json") {
    coscmd upload content/bookmarks.json /bookmarks.json
}

# 迁移作品集
Write-Host "Uploading portfolio..." -ForegroundColor Yellow
coscmd config -b "personal-site-portfolio-$AppId" -r $Region
if (Test-Path "content/portfolio.json") {
    coscmd upload content/portfolio.json /portfolio.json
}

# 迁移生活记录
Write-Host "Uploading life records..." -ForegroundColor Yellow
coscmd config -b "personal-site-life-$AppId" -r $Region
if (Test-Path "content/life.json") {
    coscmd upload content/life.json /life-posts.json
}

# 初始化设置桶
Write-Host "Initializing settings..." -ForegroundColor Yellow
coscmd config -b "personal-site-settings-$AppId" -r $Region

# 创建默认设置文件
$defaultSettings = '{"backgroundColor":"#0a0a0a","glassOpacity":0.1}'
$defaultLayout = '{"order":["profile","music","datetime","essay","works","notes","life","bookmarks","techstack"]}'
$defaultTheme = '{"mode":"dark"}'
$defaultEssays = '[]'
$defaultProfile = '{"name":"","bio":"","links":[]}'

$defaultSettings | Out-File -Encoding utf8 "temp-site-settings.json"
$defaultLayout | Out-File -Encoding utf8 "temp-card-layout.json"
$defaultTheme | Out-File -Encoding utf8 "temp-theme.json"
$defaultEssays | Out-File -Encoding utf8 "temp-essays.json"
$defaultProfile | Out-File -Encoding utf8 "temp-profile.json"

coscmd upload temp-site-settings.json /site-settings.json
coscmd upload temp-card-layout.json /card-layout.json
coscmd upload temp-theme.json /theme.json
coscmd upload temp-essays.json /essays.json
coscmd upload temp-profile.json /profile.json

# 清理临时文件
Remove-Item temp-*.json

# 初始化音乐配置
Write-Host "Initializing music config..." -ForegroundColor Yellow
coscmd config -b "personal-site-music-$AppId" -r $Region
$musicConfig = '{"playlistId":"60198","playMode":"loop","volume":0.7}'
$musicConfig | Out-File -Encoding utf8 "temp-music-config.json"
coscmd upload temp-music-config.json /config.json
Remove-Item temp-music-config.json

Write-Host "=== Migration complete! ===" -ForegroundColor Green
