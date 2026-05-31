#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { search, getHotList, getNovelDetailsWithChapters, downloadNovel } from './downloader.js';

const server = new McpServer(
    {
        name: 'wenku8-downloader-mcp',
        version: '1.0.0',
    },
    {
        capabilities: {},
    }
);

// -------------------- Tool 1: search --------------------
server.registerTool(
    'wenku8_search',
    {
        title: 'Search Novels',
        description:
            'Search for light novels on 轻小说文库 (wenku8.net) by novel name or author name. Returns a list of matching novels with their IDs.',
        inputSchema: z.object({
            query: z.string().min(1).describe('Search keyword (novel name or author name)'),
            type: z
                .enum(['articlename', 'author'])
                .default('articlename')
                .describe("Search type: 'articlename' for novel title, 'author' for author name"),
        }),
        outputSchema: z.object({
            novels: z
                .array(
                    z.object({
                        novelName: z.string(),
                        novelId: z.number(),
                    })
                )
                .describe('List of matching novels'),
        }),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
        },
    },
    async (args) => {
        try {
            const novels = await search(args.query, args.type);
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `Found ${novels.length} novel(s) matching "${args.query}"`,
                    },
                ],
                structuredContent: { novels: novels ?? [] },
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `Search failed: ${(error as Error).message}`,
                    },
                ],
                structuredContent: { novels: [] },
                isError: true,
            };
        }
    }
);

// -------------------- Tool 2: getHotList --------------------
server.registerTool(
    'wenku8_getHotList',
    {
        title: "Get Today's Hot Novels",
        description:
            "Retrieve today's hot/popular novels from 轻小说文库 (wenku8.net). Returns a ranked list of trending light novels.",
        inputSchema: z.object({}),
        outputSchema: z.object({
            novels: z
                .array(
                    z.object({
                        novelName: z.string(),
                        novelId: z.number(),
                    })
                )
                .describe("Today's hot novels list"),
        }),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
        },
    },
    async () => {
        try {
            const list = await getHotList();
            const todayHot = list.find((c) => c.type === '今日热榜');
            const novels = todayHot?.novels ?? [];
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `Retrieved ${novels.length} hot novels from today's ranking`,
                    },
                ],
                structuredContent: { novels },
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `Failed to get hot list: ${(error as Error).message}`,
                    },
                ],
                structuredContent: { novels: [] },
                isError: true,
            };
        }
    }
);

// -------------------- Tool 3: getNovelDetails --------------------
server.registerTool(
    'wenku8_getNovelDetails',
    {
        title: 'Get Novel Details',
        description:
            'Get detailed information about a specific novel on 轻小说文库 (wenku8.net) including metadata, description, and full volume/chapter structure. Use this to provide rich context about a novel before downloading.',
        inputSchema: z.object({
            novelId: z.number().int().positive().describe('The unique novel ID from wenku8.net (e.g., 1861)'),
        }),
        outputSchema: z.object({
            novelId: z.number(),
            novelName: z.string(),
            author: z.string(),
            cover: z.string(),
            library: z.string(),
            status: z.string(),
            lastUpdateTime: z.string(),
            length: z.string(),
            tag: z.string(),
            recentChapter: z.string(),
            desc: z.string(),
            totalChapters: z.number(),
            volumes: z.array(
                z.object({
                    index: z.number(),
                    name: z.string(),
                    chapterCount: z.number(),
                    chapters: z.array(
                        z.object({
                            chapterIndex: z.number(),
                            chapterTitle: z.string(),
                        })
                    ),
                })
            ),
        }),
        annotations: {
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
        },
    },
    async (args) => {
        try {
            const details = await getNovelDetailsWithChapters(args.novelId);
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `Details for "${details.novelName}" by ${details.author}: ${details.totalChapters} chapters across ${details.volumes.length} volume(s).`,
                    },
                ],
                structuredContent: details as unknown as Record<string, unknown>,
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `Failed to get novel details: ${(error as Error).message}`,
                    },
                ],
                structuredContent: { error: (error as Error).message },
                isError: true,
            };
        }
    }
);

// -------------------- Tool 4: downloadNovel --------------------
server.registerTool(
    'wenku8_downloadNovel',
    {
        title: 'Download Novel',
        description:
            'Download a novel from 轻小说文库 (wenku8.net) to a local directory. Supports epub, txt, and markdown formats. Uses the novel ID obtained from search or getHotList.',
        inputSchema: z.object({
            novelId: z.number().int().positive().describe('The unique novel ID from wenku8.net'),
            format: z
                .enum(['epub', 'txt', 'md'])
                .default('epub')
                .describe('Output format: epub (ebook), txt (plain text), or md (markdown)'),
            outDir: z
                .string()
                .default('./novels')
                .describe('Directory path where the downloaded novel will be saved'),
            volumeIndex: z
                .number()
                .int()
                .positive()
                .optional()
                .describe('1-based volume index to download a specific volume only. Use getNovelDetails to find the volume index. Omit to download all volumes.'),
            onlyImages: z
                .boolean()
                .default(false)
                .describe('If true, only download images (illustrations) instead of text'),
            onlyText: z
                .boolean()
                .default(false)
                .describe('If true, only download text content without images'),
            verbose: z.boolean().default(false).describe('Enable verbose logging for debugging'),
            strict: z
                .boolean()
                .default(false)
                .describe('Strict mode: image download failures will block epub generation'),
        }),
        outputSchema: z.object({
            success: z.boolean(),
            message: z.string(),
            outputPath: z.string(),
        }),
        annotations: {
            readOnlyHint: false,
            destructiveHint: false,
            idempotentHint: true,
        },
    },
    async (args) => {
        try {
            const options: CommandOptions = {
                epub: args.format === 'epub',
                ext: args.format === 'epub' ? 'md' : args.format,
                onlyImages: args.onlyImages,
                outDir: args.outDir,
                verbose: args.verbose,
                strict: args.strict,
                onlyText: args.onlyText,
                silent: true,
                volumeIndex: args.volumeIndex,
            };
            await downloadNovel(args.novelId, options);
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `Novel ${args.novelId} downloaded successfully in ${args.format} format to ${args.outDir}.`,
                    },
                ],
                structuredContent: {
                    success: true,
                    message: `Novel ${args.novelId} downloaded successfully in ${args.format} format.`,
                    outputPath: args.outDir,
                },
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text' as const,
                        text: `Download failed: ${(error as Error).message}`,
                    },
                ],
                structuredContent: {
                    success: false,
                    message: (error as Error).message,
                    outputPath: '',
                },
                isError: true,
            };
        }
    }
);

// -------------------- Start stdio transport --------------------
async function main(): Promise<void> {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((error) => {
    console.error('MCP server error:', error);
    process.exit(1);
});
