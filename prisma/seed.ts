import { PrismaClient, Role, TagType, Priority, WorkItemType } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { encrypt } from '../lib/crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('Erasing database...')
  await prisma.notification.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.attachment.deleteMany()
  await prisma.workItemStage.deleteMany()
  await prisma.workItemTag.deleteMany()
  await prisma.workItem.deleteMany()
  await prisma.quotaWeek.deleteMany()
  await prisma.quotaMonth.deleteMany()
  await prisma.contract.deleteMany()
  await prisma.clientTag.deleteMany()
  await prisma.client.deleteMany()
  await prisma.processStageTemplate.deleteMany()
  await prisma.processTemplateVersion.deleteMany()
  await prisma.processTemplate.deleteMany()
  await prisma.calendarEvent.deleteMany()
  await prisma.eventType.deleteMany()
  await prisma.workType.deleteMany()
  await prisma.brandSequence.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.user.deleteMany()
  await prisma.capability.deleteMany()
  console.log('Database erased.')

  console.log('Seeding database...')
  
  const defaultPassword = await bcrypt.hash('password123', 10)

  // 1. Capabilities
  const capabilitiesData = [
    'Designer',
    'Editor',
    'Photographer / Videographer',
    'Reviewer',
    'Developer',
    'Content & Copy',
    'Collaborator',
  ]

  const capabilityMap: Record<string, string> = {}
  for (const name of capabilitiesData) {
    const cap = await prisma.capability.create({ data: { name } })
    capabilityMap[name] = cap.id
  }
  console.log('Capabilities seeded.')

  // 2. Brand Tags
  const fcTag = await prisma.tag.create({
    data: {
      name: 'Football Counter',
      type: TagType.BRAND,
      brandSequence: {
        create: { prefix: 'FC', lastNumber: 0 },
      },
    },
  })

  const kwTag = await prisma.tag.create({
    data: {
      name: 'Kodewise',
      type: TagType.BRAND,
      brandSequence: {
        create: { prefix: 'KW', lastNumber: 0 },
      },
    },
  })
  console.log('Brand Tags seeded.')

  // 3. Users (with brand associations)
  const usersData = [
    { name: 'Loknath Epili', role: Role.TEAM_LEADER, caps: [], brandId: null },
    { name: 'Aayush Dalvi', role: Role.EMPLOYEE, caps: ['Designer', 'Editor', 'Collaborator'], brandId: fcTag.id },
    { name: 'Reesha Cordha', role: Role.EMPLOYEE, caps: ['Content & Copy'], brandId: fcTag.id },
    { name: 'Pranjal Yadav', role: Role.EMPLOYEE, caps: ['Editor', 'Collaborator'], brandId: fcTag.id },
    { name: 'Chandler Dsilva', role: Role.EMPLOYEE, caps: ['Photographer / Videographer'], brandId: fcTag.id },
    { name: 'Ravi Patadia', role: Role.EMPLOYEE, caps: ['Developer'], brandId: kwTag.id },
    { name: 'Ocina Serra', role: Role.EMPLOYEE, caps: ['Designer'], brandId: kwTag.id },
    { name: 'Deepak Yadav', role: Role.EMPLOYEE, caps: ['Editor', 'Reviewer'], brandId: kwTag.id },
    { name: 'Amit Yadav', role: Role.TEAM_LEADER, caps: [], brandId: null },
  ]

  for (const user of usersData) {
    const email = `${user.name.toLowerCase().replace(/ /g, '.')}@kodewise.local`
    await prisma.user.create({
      data: {
        name: user.name,
        email: email,
        password: defaultPassword,
        role: user.role,
        roles: [user.role],
        brandId: user.brandId,
        capabilities: {
          connect: user.caps.map((c) => ({ id: capabilityMap[c] })),
        },
      },
    })
  }
  console.log('Users seeded.')

  // 4. Client Type Tags
  const clientTypeTags = ['Retainer', 'Coverage', 'One-off']
  const clientTypeTagMap: Record<string, string> = {}
  for (const tagName of clientTypeTags) {
    const tag = await prisma.tag.create({ data: { name: tagName, type: TagType.CLIENT_TYPE } })
    clientTypeTagMap[tagName] = tag.id
  }
  console.log('Client Type Tags seeded.')

  // 5. Clients with Encrypted Contact Details
  const fcClientsData = [
    { name: 'MYJ', post: 3, reel: 2 },
    { name: 'Mumbai Islanders', post: 3, reel: 4 },
    { name: 'GIFA', post: 3, reel: 2 },
    { name: 'Stellar', post: 4, reel: 3 },
    { name: 'YSA', post: 4, reel: 2 },
    { name: 'YFC', post: 6, reel: 6 },
    { name: 'Feugo', post: 3, reel: 2 },
    { name: 'FC', post: 6, reel: 6 }
  ];

  const kwClientsData = [
    { name: "Lupin Foundation", amc: true, seo: false, status: "Working", revamp: "None" },
    { name: "Lupin AU", amc: true, seo: true, status: "Working", revamp: "Completed" },
    { name: "Grab The Goanna", amc: true, seo: false, status: "Working", revamp: "Near future" },
    { name: "Pharmacy Action", amc: true, seo: false, status: "Working", revamp: "Near future" },
    { name: "Aptivate", amc: true, seo: false, status: "Working", revamp: "None" },
    { name: "Aptivate Run", amc: true, seo: false, status: "Working", revamp: "None" },
    { name: "Aptivate Starkids", amc: true, seo: false, status: "Working", revamp: "None" },
    { name: "Atharvability", amc: true, seo: true, status: "Working", revamp: "In progress (UAT)" },
    { name: "Atharva Delhi", amc: true, seo: false, status: "Working", revamp: "Completed" },
    { name: "CDMO", amc: true, seo: true, status: "Working", revamp: "None" },
    { name: "Softovac", amc: true, seo: false, status: "Working", revamp: "None" },
    { name: "MYJ", amc: true, seo: false, status: "Working", revamp: "None" },
    { name: "WIFA", amc: false, seo: false, status: "Working", revamp: "None" },
    { name: "TSA", amc: false, seo: false, status: "Working", revamp: "None" },
    { name: "YFC", amc: true, seo: false, status: "Beta — pending go-live", revamp: "None" },
    { name: "Mumbai Islanders", amc: true, seo: false, status: "Beta — pending go-live", revamp: "None" },
    { name: "ACOSA", amc: true, seo: false, status: "Working", revamp: "None" },
    { name: "Edelassurance", amc: true, seo: false, status: "Working", revamp: "None" },
    { name: "Kodewise", amc: true, seo: true, status: "Working", revamp: "Requirement gathering" },
    { name: "Football Counter", amc: true, seo: true, status: "Working", revamp: "Requirement gathering" }
  ];

  let sampleClient = null;

  // Seed Football Counter Clients
  let fcClientIndex = 1;
  for (const c of fcClientsData) {
    const customNotes = JSON.stringify({
      amc: false,
      seo: false,
      status: "Working",
      revamp: "None",
      post: c.post,
      reel: c.reel
    });

    const client = await prisma.client.create({
      data: {
        name: c.name,
        clientCode: fcClientIndex.toString().padStart(3, '0'),
        description: `Client ${c.name} for Football Counter`,
        contactPerson: encrypt(`${c.name} Contact Person`),
        email: encrypt(`contact@${c.name.toLowerCase().replace(/ /g, '')}.com`),
        phone: encrypt(`+91 98765 43210`),
        address: encrypt(`123 Football Lane, Sports City`),
        notes: customNotes,
        tags: {
          create: [
            { tagId: fcTag.id },
            { tagId: clientTypeTagMap['Retainer'] }
          ]
        }
      },
    });

    if (c.name === 'MYJ') {
      sampleClient = client;
    }
    fcClientIndex++;
  }

  // Seed Kodewise Clients
  let kwClientIndex = 1;
  for (const c of kwClientsData) {
    const customNotes = JSON.stringify({
      amc: c.amc,
      seo: c.seo,
      status: c.status,
      revamp: c.revamp,
      post: 3,
      reel: 2
    });

    await prisma.client.create({
      data: {
        name: c.name,
        clientCode: kwClientIndex.toString().padStart(3, '0'),
        description: `Client ${c.name} for Kodewise`,
        contactPerson: encrypt(`${c.name} Developer Contact`),
        email: encrypt(`info@${c.name.toLowerCase().replace(/ /g, '')}.kodewise.com`),
        phone: encrypt(`+91 91234 56789`),
        address: encrypt(`456 Tech Park, Kodewise Boulevard`),
        notes: customNotes,
        tags: {
          create: [
            { tagId: kwTag.id },
            { tagId: clientTypeTagMap['Retainer'] }
          ]
        }
      },
    });
    kwClientIndex++;
  }
  console.log('Clients seeded.');

  // Sample Contract for MYJ
  if (sampleClient) {
    await prisma.contract.create({
      data: {
        clientId: sampleClient.id,
        startDate: new Date(),
        monthlyTarget: 15,
        quotaMonths: {
          create: {
            periodYearMonth: '2026-07',
            monthlyTarget: 15,
            totalTarget: 15,
            quotaWeeks: {
              create: [
                { weekNumber: 1, weeklyTarget: 4 },
                { weekNumber: 2, weeklyTarget: 4 },
                { weekNumber: 3, weeklyTarget: 4 },
                { weekNumber: 4, weeklyTarget: 3 },
              ]
            }
          }
        }
      }
    })
    console.log('Sample Contract seeded for MYJ.')
  }

  // 6. WorkTypes
  const workTypesData = [
    { name: 'Video Reel', isDeliverable: true },
    { name: 'Static Post', isDeliverable: true },
    { name: 'YouTube', isDeliverable: true },
    { name: 'Publish Stories', isDeliverable: true },
    { name: 'Shoot', isDeliverable: false },
    { name: 'Match Coverage', isDeliverable: false },
    { name: 'Event', isDeliverable: false },
    { name: 'Page Creation', isDeliverable: true },
    { name: 'SEO', isDeliverable: true },
    { name: 'Media Update', isDeliverable: true },
    { name: 'Blog / Case Study', isDeliverable: true },
    { name: 'Other', isDeliverable: false },
  ]

  for (const wt of workTypesData) {
    await prisma.workType.create({
      data: { name: wt.name, isDeliverable: wt.isDeliverable },
    })
  }
  console.log('WorkTypes seeded.')

  // 7. EventTypes
  const eventTypesData = [
    'Matchday', 'Practice Shoot', 'Academy Shoot',
    'On-field Day', 'Coverage Event', 'General Event',
  ]

  for (const et of eventTypesData) {
    await prisma.eventType.create({
      data: { name: et },
    })
  }
  console.log('EventTypes seeded.')

  // 8. Sample Process Template
  await prisma.processTemplate.create({
    data: {
      name: 'Standard Reel Workflow',
      description: 'Standard workflow for producing a video reel.',
      versions: {
        create: {
          version: 1,
          isPublished: true,
          stages: {
            create: [
              {
                name: 'Copywriting',
                order: 1,
                capabilityId: capabilityMap['Content & Copy'],
                estimatedDurationMins: 60,
                isDefaultOpenPool: true,
              },
              {
                name: 'Video Editing',
                order: 2,
                capabilityId: capabilityMap['Editor'],
                estimatedDurationMins: 180,
                isDefaultOpenPool: true,
                requiresTLApproval: true,
              },
              {
                name: 'Final Review',
                order: 3,
                capabilityId: capabilityMap['Reviewer'],
                estimatedDurationMins: 30,
                isDefaultOpenPool: false,
                requiresManualClientAcceptance: true,
              }
            ]
          }
        }
      }
    }
  })
  console.log('Sample ProcessTemplate seeded.')

  // 9. General Task (No Process) Template
  await prisma.processTemplate.create({
    data: {
      name: 'General Task (No Process)',
      description: 'Single-stage task for ad-hoc assignments.',
      versions: {
        create: {
          version: 1,
          isPublished: true,
          stages: {
            create: [
              {
                name: 'Execution',
                order: 1,
                estimatedDurationMins: 480,
                isDefaultOpenPool: false,
              }
            ]
          }
        }
      }
    }
  })
  console.log('General Task ProcessTemplate seeded.')

  console.log('Seeding complete! Initial master data is ready.')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
