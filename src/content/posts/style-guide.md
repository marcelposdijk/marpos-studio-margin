---
title: "Markdown Style Guide"
description: "A comprehensive reference for every Markdown element supported by Margin. Headings, code, tables, blockquotes, and more."
pubDate: 2024-03-02
author: "Design Desk"
image:
    url: "https://images.unsplash.com/photo-1542831371-29b0f74f9713"
    alt: "Code and design"
category: "Design"
featured: false
---

This guide demonstrates every Markdown style supported by Margin. Use it as your writing reference.

## Headings

H2 through H6 are styled. Don't use H1 in the body — the post title is already H1.

### This is H3

#### This is H4

##### This is H5 — uppercase mono label

###### This is H6 — even smaller uppercase

## Text formatting

You can write **bold text**, *italic text*, ***bold italic***, ~~strikethrough text~~, and `inline code`.

Press <kbd>Ctrl</kbd> + <kbd>K</kbd> to search. You can also ==highlight== text (if your markdown processor supports it).

Links are styled with the accent color: visit [the homepage](/) or [GitHub](https://github.com).

## Blockquotes

> This is a blockquote. The left border uses the accent color. It works well for pull quotes or notable passages.
>
> Blockquotes can span multiple paragraphs.

> Nested blockquotes are also supported:
>
> > This is a second-level quote. The accent bar is still visible.

## Lists

### Unordered

- First item with a custom accent dot
- Second item
- Third item with a longer line to demonstrate wrapping behavior across multiple lines

### Ordered

1. Step one — notice the numbered badge
2. Step two
3. Step three

### Task list

- [x] Set up the theme
- [x] Configure content mode
- [ ] Write your first post
- [ ] Deploy to Cloudflare

### Nested

- Top level item
  - Nested child
    - Deeply nested
  - Another child
- Back to top

## Code blocks

```javascript
// Language label appears in the top-right corner
function fibonacci(n) {
  if (n <= 1) return n;
  const cache = [0, 1];
  for (let i = 2; i <= n; i++) {
    cache[i] = cache[i - 1] + cache[i - 2];
  }
  return cache[n];
}

console.log(fibonacci(10)); // 55
```

```python
def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)
```

```bash
# Plain shell
npm run build
wrangler pages deploy dist --project-name=my-site
```

No language specified works too:

```
Plain text code block.
No syntax highlighting, but still styled.
```

## Tables

| Feature | Status | Notes |
|---------|--------|-------|
| Dark mode | Yes | Automatic, follows system |
| Light mode | Yes | Toggle in sidebar |
| RSS feed | Yes | `/rss.xml` |
| CMS mode | Yes | Ink CMS integration |
| Series | Yes | Multi-part timelines |
| Search | Yes | Pagefind powered |

## Images

![Cover image example](https://images.unsplash.com/photo-1542831371-29b0f74f9713 "Code on screen")

## Horizontal rule

---

Separates sections with a subtle gradient line.

## Definition lists

Term
: A word or phrase being defined.

Another term
: You can stack multiple definitions.
: Each one gets its own line.

## Inline elements

H~2~O is a chemical formula. E = mc^2^ is physics. You can use <sub>subscript</sub> and <sup>superscript</sup> directly.

That is everything. Start writing.
