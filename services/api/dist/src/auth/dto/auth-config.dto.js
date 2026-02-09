"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthConfigDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class AuthConfigDto {
}
exports.AuthConfigDto = AuthConfigDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'AWS region for the Cognito User Pool' }),
    __metadata("design:type", String)
], AuthConfigDto.prototype, "region", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cognito User Pool ID' }),
    __metadata("design:type", String)
], AuthConfigDto.prototype, "userPoolId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cognito App Client ID used by the web frontend' }),
    __metadata("design:type", String)
], AuthConfigDto.prototype, "clientId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Expected JWT issuer URL for this user pool' }),
    __metadata("design:type", String)
], AuthConfigDto.prototype, "issuer", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'JWKS URL used by the API to validate tokens' }),
    __metadata("design:type", String)
], AuthConfigDto.prototype, "jwksUri", void 0);
//# sourceMappingURL=auth-config.dto.js.map