#!/bin/sh
# dsh-web-enhanced 一键安装脚本（公开仓库：omdsh-dev/dsh-web-enhanced，git URL 安装无需登录）
#
# 用法:
#   ./scripts/install.sh            # 装进默认 web profile
#   ./scripts/install.sh tui        # 装进自定义 profile
#
# 做什么: 检查三个前置（dsh / pnpm / 仓库可访问）→ 用 git URL 方式把插件装进
# profile → 提示重启验证。与手装唯一区别是多了前置自检，安装命令本身和 README 一致。

set -eu

PROFILE="${1:-web}"

# ── profile 参数只允许安全字符（随后会被拼进路径与 node 环境变量）──
case "$PROFILE" in
  *[!a-zA-Z0-9_-]*|'') fail_early=1 ;;
  *) fail_early=0 ;;
esac
if [ "$fail_early" = 1 ]; then
  printf '\033[31m✗ 非法的 profile 名 "%s"（仅允许字母、数字、_、-）\033[0m\n' "$PROFILE"
  exit 1
fi

REPO_URL="git+https://github.com/omdsh-dev/dsh-web-enhanced.git"
GIT_URL="https://github.com/omdsh-dev/dsh-web-enhanced.git"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
RED='\033[31m'; GREEN='\033[32m'; YELLOW='\033[33m'; BOLD='\033[1m'; NC='\033[0m'

fail() { printf "${RED}✗ %s${NC}\n" "$1"; exit 1; }
ok()   { printf "${GREEN}✓ %s${NC}\n" "$1"; }
warn() { printf "${YELLOW}! %s${NC}\n" "$1"; }

echo "${BOLD}== dsh-web-enhanced 安装（profile: ${PROFILE}）==${NC}"

# ── 前置 1: dsh ────────────────────────────────────────────────────────────
if ! command -v dsh >/dev/null 2>&1; then
  fail "未找到 dsh 命令。请先安装 DeepSeek Harness（开源版），再跑本脚本。"
fi
ok "dsh: $(dsh --version 2>/dev/null || echo present)"

# ── 前置 2: pnpm（缺失时只给提示，绝不自动 corepack enable 改用户全局）──
if ! command -v pnpm >/dev/null 2>&1; then
  fail "未找到 pnpm。请手动执行: 'corepack enable'（或 'npm i -g pnpm'），新开终端确认 'pnpm -v' 有输出后重跑本脚本。"
fi
ok "pnpm: $(pnpm --version)"

# ── 前置 3: 仓库可访问（公开仓库，无需登录；只验网络可达）─────────────────────────────
if ! GIT_TERMINAL_PROMPT=0 git ls-remote "$GIT_URL" HEAD >/dev/null 2>&1; then
  fail "无法访问仓库 $GIT_URL —— 请检查网络/代理后重试。"
fi
ok "GitHub 公开仓库可访问"

# ── 已装检测（幂等）────────────────────────────────────────────────────────
PROFILE_PKG="$DSH_HOME/profiles/$PROFILE/package.json"
if [ -f "$PROFILE_PKG" ] && grep -q "dsh-web-enhanced" "$PROFILE_PKG" 2>/dev/null; then
  warn "插件已在 profile '$PROFILE' 中。"
  printf "  想重装就手动执行: dsh plugin --profile %s remove dsh-web-enhanced，再跑本脚本。\n" "$PROFILE"
  printf "  否则直接: 重启 dsh web + 硬刷新 即可验证。\n"
  exit 0
fi

# ── 安装 ───────────────────────────────────────────────────────────────────
echo "安装中（拉取插件代码并安装依赖，约 1-2 分钟）..."
dsh plugin --profile "$PROFILE" add "$REPO_URL"

echo
ok "安装完成！"
echo
echo "${BOLD}接下来:${NC}"
echo "  1. 重启 dsh web（退出后重新执行 dsh web）"
echo "  2. 浏览器硬刷新（Cmd+Shift+R）"
echo "  3. 打开侧边栏「任务看板 / Git 图谱」，或进入项目会话查看右侧面板与余额行"
echo
