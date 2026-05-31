轻小说文库下载器
=======================================================

[![npm version](https://badge.fury.io/js/wenku8.svg)](https://badge.fury.io/js/wenku8)

![](assets/screenshot-20220902-182148.png)

## 介绍

本工具可用来下载[轻小说文库](https://www.wenku8.net/index.php)的小说，支持以下功能

- 支持根据小说名、作者名进行搜索
- 支持生成*epub*格式的电子书（默认行为）
- 支持生成*markdown*文件
- 支持生成*txt*格式的纯文本文件
- 支持仅下载小说插图
- 支持下载轻小说文库站点已下架的小说，如《无职转生》
- 支持 MCP Server 模式，可作为 AI 插件使用

## 优化与修改

与原仓库相比，本 Fork 进行了以下优化和功能扩展：

1. **修复 403 Forbidden 错误**：将 `axios` 替换为 `got`，启用 HTTP/2 协议，并补充浏览器请求头（`User-Agent`、`Referer`、`Accept-Language` 等），以绕过轻小说文库的 Cloudflare 反爬虫机制。
2. **修复 ESM 导入错误**：将 `cheerio` 的默认导入改为命名空间导入，解决 Node.js ESM 模块下的 `SyntaxError`。
3. **新增 txt 格式支持**：除了 epub 和 markdown，现在可以生成纯 txt 格式的小说文件。
4. **新增 MCP Server 模式**：基于 `@modelcontextprotocol/sdk` 提供 stdio 传输的 MCP 服务，支持 AI 通过工具调用的方式搜索、获取详情、下载小说。
5. **新增 `getNovelDetailsWithChapters` API**：返回小说元数据 + 完整的卷/章节结构，方便 AI 在调用下载前提供详细的小说信息。
6. **优化错误处理**：为所有网络请求添加 `try-catch`，避免因 `UnhandledPromiseRejection` 导致程序崩溃。
7. **新增 `silent` 模式**：下载时可选静默输出，适配 MCP Server 调用场景。



## 安装

本工具基于NodeJS实现，请确保安装了[Node环境](https://nodejs.org/en/)

### 全局安装（推荐）

``` shell
npm install wenku8 -g # yarn global add wenku8
wenku8 
```



### 本地安装

``` shell
npm install wenku8 -D # yarn add wenku8 -D
npx wenku8
```

## 使用方式

### 方式一、生成epub电子书（默认行为）

``` shell
wenku8 
```

请注意：*Epub*电子书的生成需要批量下载小说内部的插图，而由于该图片站点网络极其不稳定，很容易出现图片加载失败的情况，因此本工具设定默认情况下图片资源的加载失败并不会阻塞整个任务的执行，只是生成的*Epub*电子书中可能丢失部分图片。如果希望能够总是拿到完整的*Epub*电子书，请使用以下命令进行多次尝试，在网络较好的情况是可以顺利执行的。

``` shell
wenku8 --strict
```

如果你希望能够拿到更多生成*Epub*时的日志信息，可以加上*verbose*标志

``` shell
wenku8 --strict --verbose
```



![](assets/screenshot-20220903-184109.png)

![](assets/screenshot-20220903-184223.png)



### 方式二、下载Markdown文件以及插图

``` shell
wenku8 --no-epub
```

![](assets/screenshot-20220902-182437.png)





### 方式三、仅下载小说插图

``` shell
wenku8 --no-epub --onlyImages
```

### 方法四、仅下载小说文字
可与 --no-epub 选项连用
```shell
wenku8 --only-text
```

### 方法五、下载为 txt 格式
```shell
wenku8 --no-epub --ext txt
```

## MCP Server 模式

本 Fork 新增了 MCP Server 支持，可通过 stdio 传输与 AI 客户端集成。

### 启动 MCP Server

```shell
npm run mcp
# 或
node dist/mcp-server.js
```

### 暴露的工具

| 工具名 | 功能 | 模式 |
|---|---|---|
| `wenku8_search` | 按小说名/作者搜索 | 只读 |
| `wenku8_getHotList` | 获取热门小说分类列表 | 只读 |
| `wenku8_getNovelDetails` | 获取小说详情 + 卷/章节结构 | 只读 |
| `wenku8_downloadNovel` | 下载小说（epub/txt/md） | 写操作 |

### 在 AI 客户端中配置

以 Claude Desktop 为例，在 `claude_desktop_config.json` 中添加：

```json
{
  "mcpServers": {
    "wenku8": {
      "command": "node",
      "args": ["/absolute/path/to/wenku8-downloader/dist/mcp-server.js"]
    }
  }
}
```






## 本地调试

``` shell
git clone https://github.com/YYYYYYaoxh/wenku8-mcp-server.git
cd wenku8-mcp-server
npm install

npm start
npm start -- --no-epub
npm start -- --no-epub --onlyImages
```



## 贡献者

- **YYYYYYaoxh** — MCP Server 支持、txt 格式下载、HTTP/2 请求修复、ESM 兼容性修复

<a href="https://github.com/YYYYYYaoxh/wenku8-mcp-server/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=YYYYYYaoxh/wenku8-mcp-server" />
</a>



