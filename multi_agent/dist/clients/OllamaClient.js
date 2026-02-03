"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaClient = void 0;
const axios_1 = __importDefault(require("axios"));
class OllamaClient {
    axios;
    model;
    logger;
    temperature;
    maxTokens;
    constructor(logger, config) {
        this.logger = logger;
        this.model = config?.model || 'llama3.2';
        this.temperature = config?.temperature || 0.7;
        this.maxTokens = config?.maxTokens || 2000;
        this.axios = axios_1.default.create({
            baseURL: config?.baseUrl || 'http://localhost:11434',
            timeout: 300000, // 5 minutes for local LLMs
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }
    async chat(messages, system) {
        try {
            const formattedMessages = system
                ? [{ role: 'system', content: system }, ...messages]
                : messages;
            const response = await this.axios.post('/api/chat', {
                model: this.model,
                messages: formattedMessages,
                stream: false,
                options: {
                    temperature: this.temperature,
                    num_predict: this.maxTokens
                }
            });
            return response.data.message.content;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    throw new Error('Ollama is not running. Please start Ollama first with: ollama serve');
                }
                if (error.response?.status === 404) {
                    throw new Error(`Model ${this.model} not found. Pull it first with: ollama pull ${this.model}`);
                }
            }
            throw error;
        }
    }
    async generate(prompt) {
        try {
            const response = await this.axios.post('/api/generate', {
                model: this.model,
                prompt: prompt,
                stream: false,
                options: {
                    temperature: this.temperature,
                    num_predict: this.maxTokens
                }
            });
            return response.data.response;
        }
        catch (error) {
            if (axios_1.default.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    throw new Error('Ollama is not running. Please start Ollama first with: ollama serve');
                }
            }
            throw error;
        }
    }
    async listModels() {
        try {
            const response = await this.axios.get('/api/tags');
            return response.data.models.map((m) => m.name);
        }
        catch (error) {
            this.logger.error('Failed to list Ollama models');
            return [];
        }
    }
    async pullModel(modelName) {
        this.logger.info(`Pulling model ${modelName}...`);
        try {
            await this.axios.post('/api/pull', {
                name: modelName,
                stream: false
            });
            this.logger.success(`Model ${modelName} pulled successfully`);
        }
        catch (error) {
            throw new Error(`Failed to pull model ${modelName}`);
        }
    }
    async checkHealth() {
        try {
            await this.axios.get('/');
            return true;
        }
        catch (error) {
            return false;
        }
    }
    setModel(model) {
        this.model = model;
        this.logger.info(`Switched to model: ${model}`);
    }
    getModel() {
        return this.model;
    }
}
exports.OllamaClient = OllamaClient;
//# sourceMappingURL=OllamaClient.js.map