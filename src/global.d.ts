declare module 'epub-gen-honor';
declare module 'epub-gen-loose';
declare module 'epub-gen-memory';

interface INovel {
    novelId: number;
    novelName: string;
    cover: string;
    /**
     * 文库分类
     */
    library: string;
    /**
     * 小说作者
     */
    author: string;
    /**
     * 是否完结
     */
    status: string;
    /**
     * 最后更新时间
     */
    lastUpdateTime: string;
    /**
     * 全文长度
     */
    length: string;
    /**
     * 小说标签
     */
    tag: string;
    /**
     * 最新章节
     */
    recentChapter: string;
    /**
     * 内容简介
     */
    desc: string;
    /**
     * 目录链接
     */
    catalogueUrl?: string;
}

interface CommandOptions {
    epub: boolean;
    ext: string;
    onlyImages: boolean;
    outDir: string;
    verbose: boolean;
    strict: boolean;
    onlyText: boolean;
    /** When true, suppress all stdout console output (useful for MCP servers) */
    silent?: boolean;
    /** 1-based volume index to download a specific volume only. If omitted, all volumes are downloaded. */
    volumeIndex?: number;
}

interface VolumeInfo {
    index: number;
    name: string;
    chapterCount: number;
    chapters: Array<{
        chapterIndex: number;
        chapterTitle: string;
        chapterUrl: string;
    }>;
}

interface NovelDetailsWithChapters extends INovel {
    volumes: VolumeInfo[];
    totalChapters: number;
}

interface FavoriteNovel {
    novelId: number;
    novelName: string;
    lastRead: string;
    lastReadChapter: string;
    lastUpdatedChapter?: string | undefined;
}
