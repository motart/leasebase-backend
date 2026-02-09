import { PrismaService } from '../prisma/prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    healthz(): {
        status: string;
    };
    readyz(): Promise<{
        status: string;
    }>;
}
