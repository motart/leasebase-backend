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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const jose_1 = require("jose");
let AuthService = class AuthService {
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
        this.jwks = null;
    }
    get devBypassEnabled() {
        return this.config.get('DEV_AUTH_BYPASS') === 'true';
    }
    async getCurrentUserFromRequest(req) {
        if (this.devBypassEnabled) {
            return this.handleDevBypass(req);
        }
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new common_1.UnauthorizedException('Missing bearer token');
        }
        const token = authHeader.slice('Bearer '.length);
        const payload = await this.verifyCognitoJwt(token);
        return this.mapPayloadToUser(payload);
    }
    async handleDevBypass(req) {
        const email = (req.headers['x-dev-user-email'] || '');
        const roleHeader = (req.headers['x-dev-user-role'] || '');
        const orgIdHeader = (req.headers['x-dev-org-id'] || '');
        if (!email || !roleHeader || !orgIdHeader) {
            throw new common_1.UnauthorizedException('DEV_AUTH_BYPASS enabled but dev headers are missing (x-dev-user-email, x-dev-user-role, x-dev-org-id)');
        }
        const role = roleHeader.toUpperCase() ?? client_1.UserRole.ORG_ADMIN;
        const org = await this.prisma.organization.upsert({
            where: { id: orgIdHeader },
            update: {},
            create: {
                id: orgIdHeader,
                type: client_1.OrganizationType.PM_COMPANY,
                name: `Dev Org ${orgIdHeader}`,
                plan: 'dev',
            },
        });
        const user = await this.prisma.user.upsert({
            where: { organizationId_email: { organizationId: org.id, email } },
            update: { role },
            create: {
                organizationId: org.id,
                email,
                name: email,
                role,
            },
        });
        return {
            id: user.id,
            orgId: org.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    }
    async verifyCognitoJwt(token) {
        const region = this.config.get('COGNITO_REGION');
        const userPoolId = this.config.get('COGNITO_USER_POOL_ID');
        const clientId = this.config.get('COGNITO_CLIENT_ID');
        if (!region || !userPoolId || !clientId) {
            throw new common_1.UnauthorizedException('Cognito configuration is missing');
        }
        if (!this.jwks) {
            const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
            const jwksUri = new URL(`${issuer}/.well-known/jwks.json`);
            this.jwks = (0, jose_1.createRemoteJWKSet)(jwksUri);
        }
        const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
        const { payload } = await (0, jose_1.jwtVerify)(token, this.jwks, {
            issuer,
            audience: clientId,
        });
        return payload;
    }
    async mapPayloadToUser(payload) {
        const sub = payload.sub;
        const email = payload.email ?? '';
        const orgIdClaim = payload['custom:orgId'] ?? '';
        const roleClaim = payload['custom:role'] ?? 'TENANT';
        if (!sub || !email || !orgIdClaim) {
            throw new common_1.UnauthorizedException('JWT is missing required claims');
        }
        const role = roleClaim.toUpperCase() ?? client_1.UserRole.TENANT;
        const org = await this.prisma.organization.findUnique({ where: { id: orgIdClaim } });
        if (!org) {
            throw new common_1.UnauthorizedException('Organization not found for token');
        }
        const user = await this.prisma.user.upsert({
            where: { organizationId_email: { organizationId: org.id, email } },
            update: { cognitoSub: sub, role },
            create: {
                organizationId: org.id,
                email,
                name: email,
                cognitoSub: sub,
                role,
            },
        });
        return {
            id: user.id,
            orgId: org.id,
            email: user.email,
            name: user.name,
            role: user.role,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], AuthService);
//# sourceMappingURL=auth.service.js.map