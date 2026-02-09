"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const roles_guard_1 = require("./common/guards/roles.guard");
const health_module_1 = require("./health/health.module");
const orgs_module_1 = require("./organizations/orgs.module");
const properties_module_1 = require("./properties/properties.module");
const leases_module_1 = require("./leases/leases.module");
const payments_module_1 = require("./payments/payments.module");
const maintenance_module_1 = require("./maintenance/maintenance.module");
const documents_module_1 = require("./documents/documents.module");
const billing_module_1 = require("./billing/billing.module");
const audit_module_1 = require("./audit/audit.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '60000', 10) / 1000,
                    limit: parseInt(process.env.RATE_LIMIT_MAX ?? '100', 10),
                },
            ]),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            health_module_1.HealthModule,
            orgs_module_1.OrgsModule,
            properties_module_1.PropertiesModule,
            leases_module_1.LeasesModule,
            payments_module_1.PaymentsModule,
            maintenance_module_1.MaintenanceModule,
            documents_module_1.DocumentsModule,
            billing_module_1.BillingModule,
            audit_module_1.AuditModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map