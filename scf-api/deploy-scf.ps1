# 腾讯云 SCF 云函数部署脚本
# 前置要求：pip install tccli && tccli configure
param(
    [string]$FunctionName = "personal-site-api",
    [string]$Region = "ap-shanghai",
    [string]$Runtime = "Nodejs18.15",
    [string]$Handler = "index.main_handler",
    [int]$MemorySize = 128,
    [int]$Timeout = 30
)

$ErrorActionPreference = "Stop"

Write-Host "=== 腾讯云 SCF 部署脚本 ===" -ForegroundColor Cyan
Write-Host ""

# 1. 安装依赖
Write-Host "[1/4] 安装 npm 依赖..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Host "npm install 失败!" -ForegroundColor Red; exit 1 }
}

# 2. 打包代码为 zip
Write-Host "[2/4] 打包代码..." -ForegroundColor Yellow
$zipPath = Join-Path $PSScriptRoot "scf-deploy.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath }

# 排除不需要的文件
$filesToInclude = Get-ChildItem -Path $PSScriptRoot -Exclude @("scf-deploy.zip", "deploy-scf.ps1", ".env", "*.log") -Recurse
Compress-Archive -Path (Get-ChildItem -Path $PSScriptRoot -Exclude @("scf-deploy.zip", "deploy-scf.ps1", ".env", "*.log") | Select-Object -ExpandProperty FullName) -DestinationPath $zipPath -Force

Write-Host "  打包完成: $zipPath" -ForegroundColor Green

# 3. 将 zip 转为 base64（tccli 需要）
Write-Host "[3/4] 准备上传..." -ForegroundColor Yellow
$zipBytes = [System.IO.File]::ReadAllBytes($zipPath)
$zipBase64 = [System.Convert]::ToBase64String($zipBytes)

# 检查 zip 大小（SCF 直传限制 50MB）
$zipSizeMB = [math]::Round($zipBytes.Length / 1MB, 2)
Write-Host "  包大小: ${zipSizeMB}MB" -ForegroundColor Green

if ($zipSizeMB -gt 50) {
    Write-Host "错误: 包大小超过 50MB 限制!" -ForegroundColor Red
    exit 1
}

# 4. 检查函数是否存在，决定创建还是更新
Write-Host "[4/4] 部署函数..." -ForegroundColor Yellow

$checkResult = tccli scf GetFunction --region $Region --FunctionName $FunctionName 2>&1
if ($checkResult -match "ResourceNotFound") {
    # 函数不存在，创建
    Write-Host "  函数不存在，正在创建..." -ForegroundColor Yellow
    
    # 写入临时 JSON 文件（避免命令行过长）
    $createPayload = @{
        FunctionName = $FunctionName
        Runtime = $Runtime
        Handler = $Handler
        MemorySize = $MemorySize
        Timeout = $Timeout
        Code = @{
            ZipFile = $zipBase64
        }
    } | ConvertTo-Json -Depth 5
    
    $tempFile = Join-Path $env:TEMP "scf-create-payload.json"
    $createPayload | Out-File -Encoding utf8 $tempFile
    
    tccli scf CreateFunction --region $Region --cli-input-json "file://$tempFile"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "创建函数失败!" -ForegroundColor Red
        exit 1
    }
    
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    Write-Host "  函数创建成功!" -ForegroundColor Green
} else {
    # 函数已存在，更新代码
    Write-Host "  函数已存在，正在更新代码..." -ForegroundColor Yellow
    
    $updatePayload = @{
        FunctionName = $FunctionName
        Handler = $Handler
        Code = @{
            ZipFile = $zipBase64
        }
    } | ConvertTo-Json -Depth 5
    
    $tempFile = Join-Path $env:TEMP "scf-update-payload.json"
    $updatePayload | Out-File -Encoding utf8 $tempFile
    
    tccli scf UpdateFunctionCode --region $Region --cli-input-json "file://$tempFile"
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "更新函数失败!" -ForegroundColor Red
        exit 1
    }
    
    Remove-Item $tempFile -ErrorAction SilentlyContinue
    Write-Host "  函数代码更新成功!" -ForegroundColor Green
}

# 清理
Remove-Item $zipPath -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== 部署完成! ===" -ForegroundColor Green
Write-Host ""
Write-Host "下一步操作:" -ForegroundColor Cyan
Write-Host "  1. 登录腾讯云控制台配置环境变量（如未配置）"
Write-Host "  2. 创建 API 网关触发器（如未创建）"
Write-Host "  3. 控制台地址: https://console.cloud.tencent.com/scf/list?rid=4"
