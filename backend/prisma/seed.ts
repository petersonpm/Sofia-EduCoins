import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Clear database
  await prisma.notification.deleteMany({});
  await prisma.userAchievement.deleteMany({});
  await prisma.achievement.deleteMany({});
  await prisma.avatarShopItem.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.goal.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.wallet.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared database.');

  // 2. Create Achievements (Medalhas)
  const achievements = [
    {
      name: 'Primeira tarefa concluída',
      description: 'Você completou sua primeira tarefa! Continue assim!',
      badgeKey: 'first_task',
    },
    {
      name: '10 tarefas concluídas',
      description: 'Uau! 10 tarefas completadas com sucesso.',
      badgeKey: 'ten_tasks',
    },
    {
      name: '50 tarefas concluídas',
      description: 'Mestre das responsabilidades! 50 tarefas completadas.',
      badgeKey: 'fifty_tasks',
    },
    {
      name: 'Primeiros R$ 100 economizados',
      description: 'Super poupador! Você guardou seus primeiros R$ 100.',
      badgeKey: 'saved_100',
    },
    {
      name: 'Leitor da semana',
      description: 'Devorador de livros! Completou 3 tarefas de leitura em uma semana.',
      badgeKey: 'weekly_reader',
    },
    {
      name: 'Mestre da organização',
      description: 'Quarto impecável e brinquedos guardados!',
      badgeKey: 'organization_master',
    },
  ];

  for (const ach of achievements) {
    await prisma.achievement.create({ data: ach });
  }
  console.log('Created achievements.');

  // 3. Create Avatar Shop Items
  const shopItems = [
    // Hair (Cabelos)
    { name: 'Cabelo Azul Estiloso', category: 'HAIR', price: 50, assetKey: 'hair_blue' },
    { name: 'Cabelo Rosa Mágico', category: 'HAIR', price: 50, assetKey: 'hair_pink' },
    { name: 'Cabelo Super Saiyajin', category: 'HAIR', price: 150, assetKey: 'hair_fire' },
    
    // Clothes (Roupas)
    { name: 'Capa de Super-herói', category: 'CLOTHES', price: 100, assetKey: 'clothes_hero' },
    { name: 'Armadura Lendária', category: 'CLOTHES', price: 200, assetKey: 'clothes_armor' },
    { name: 'Pijama de Dinossauro', category: 'CLOTHES', price: 40, assetKey: 'clothes_dino' },

    // Accessories (Acessórios)
    { name: 'Óculos de Sol Irado', category: 'ACCESSORY', price: 30, assetKey: 'accessory_shades' },
    { name: 'Coroa Real de Ouro', category: 'ACCESSORY', price: 120, assetKey: 'accessory_crown' },
    { name: 'Asas de Fada Brilhantes', category: 'ACCESSORY', price: 80, assetKey: 'accessory_fairy' },

    // Mascots (Mascotes)
    { name: 'Dragãozinho de Fogo', category: 'MASCOT', price: 300, assetKey: 'mascot_dragon' },
    { name: 'Unicórnio Arco-íris', category: 'MASCOT', price: 350, assetKey: 'mascot_unicorn' },
    { name: 'Gatinho Galáctico', category: 'MASCOT', price: 180, assetKey: 'mascot_cat' },
  ];

  for (const item of shopItems) {
    await prisma.avatarShopItem.create({ data: item });
  }
  console.log('Created avatar shop items.');

  // 4. Create Admin User (Parent)
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@educoins.com',
      password: hashedPassword,
      role: 'PARENT',
    },
  });

  console.log('Created admin user.');

  // 5. Create Wallet for Admin
  await prisma.wallet.create({
    data: {
      userId: admin.id,
      balanceCoins: 0,
      balanceReal: 0.00,
    },
  });
  console.log('Created admin wallet.');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
