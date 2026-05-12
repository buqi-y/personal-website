# 腾讯云 COS 部署脚本
# 使用前请确保已安装 coscmd: pip install coscmd
# 并配置好: coscmd config -a <SecretId> -s <SecretKey> -b <bucket> -r <region>

param(
    [string]$Region = "ap-shanghai",
    [string]$Bucket = "personal-site-static",
    [string]$AppId = ""
)

if (-not $AppId) {
    Write-Host "Error: Please provide AppId with -AppId parameter" -ForegroundColor Red
    exit 1
}

$FullBucket = "$Bucket-$AppId"

Write-Host "=== Building static site ===" -ForegroundColor Cyan
pnpm build

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "=== Uploading to COS: $FullBucket ===" -ForegroundColor Cyan
coscmd config -b $FullBucket -r $Region
coscmd upload -r out/ /

Write-Host "=== Deployment complete! ===" -ForegroundColor Green
Write-Host "Site URL: https://$FullBucket.cos-website.$Region.myqcloud.com"
