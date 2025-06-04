import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const configId = (await params).id;

    // 验证配置是否存在
    const config = await prisma.goldenPathConfig.findUnique({
      where: { id: configId },
      select: {
        id: true,
        name: true,
        config: true,
      },
    });

    if (!config) {
      return new NextResponse('echo "错误: 配置不存在" >&2; exit 1', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://autodev.work';
    const configUrl = `${baseUrl}/api/golden-path/${configId}`;

    // 生成安装脚本
    const installScript = `#!/bin/bash

# AutoDev Backend Generator 安装脚本
# 项目: ${config.name}
# 配置ID: ${configId}

set -e

echo "🚀 开始安装 AutoDev Backend Generator..."

# 颜色定义
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
BLUE='\\033[0;34m'
NC='\\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "\${BLUE}[INFO]\${NC} $1"
}

log_success() {
    echo -e "\${GREEN}[SUCCESS]\${NC} $1"
}

log_warning() {
    echo -e "\${YELLOW}[WARNING]\${NC} $1"
}

log_error() {
    echo -e "\${RED}[ERROR]\${NC} $1"
}

# 检测操作系统
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 安装 Node.js (如果不存在)
install_nodejs() {
    log_info "检测到系统中没有 Node.js，正在安装..."
    
    local os=$(detect_os)
    
    case $os in
        "linux")
            if command_exists apt-get; then
                log_info "使用 apt-get 安装 Node.js..."
                curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
                sudo apt-get install -y nodejs
            elif command_exists yum; then
                log_info "使用 yum 安装 Node.js..."
                curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
                sudo yum install -y nodejs npm
            elif command_exists dnf; then
                log_info "使用 dnf 安装 Node.js..."
                curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
                sudo dnf install -y nodejs npm
            else
                log_error "不支持的 Linux 发行版，请手动安装 Node.js"
                exit 1
            fi
            ;;
        "macos")
            if command_exists brew; then
                log_info "使用 Homebrew 安装 Node.js..."
                brew install node
            else
                log_error "请先安装 Homebrew 或手动安装 Node.js"
                exit 1
            fi
            ;;
        *)
            log_error "不支持的操作系统，请手动安装 Node.js"
            exit 1
            ;;
    esac
}

# 主安装流程
main() {
    log_info "开始检查环境..."
    
    # 检查 Node.js
    if ! command_exists node; then
        log_warning "未检测到 Node.js"
        read -p "是否要自动安装 Node.js? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            install_nodejs
        else
            log_error "需要 Node.js 才能继续，请手动安装后重试"
            exit 1
        fi
    else
        log_success "检测到 Node.js: $(node --version)"
    fi
    
    # 检查 npm
    if ! command_exists npm; then
        log_error "未检测到 npm，请确保 Node.js 安装正确"
        exit 1
    else
        log_success "检测到 npm: $(npm --version)"
    fi
    
    # 创建临时目录
    local temp_dir=$(mktemp -d)
    cd "$temp_dir"
    
    log_info "下载项目配置..."
    
    # 下载配置文件
    if command_exists curl; then
        curl -sSf "${configUrl}" -o config.json
    elif command_exists wget; then
        wget -q "${configUrl}" -O config.json
    else
        log_error "需要 curl 或 wget 来下载配置文件"
        exit 1
    fi
    
    if [ ! -f config.json ]; then
        log_error "下载配置文件失败"
        exit 1
    fi
    
    log_success "配置文件下载完成"
    
    # 使用 npx 运行生成器
    log_info "运行 AutoDev Backend Generator..."
    
    if ! npx @autodev/backend-generator add "${configUrl}"; then
        log_error "生成器运行失败"
        exit 1
    fi
    
    # 清理临时文件
    cd - > /dev/null
    rm -rf "$temp_dir"
    
    log_success "🎉 项目生成完成！"
    log_info "项目名称: ${config.name}"
    log_info "配置来源: ${configUrl}"
}

# 运行主函数
main "$@"
`;

    return new NextResponse(installScript, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="install-${configId}.sh"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    console.error('生成安装脚本失败:', error);
    const errorScript = `#!/bin/bash
echo "错误: 生成安装脚本失败" >&2
exit 1`;
    
    return new NextResponse(errorScript, {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}
