---
title: 在 Markdown 中测试数学公式
description: 演示如何在 Markdown 中使用 LaTeX 渲染各类数学公式。
pubDate: May 31 2025
categories:
  - 文档
  - 示例
tags:
  - Markdown
  - LaTeX
  - 数学
badge: LaTeX
---

本文用来测试在 Markdown 中使用 `$$` 分隔符渲染数学公式的效果。

## 基础代数

先从一些基础的代数表达式开始。

一元二次方程的求根公式：
$$x = \frac{-b \pm \sqrt{b^2-4ac}}{2a}$$

一个简单的一次函数：
$$y = mx + c$$

二项式平方的展开：
$$(a+b)^2 = a^2 + 2ab + b^2$$

---

## 微积分

下面是一些常见的微积分表达式。

导数的极限定义：
$$f'(x) = \lim_{h \to 0} \frac{f(x+h) - f(x)}{h}$$

一个定积分：
$$\int_{a}^{b} f(x) dx$$

$e^x$ 在 $x=0$ 处的泰勒展开：
$$e^x = \sum_{n=0}^{\infty} \frac{x^n}{n!} = 1 + x + \frac{x^2}{2!} + \frac{x^3}{3!} + \cdots$$

---

## 三角学

一些基础的三角恒等式。

毕达哥拉斯恒等式（勾股定理的三角形式）：
$$\sin^2\theta + \cos^2\theta = 1$$

正弦的和角公式：
$$\sin(\alpha + \beta) = \sin\alpha\cos\beta + \cos\alpha\sin\beta$$

欧拉公式：
$$e^{i\theta} = \cos\theta + i\sin\theta$$

---

## 统计与概率

统计与概率中常用的一些公式。

一组 $n$ 个数 $x_1, x_2, \ldots, x_n$ 的均值（$\mu$）公式：
$$\mu = \frac{1}{n} \sum_{i=1}^{n} x_i$$

正态分布的概率密度函数：
$$f(x | \mu, \sigma^2) = \frac{1}{\sqrt{2\pi\sigma^2}} e^{-\frac{(x-\mu)^2}{2\sigma^2}}$$

贝叶斯定理：
$$P(A|B) = \frac{P(B|A)P(A)}{P(B)}$$

---

## 线性代数

来自线性代数的几个例子。

一个 2×2 矩阵：
$$A = \begin{pmatrix} a & b \\ c & d \end{pmatrix}$$

2×2 矩阵的行列式：
$$\det(A) = ad - bc$$

矩阵 A 与矩阵 B 相乘：
$$C = AB$$

---

## 物理

两个很著名的物理公式。

爱因斯坦质能方程：
$$E = mc^2$$

牛顿第二定律：
$$F = ma$$

以上内容可以用来检验各类数学公式的渲染效果。
