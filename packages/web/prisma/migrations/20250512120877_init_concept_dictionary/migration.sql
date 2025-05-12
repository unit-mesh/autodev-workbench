-- 创建默认项目(如果不存在)
DO $$
    DECLARE
        default_project_id TEXT;
    BEGIN
        -- 查找默认项目
        SELECT id INTO default_project_id FROM "Project" WHERE "isDefault" = true LIMIT 1;

        -- 如果不存在默认项目，创建一个
        IF default_project_id IS NULL THEN
            INSERT INTO "Project" (
                id,
                name,
                description,
                "gitUrl",
                "isDefault",
                "createdAt",
                "updatedAt"
            ) VALUES (
                         gen_random_uuid(),
                         '会议室预订系统',
                         '公司内部会议室预订和管理系统',
                         'https://github.com/example/meeting-room-system',
                         true,
                         NOW(),
                         NOW()
                     ) RETURNING id INTO default_project_id;

            RAISE NOTICE '创建了默认项目: %', default_project_id;
        END IF;

        -- 添加示例词汇表数据
        -- 会议室
        INSERT INTO "ConceptDictionary" (
            id,
            "termChinese",
            "termEnglish",
            "descChinese",
            "descEnglish",
            "projectId",
            "createdAt",
            "updatedAt"
        )
        SELECT
            gen_random_uuid(),
            '会议室',
            'Meeting Room',
            '公司内用于举行会议的专用空间',
            'A dedicated space within the company for holding meetings',
            default_project_id,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM "ConceptDictionary"
            WHERE "termChinese" = '会议室' AND "projectId" = default_project_id
        );

        -- 预订时段
        INSERT INTO "ConceptDictionary" (
            id,
            "termChinese",
            "termEnglish",
            "descChinese",
            "descEnglish",
            "projectId",
            "createdAt",
            "updatedAt"
        )
        SELECT
            gen_random_uuid(),
            '预订时段',
            'Booking Slot',
            '用户预留会议室的特定时间段',
            'A specific time period reserved by users for a meeting room',
            default_project_id,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM "ConceptDictionary"
            WHERE "termChinese" = '预订时段' AND "projectId" = default_project_id
        );

        -- 冲突检测
        INSERT INTO "ConceptDictionary" (
            id,
            "termChinese",
            "termEnglish",
            "descChinese",
            "descEnglish",
            "projectId",
            "createdAt",
            "updatedAt"
        )
        SELECT
            gen_random_uuid(),
            '冲突检测',
            'Conflict Detection',
            '系统检查并防止多个预订在同一时间段占用同一会议室的机制',
            'A mechanism that checks and prevents multiple bookings from occupying the same meeting room during the same time slot',
            default_project_id,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM "ConceptDictionary"
            WHERE "termChinese" = '冲突检测' AND "projectId" = default_project_id
        );

        -- 资源列表
        INSERT INTO "ConceptDictionary" (
            id,
            "termChinese",
            "termEnglish",
            "descChinese",
            "descEnglish",
            "projectId",
            "createdAt",
            "updatedAt"
        )
        SELECT
            gen_random_uuid(),
            '资源列表',
            'Resource List',
            '会议室中可用的设备和服务的清单',
            'An inventory of available equipment and services in a meeting room',
            default_project_id,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM "ConceptDictionary"
            WHERE "termChinese" = '资源列表' AND "projectId" = default_project_id
        );

        -- 审批流程
        INSERT INTO "ConceptDictionary" (
            id,
            "termChinese",
            "termEnglish",
            "descChinese",
            "descEnglish",
            "projectId",
            "createdAt",
            "updatedAt"
        )
        SELECT
            gen_random_uuid(),
            '审批流程',
            'Approval Process',
            '某些特殊会议室或时段预订需要管理员审核的流程',
            'The process by which certain special meeting room or time slot bookings require administrator review',
            default_project_id,
            NOW(),
            NOW()
        WHERE NOT EXISTS (
            SELECT 1 FROM "ConceptDictionary"
            WHERE "termChinese" = '审批流程' AND "projectId" = default_project_id
        );

        RAISE NOTICE '示例词汇表数据创建完成';
    END $$;
