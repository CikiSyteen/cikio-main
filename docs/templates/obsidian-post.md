---
# ▼ Obsidian 文章模板（配合核心插件「模板」，模板文件夹设为 docs/templates）
#
# 用法：
#   1. 先建好目录 src/content/blog/<slug>/（<slug> 用英文短名，决定 URL /blog/<slug>）
#   2. 在这里执行「插入模板」，生成为 index.mdx
#   3. 封面：把图片拖进同一目录并命名为 cover.webp，再取消下面 image 那行的注释
#   4. 发布前：把 draft 改成 false（或删掉这一行）
#
# 字段含义与 src/content.config.ts 的 schema 一一对应，必填的是 title 与 description
title: 未命名草稿
description: 待补充
# 日期占位符必须带引号：裸 {} 在 YAML 里会被当成 flow mapping 而报错
pubDate: "{{date:YYYY-MM-DD}}"
draft: true
categories: []
tags: []
# image: ./cover.webp
# updated: "{{date:YYYY-MM-DD}}"
# badge: 置顶
---

