import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // ── 创建演示用户 ──
  const hashedPassword = await bcrypt.hash('demo123', 10);
  const user = await prisma.user.upsert({
    where: { username: 'demo' },
    update: {},
    create: { username: 'demo', password: hashedPassword },
  });

  // ── 示例题目：行测-判断推理-削弱型 ──
  const existing = await prisma.question.findFirst({
    where: { userId: user.id, module: '行测', questionType: '削弱型' },
  });

  if (!existing) {
    await prisma.question.create({
      data: {
        userId: user.id,
        module: '行测',
        submodule: '判断推理',
        questionType: '削弱型',
        difficulty: 3,
        tags: JSON.stringify(['另有他因', '因果论证', '对照实验']),
        frequency: '高频',
        year: '2023',
        stem: `研究人员对某城市1000名居民进行了一项关于睡眠与工作效率关系的调查。结果显示，每天睡眠时间少于6小时的居民中，有70%的人工作效率自评较低；而每天睡眠时间在7—8小时的居民中，仅有20%的人工作效率自评较低。因此，研究人员得出结论：睡眠不足会导致工作效率下降。

以下哪项如果为真，最能削弱上述结论？`,
        options: JSON.stringify([
          { label: 'A', content: '每天睡眠时间少于6小时的居民中，有很多人从事的是夜班工作，而夜班工作本身就会降低工作效率' },
          { label: 'B', content: '该调查中工作效率为居民自评，可能存在主观偏差，不能准确反映真实的工作效率水平' },
          { label: 'C', content: '一些每天睡眠7—8小时的居民也存在工作效率低下的情况' },
          { label: 'D', content: '医学研究已证实，睡眠不足会影响大脑的认知功能，进而影响工作效率' },
        ]),
        correctAnswer: 'A',
        breakthrough: `题干由"睡眠少的人群效率低"推出"睡眠不足导致效率下降"，属于因果论证；削弱的关键在于寻找"另有他因"——是否存在第三个因素同时导致了睡眠少和效率低。`,
        correctAnalysis: `**正确答案：A**

题干论证结构：
- 论据：睡眠<6小时组中70%效率低，睡眠7—8小时组中仅20%效率低（两组数据差异显著）
- 结论：睡眠不足→工作效率下降（因果关系）

选项A指出：睡眠少于6小时的居民中，很多人从事夜班工作，而夜班工作本身就会降低工作效率。这意味着——真正导致效率下降的可能不是"睡眠不足"，而是"夜班工作"这一第三方因素。

夜班工作同时关联了"睡眠少"（夜班导致白天补觉不足）和"效率低"（夜班本身降低效率），构成经典的**"另有他因"**削弱。

A项直接切断了"睡眠不足"与"效率下降"之间的因果链条，使原结论的因果归因不再成立，削弱力度最强。`,
        trapAnalysis: JSON.stringify([
          {
            option: 'B',
            errorType: '削弱力度弱（质疑数据可靠性）',
            explanation: 'B项指出工作效率为自评、存在主观偏差，确实有一定削弱力，但仅质疑了论据的可靠性，未直接否定因果关系的存在。且"主观偏差"不等于"结论错误"，削弱力度远弱于A项的另有他因。属于"质疑论据"型削弱，力度一般弱于"另有他因"。',
          },
          {
            option: 'C',
            errorType: '无关项 / 不能削弱',
            explanation: 'C项指出7—8小时组也有人效率低，但题干比较的是两组效率低的比例（70% vs 20%），并非说睡眠充足组"无人效率低"。个别反例不能推翻整体趋势性结论，属于以偏概全的无效削弱。',
          },
          {
            option: 'D',
            errorType: '加强项（方向错误）',
            explanation: 'D项指出睡眠不足会影响认知功能进而影响效率，这恰恰从医学机制层面支持了题干结论，是**加强项**而非削弱项。选D属于审题方向错误。',
          },
        ]),
        methodSummary: `**削弱型题目的削弱力度排序（高频口诀）：**

> 另有他因 > 因果倒置 > 切断联系 > 质疑论据 > 质疑方法

| 削弱类型 | 核心逻辑 | 力度 |
|---------|---------|------|
| 另有他因 | 第三方因素同时导致"因"和"果" | ★★★★★ |
| 因果倒置 | 颠倒因果关系（果→因） | ★★★★★ |
| 切断联系 | 断开论据到结论的推导桥梁 | ★★★★ |
| 质疑论据 | 数据/样本不可靠 | ★★★ |
| 质疑方法 | 调查方法有缺陷 | ★★ |

**本题核心方法：** 看到"A导致B"类因果论证，优先寻找"第三方因素C同时导致A和B"——即"另有他因"。`,
        examTips: `1. **易混淆点**：另有他因 ≠ 单纯否定。"否定题干结论"不是削弱，给出替代解释才是削弱。
2. **审题陷阱**：注意题干问"最能削弱"还是"最不能削弱"——方向反了会选加强项（如D）。
3. **数据型因果论证**：看到"高X组中Y比例高"就推"X导致Y"，必找"X组本身有特殊性"。
4. **关联知识点**：加强型是削弱的镜像——加强时优先找"排除他因"或"建立因果机制"。`,
        analysisSource: 'manual',
        aiModel: null,
      },
    });
    console.log('  ✅ 示例题目已创建: 行测-判断推理-削弱型');
  } else {
    console.log('  ℹ️  示例题目已存在，跳过');
  }

  console.log('\n========================================');
  console.log('  PubExam 数据库初始化完成');
  console.log('========================================');
  console.log('  演示账号: demo / demo123');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
