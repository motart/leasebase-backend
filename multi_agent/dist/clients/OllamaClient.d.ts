import { Logger } from '../utils/Logger';
export interface OllamaMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
export interface OllamaResponse {
    model: string;
    created_at: string;
    message: {
        role: string;
        content: string;
    };
    done: boolean;
}
export interface OllamaConfig {
    baseUrl?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
}
export declare class OllamaClient {
    private axios;
    private model;
    private logger;
    private temperature;
    private maxTokens;
    constructor(logger: Logger, config?: OllamaConfig);
    chat(messages: OllamaMessage[], system?: string): Promise<string>;
    generate(prompt: string): Promise<string>;
    listModels(): Promise<string[]>;
    pullModel(modelName: string): Promise<void>;
    checkHealth(): Promise<boolean>;
    setModel(model: string): void;
    getModel(): string;
}
//# sourceMappingURL=OllamaClient.d.ts.map