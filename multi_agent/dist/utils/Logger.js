"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const winston_1 = __importDefault(require("winston"));
const chalk_1 = __importDefault(require("chalk"));
class Logger {
    winston;
    constructor(level = 'info') {
        this.winston = winston_1.default.createLogger({
            level,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
            transports: [
                new winston_1.default.transports.Console({
                    format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.printf(({ level, message, timestamp }) => {
                        return `${chalk_1.default.gray(timestamp)} ${level}: ${message}`;
                    }))
                }),
                new winston_1.default.transports.File({
                    filename: 'multi-agent.log',
                    format: winston_1.default.format.json()
                })
            ]
        });
    }
    info(message) {
        this.winston.info(message);
    }
    error(message) {
        this.winston.error(message);
    }
    warn(message) {
        this.winston.warn(message);
    }
    debug(message) {
        this.winston.debug(message);
    }
    success(message) {
        console.log(chalk_1.default.green('✓'), message);
    }
    task(message) {
        console.log(chalk_1.default.blue('→'), message);
    }
    agent(agentId, message) {
        console.log(chalk_1.default.cyan(`[${agentId}]`), message);
    }
}
exports.Logger = Logger;
//# sourceMappingURL=Logger.js.map