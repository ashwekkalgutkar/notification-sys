"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding Configurable Notification System database...');
    await prisma.notificationLog.deleteMany();
    await prisma.notificationRule.deleteMany();
    const rule1 = await prisma.notificationRule.create({
        data: {
            name: 'High-Value Order Alert',
            triggerEvent: 'order.created',
            conditions: JSON.stringify([
                { field: 'orderValue', operator: 'gte', value: 10000 },
                { field: 'currency', operator: 'eq', value: 'USD' },
            ]),
            recipients: JSON.stringify(['finance@acme.com', 'account-mgr@acme.com']),
            channels: JSON.stringify(['email', 'in_app']),
            messageTemplate: 'High-value order {{orderId}} placed by {{customerName}} for ${{orderValue}} USD!',
            isEnabled: true,
        },
    });
    const rule2 = await prisma.notificationRule.create({
        data: {
            name: 'VIP Customer Welcome',
            triggerEvent: 'user.signup',
            conditions: JSON.stringify([
                { field: 'user.tier', operator: 'eq', value: 'VIP' },
            ]),
            recipients: JSON.stringify(['vip-support@acme.com']),
            channels: JSON.stringify(['email']),
            messageTemplate: 'Welcome new VIP user {{user.name}} ({{user.email}})! Assigned concierge: {{user.concierge}}',
            isEnabled: true,
        },
    });
    const rule3 = await prisma.notificationRule.create({
        data: {
            name: 'Low Inventory Warning',
            triggerEvent: 'inventory.updated',
            conditions: JSON.stringify([
                { field: 'stockLevel', operator: 'lt', value: 20 },
            ]),
            recipients: JSON.stringify(['warehouse-lead@acme.com']),
            channels: JSON.stringify(['in_app']),
            messageTemplate: 'Warning: Item {{sku}} stock dropped to {{stockLevel}} units in warehouse {{warehouseId}}.',
            isEnabled: false,
        },
    });
    console.log(`✅ Created ${3} initial notification rules:`);
    console.log(`   - Rule 1: ${rule1.name} (ID: ${rule1.id})`);
    console.log(`   - Rule 2: ${rule2.name} (ID: ${rule2.id})`);
    console.log(`   - Rule 3: ${rule3.name} (ID: ${rule3.id})`);
    await prisma.notificationLog.create({
        data: {
            ruleId: rule1.id,
            recipient: 'finance@acme.com',
            channel: 'email',
            status: 'sent',
            payload: JSON.stringify({
                orderId: 'ORD-98721',
                customerName: 'Acme Corp',
                orderValue: 15400,
                currency: 'USD',
            }),
            reason: null,
            eventId: 'evt-init-001',
        },
    });
    await prisma.notificationLog.create({
        data: {
            ruleId: rule1.id,
            recipient: 'account-mgr@acme.com',
            channel: 'in_app',
            status: 'sent',
            payload: JSON.stringify({
                orderId: 'ORD-98721',
                customerName: 'Acme Corp',
                orderValue: 15400,
                currency: 'USD',
            }),
            reason: null,
            eventId: 'evt-init-001',
        },
    });
    console.log('✅ Seeded initial notification logs.');
}
main()
    .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map