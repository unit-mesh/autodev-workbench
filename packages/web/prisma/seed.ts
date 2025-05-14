import {prisma} from "./prisma";

async function main() {
    // 创建默认项目
    const defaultProject = await prisma.project.upsert({
        where: {id: 'default-project'},
        update: {},
        create: {
            id: 'default-project',
            name: 'AutoDev Workbench',
            description: '默认项目，用于存储无项目归属的资源',
            gitUrl: 'https://github.com/unit-mesh/autodev-workbench',
            isDefault: true
        },
    });

    console.log('默认项目已创建:', defaultProject);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
