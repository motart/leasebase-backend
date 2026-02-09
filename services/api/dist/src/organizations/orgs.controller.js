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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrgsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const orgs_service_1 = require("./orgs.service");
const dto_1 = require("./dto");
const public_decorator_1 = require("../common/decorators/public.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let OrgsController = class OrgsController {
    constructor(orgsService) {
        this.orgsService = orgsService;
    }
    createOrg(dto) {
        return this.orgsService.bootstrapOrganization(dto);
    }
    getMe(user) {
        return this.orgsService.getCurrentOrg(user);
    }
    createUser(user, dto) {
        return this.orgsService.createUserInOrg(user, dto);
    }
    listUsers(user) {
        return this.orgsService.listUsers(user);
    }
    updateUser(user, id, dto) {
        return this.orgsService.updateUser(user, id, dto);
    }
};
exports.OrgsController = OrgsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Bootstrap a new organization with initial admin user' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateOrgDto]),
    __metadata("design:returntype", void 0)
], OrgsController.prototype, "createOrg", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ORG_ADMIN, client_1.UserRole.PM_STAFF, client_1.UserRole.OWNER, client_1.UserRole.TENANT),
    (0, swagger_1.ApiOperation)({ summary: 'Get current organization info' }),
    __param(0, (0, current_user_decorator_1.CurrentUserDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrgsController.prototype, "getMe", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ORG_ADMIN, client_1.UserRole.PM_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'Create/invite user in current organization' }),
    __param(0, (0, current_user_decorator_1.CurrentUserDecorator)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateOrgUserDto]),
    __metadata("design:returntype", void 0)
], OrgsController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ORG_ADMIN, client_1.UserRole.PM_STAFF),
    (0, swagger_1.ApiOperation)({ summary: 'List users in current organization' }),
    __param(0, (0, current_user_decorator_1.CurrentUserDecorator)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrgsController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    (0, roles_decorator_1.Roles)(client_1.UserRole.ORG_ADMIN),
    (0, swagger_1.ApiOperation)({ summary: 'Update user role/status in current organization' }),
    __param(0, (0, current_user_decorator_1.CurrentUserDecorator)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateOrgUserDto]),
    __metadata("design:returntype", void 0)
], OrgsController.prototype, "updateUser", null);
exports.OrgsController = OrgsController = __decorate([
    (0, swagger_1.ApiTags)('orgs'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('orgs'),
    __metadata("design:paramtypes", [orgs_service_1.OrgsService])
], OrgsController);
//# sourceMappingURL=orgs.controller.js.map