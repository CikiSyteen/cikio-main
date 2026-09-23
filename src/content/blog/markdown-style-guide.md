---
title: "Markdown 语法示例"
description: "这里演示在 Astro 中编写 Markdown 内容时常用到的一些基础语法。"
pubDate: "Jul 01 2024"
image: /image/image3.webp
categories:
  - 文档
  - 示例
tags:
  - Markdown
badge: 置顶
---

这里演示在 Astro 中编写 Markdown 内容时常用到的一些基础语法。

## 标题

下面这些 HTML `<h1>`—`<h6>` 元素代表六个层级的标题，`<h1>` 层级最高，`<h6>` 最低。

## H2

### H3

#### H4

##### H5

###### H6

## 段落

这是一段用来演示段落排版的示例文字。Markdown 的段落之间以空行分隔，渲染时会把段落内的换行自动折行；只要行尾不留两个以上空格，就不会被当成强制换行。

写长文时也值得留意可读性：段落过长会让读者失去耐心，把一大段拆成几个自然段，阅读节奏会更舒服。

## 图片

#### 语法

```markdown
![图片替代文本](./图片的完整或相对路径)
```

#### 输出

![博客占位图](/logo.webp)

## 引用

引用（blockquote）元素用于标注取自其他来源的内容，可以带上出处说明（出处需写在 `footer` 或 `cite` 元素内），也可以包含批注、缩写等行内变化。

### 不带出处的引用

#### 语法

```markdown
> 引用块里的内容会以左侧竖线加缩进的形式呈现。
> **注意**：引用块内同样可以使用 _Markdown 语法_。
```

#### 输出

> 引用块里的内容会以左侧竖线加缩进的形式呈现。
> **注意**：引用块内同样可以使用 _Markdown 语法_。

### 带出处的引用

#### 语法

```markdown
> 不要通过共享内存来通信，而要通过通信来共享内存。<br>
> — <cite>Rob Pike[^1]</cite>
```

#### 输出

> 不要通过共享内存来通信，而要通过通信来共享内存。<br>
> — <cite>Rob Pike[^1]</cite>

[^1]: 以上引文摘自 Rob Pike 在 2015 年 11 月 18 日 Gopherfest 上的[演讲](https://www.youtube.com/watch?v=PAAkCSZUG1c)。

## 表格

#### 语法

```markdown
| 斜体   | 粗体     | 代码   |
| ------ | -------- | ------ |
| _斜体_ | **粗体** | `代码` |
```

#### 输出

| 斜体   | 粗体     | 代码   |
| ------ | -------- | ------ |
| _斜体_ | **粗体** | `代码` |

## 代码块

#### 语法

在新起的一行写 3 个反引号 ``` 再写代码片段，最后用另一行 3 个反引号收尾；想让代码带上语言相关的语法高亮，就在开头那 3 个反引号后面写一个语言名，例如 html、javascript、css、markdown、typescript、txt、bash。

````markdown
```cpp
#include <bits/stdc++.h>
using namespace std;
const int N = 1e5 + 5;
int n, k, a[N];
long long ans;
vector<int> v[N];
int main()
{
    scanf("%d%d", &n, &k);
    for (int i = 1; i <= n; i++)
    {
        scanf("%d", &a[i]);
        v[i % k].push_back(a[i]);
    }
    for (int i = 0; i < k; i++)
        sort(v[i].rbegin(), v[i].rend());
    for (int i = 0; i < k; i++)
    {
        for (int j = 0; j + 1 < v[i].size(); j += 2)
        {
            ans += v[i][j] + v[i][j + 1];
        }
    }
    printf("%lld\n", ans);
    return 0;
}
```
````

输出

```cpp
#include <bits/stdc++.h>
using namespace std;
const int N = 1e5 + 5;
int n, k, a[N];
long long ans;
vector<int> v[N];
int main()
{
    scanf("%d%d", &n, &k);
    for (int i = 1; i <= n; i++)
    {
        scanf("%d", &a[i]);
        v[i % k].push_back(a[i]);
    }
    for (int i = 0; i < k; i++)
        sort(v[i].rbegin(), v[i].rend());
    for (int i = 0; i < k; i++)
    {
        for (int j = 0; j + 1 < v[i].size(); j += 2)
        {
            ans += v[i][j] + v[i][j + 1];
        }
    }
    printf("%lld\n", ans);
    return 0;
}
```

## 列表类型

### 有序列表

#### 语法

```markdown
1. 第一项
2. 第二项
3. 第三项
```

#### 输出

1. 第一项
2. 第二项
3. 第三项

### 无序列表

#### 语法

```markdown
- 列表项
- 另一项
- 还有一项
```

#### 输出

- 列表项
- 另一项
- 还有一项

### 嵌套列表

#### 语法

```markdown
- 水果
  - 苹果
  - 橙子
  - 香蕉
- 乳制品
  - 牛奶
  - 奶酪
```

#### 输出

- 水果
  - 苹果
  - 橙子
  - 香蕉
- 乳制品
  - 牛奶
  - 奶酪

## 其他元素

#### 语法

```markdown
<abbr title="Graphics Interchange Format">GIF</abbr> 是一种位图图像格式。

H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

按 <kbd>CTRL</kbd>+<kbd>ALT</kbd>+<kbd>Delete</kbd> 结束会话。

大多数<mark>蝾螈</mark>是夜行动物，以昆虫、蠕虫和其他小生物为食。
```

#### 输出

<abbr title="Graphics Interchange Format">GIF</abbr> 是一种位图图像格式。

H<sub>2</sub>O

X<sup>n</sup> + Y<sup>n</sup> = Z<sup>n</sup>

按 <kbd>CTRL</kbd>+<kbd>ALT</kbd>+<kbd>Delete</kbd> 结束会话。

大多数<mark>蝾螈</mark>是夜行动物，以昆虫、蠕虫和其他小生物为食。
