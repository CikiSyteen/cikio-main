#!/usr/bin/env bash
#
# publish-preview-to-main.sh
# ─────────────────────────────────────────────────────────────────────────
# 一键把「开发/预览分支」(如 *-preview) 的当前内容提升（fast-forward）到
# main（正式版分支），推送到远端 origin，随后自动切回原开发分支继续开发。
#
# 用法（控制台指定命令）：
#   bash scripts/publish-preview-to-main.sh            # 发布当前所在分支
#   bash scripts/publish-preview-to-main.sh home-preview  # 指定要发布的源分支
# 或走 npm / pnpm script：
#   pnpm run release:main
#
# 约定与安全保障：
#   - 只能在 preview 开发分支上运行，禁止在 main 上运行。
#   - 工作区必须干净（无未提交改动）。
#   - main 只会「快进」到开发分支（--ff-only）：绝不倒退、也不产生合并提交，
#     因此 main 的历史就是开发分支的历史，能清晰区分「开发版 / 正式版」。
#   - 若 main 含有开发分支中不存在的提交（两分支已分叉），脚本中止并提示，
#     绝不会静默丢弃 main 的正式版提交。
#
# 注意：本机处于 TLS 拦截代理网络，git 远程操作需加 -c http.sslBackend=schannel
#       才能信任代理自签 CA；本地操作（checkout / merge / status）不走网络，无需该参数。

set -euo pipefail

# 远程操作统一走 schannel，绕开代理自签 CA
GIT="git -c http.sslBackend=schannel"

# ── 颜色输出（非交互终端自动关闭）──────────────────────────────────────
if [ -t 1 ]; then
  C_RED=$'\033[31m'; C_GRN=$'\033[32m'; C_YEL=$'\033[33m'; C_BLU=$'\033[34m'; C_RST=$'\033[0m'
else
  C_RED=""; C_GRN=""; C_YEL=""; C_BLU=""; C_RST=""
fi
info() { echo "${C_BLU}==>${C_RST} $*"; }
ok()   { echo "${C_GRN}✓${C_RST} $*"; }
warn() { echo "${C_YEL}!${C_RST} $*"; }
err()  { echo "${C_RED}✗${C_RST} $*" >&2; }

# ── 1. 确定源（开发）分支 ─────────────────────────────────────────────
CURRENT=$(git rev-parse --abbrev-ref HEAD)
SRC="${1:-$CURRENT}"

if [ "$SRC" = "main" ]; then
  err "不能把 main 发布到 main。请指定一个 preview 开发分支（如 home-preview）。"
  exit 1
fi

# 若指定了与当前不同的分支，先切过去（切回时再切回来）
if [ "$SRC" != "$CURRENT" ]; then
  info "切换到源分支 $SRC …"
  git checkout "$SRC"
  CURRENT="$SRC"
fi
info "将发布的开发分支：$CURRENT"

# ── 2. 工作区必须干净 ─────────────────────────────────────────────────
if [ -n "$(git status --porcelain)" ]; then
  err "工作区有未提交的改动，请先 commit 或 stash 再发布："
  git status --porcelain
  exit 1
fi
ok "工作区干净"

# ── 3. 取回远端最新 main，确保本地 main 与 origin/main 同步 ─────────────
info "拉取 origin/main 最新状态…"
$GIT fetch origin main

# ── 4. 切到 main 并同步到 origin/main ─────────────────────────────────
git checkout main
if git merge --ff-only origin/main; then
  ok "本地 main 已同步到 origin/main"
else
  err "本地 main 无法快进到 origin/main（可能有人直接在 main 上提交）。请先解决 main 分歧再发布。"
  git checkout "$CURRENT"
  exit 1
fi

# ── 5. 把 main 快进到开发分支 ────────────────────────────────────────
if git merge --ff-only "$CURRENT"; then
  ok "main 已快进到 $CURRENT 的最新提交"
else
  err "无法 fast-forward：main 含有 $CURRENT 中不存在的提交（两分支已分叉）。"
  err "如需让正式版等于开发版，请先确认丢弃 main 独有提交后手动处理，脚本不会静默覆盖。"
  git checkout "$CURRENT"
  exit 1
fi

# ── 6. 推送 main 到远端（正式版上线）─────────────────────────────────
info "推送 main 到 origin…"
$GIT push -u origin main
ok "main 已推送到 origin（正式版已更新）"

# ── 7. 同步开发分支到远端，保持预览环境最新 ──────────────────────────
info "同步开发分支 $CURRENT 到 origin…"
$GIT push -u origin "$CURRENT"
ok "开发分支 $CURRENT 已同步到 origin"

# ── 8. 切回开发分支继续开发 ─────────────────────────────────────────
git checkout "$CURRENT"
ok "已切回开发分支 $CURRENT，可继续开发。"

echo
echo "${C_GRN}发布完成：${CURRENT} → main（正式版），当前已在 ${CURRENT} 上。${C_RST}"
