"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonLogger = void 0;
const common_1 = require("@nestjs/common");
let JsonLogger = class JsonLogger {
    log(message, context) {
        console.log(JSON.stringify({ level: 'info', message, context, timestamp: new Date().toISOString() }));
    }
    error(message, trace, context) {
        console.error(JSON.stringify({
            level: 'error',
            message,
            trace,
            context,
            timestamp: new Date().toISOString(),
        }));
    }
    warn(message, context) {
        console.warn(JSON.stringify({ level: 'warn', message, context, timestamp: new Date().toISOString() }));
    }
    debug(message, context) {
        console.debug(JSON.stringify({ level: 'debug', message, context, timestamp: new Date().toISOString() }));
    }
    verbose(message, context) {
        this.debug(message, context);
    }
};
exports.JsonLogger = JsonLogger;
exports.JsonLogger = JsonLogger = __decorate([
    (0, common_1.Injectable)()
], JsonLogger);
//# sourceMappingURL=logger.service.js.map