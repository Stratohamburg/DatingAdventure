// ... existing code ...
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const npcsDir = path.join(__dirname, 'data', 'npcs');
const excelPath = path.join(__dirname, 'npcs_data.xlsx');

function exportToExcel() {
    const files = fs.readdirSync(npcsDir).filter(f => f.endsWith('.json'));
    const npcsData = [];
    const dialoguesData = [];

    files.forEach(file => {
        const data = JSON.parse(fs.readFileSync(path.join(npcsDir, file), 'utf8'));
        
        // 提取 NPC 基本信息
        npcsData.push({
            npcId: data.npcId,
            name: data.name,
            description: data.description,
            archetype: data.archetype,
            'stats.observation': data.stats.observation,
            'stats.materialism': data.stats.materialism,
            'stats.romanticism': data.stats.romanticism,
            'threshold.initial': data.satisfactionThreshold.initial,
            'threshold.fail': data.satisfactionThreshold.fail,
            'threshold.success': data.satisfactionThreshold.success
        });

        // 提取对话树信息
        for (const topicId in data.dialogueTree) {
            const topic = data.dialogueTree[topicId];
            const weight = data.topicWeights[topicId] || 1.0;
            
            topic.options.forEach((opt, index) => {
                dialoguesData.push({
                    npcId: data.npcId,
                    topicId: topic.topicId,
                    question: topic.question,
                    weight: weight,
                    optionIndex: index + 1,
                    type: opt.type,
                    text: opt.text,
                    'effect.satisfaction': opt.effect.satisfaction || 0,
                    'effect.trust': opt.effect.trust || 0,
                    itemRequired: opt.itemRequired || '',
                    riskCheck: opt.riskCheck ? 'TRUE' : 'FALSE'
                });
            });
        }
    });

    const wb = xlsx.utils.book_new();
    const wsNpcs = xlsx.utils.json_to_sheet(npcsData);
    const wsDialogues = xlsx.utils.json_to_sheet(dialoguesData);

    xlsx.utils.book_append_sheet(wb, wsNpcs, 'NPCs');
    xlsx.utils.book_append_sheet(wb, wsDialogues, 'Dialogues');

    xlsx.writeFile(wb, excelPath);
    console.log(`成功导出数据到: ${excelPath}`);
}

function importFromExcel() {
    if (!fs.existsSync(excelPath)) {
        console.error(`找不到 Excel 文件: ${excelPath}`);
        return;
    }

    const wb = xlsx.readFile(excelPath);
    const npcsData = xlsx.utils.sheet_to_json(wb.Sheets['NPCs']);
    const dialoguesData = xlsx.utils.sheet_to_json(wb.Sheets['Dialogues']);

    const npcsMap = {};

    // 还原 NPC 基本信息
    npcsData.forEach(row => {
        npcsMap[row.npcId] = {
            npcId: row.npcId,
            name: row.name,
            description: row.description,
            archetype: row.archetype,
            stats: {
                observation: Number(row['stats.observation']),
                materialism: Number(row['stats.materialism']),
                romanticism: Number(row['stats.romanticism'])
            },
            satisfactionThreshold: {
                initial: Number(row['threshold.initial']),
                fail: Number(row['threshold.fail']),
                success: Number(row['threshold.success'])
            },
            topicWeights: {},
            dialogueTree: {}
        };
    });

    // 还原对话树信息
    dialoguesData.forEach(row => {
        const npc = npcsMap[row.npcId];
        if (!npc) return;

        if (!npc.dialogueTree[row.topicId]) {
            npc.dialogueTree[row.topicId] = {
                topicId: row.topicId,
                question: row.question,
                options: []
            };
            npc.topicWeights[row.topicId] = Number(row.weight);
        }

        const option = {
            type: row.type,
            text: row.text,
            effect: {
                satisfaction: Number(row['effect.satisfaction'])
            },
            riskCheck: String(row.riskCheck).toUpperCase() === 'TRUE'
        };

        if (row['effect.trust'] !== undefined && row['effect.trust'] !== '') {
            option.effect.trust = Number(row['effect.trust']);
        }
        if (row.itemRequired) {
            option.itemRequired = row.itemRequired;
        }

        npc.dialogueTree[row.topicId].options.push(option);
    });

    // 写回 JSON 文件
    for (const npcId in npcsMap) {
        const npc = npcsMap[npcId];
        // 假设文件名与 npcId 一致（例如 gold_digger_002.json）
        // 如果 npcId 是 gold_digger_001，文件名可能是 gold_digger.json，这里做个特殊处理
        let fileName = `${npcId}.json`;
        if (npcId.endsWith('_001')) {
            fileName = `${npcId.replace('_001', '')}.json`;
        }
        
        const filePath = path.join(npcsDir, fileName);
        fs.writeFileSync(filePath, JSON.stringify(npc, null, 2));
    }
    console.log('成功从 Excel 导入数据并更新了所有 JSON 文件！');
}

const action = process.argv[2];
if (action === 'export') {
    exportToExcel();
} else if (action === 'import') {
    importFromExcel();
} else {
    console.log('使用方法:');
    console.log('  导出为 Excel: node npc_excel_tool.js export');
    console.log('  从 Excel 导入: node npc_excel_tool.js import');
}
// ... existing code ...