export const FC_TEAM = [
  "Aayush Dalvi",
  "Chandler Dsilva",
  "Pranjal Yadav",
  "Ocina Serrao",
  "Stanley Dsouza",
  "Avaneesh Kadam",
  "Reesha Chordha",
  "Loknath Epili"
];

export const KW_TEAM = [
  "Deepak Yadav",
  "Karan Thakur",
  "Amit Yadav",
  "Loknath Epili"
];

export const ALL_TEAM = Array.from(new Set([...FC_TEAM, ...KW_TEAM]));

export const POST_PIPELINE = [
  "Ideation",
  "Design",
  "Caption & copy",
  "Internal review",
  "Client approval",
  "Scheduled",
  "Published"
];

export const REEL_PIPELINE = [
  "Concept / script",
  "Photography (Shoot)",
  "Edit",
  "Internal review",
  "Client approval",
  "Published"
];

export const PHOTOGRAPHY_PIPELINE = [
  "Photography (Shoot)",
  "Edit",
  "Internal review",
  "Published"
];

export const KW_STEPS = {
  AMC: [
    "Backup verification",
    "Security scan",
    "Plugin / CMS updates",
    "Uptime & performance check",
    "Content update requests actioned",
    "Monthly report sent to client"
  ],
  SEO: [
    "Keyword & competitor research",
    "Technical SEO audit",
    "On-page optimization",
    "Content optimization / creation",
    "Backlink outreach",
    "Rank tracking & monthly report"
  ],
  Revamp: [
    "Requirement gathering",
    "Wireframing",
    "UI / UX design",
    "Development",
    "Content migration",
    "QA & internal testing",
    "UAT with client",
    "Go live"
  ]
};

export const getPipeline = (type: string) => {
  if (type === "Post") return POST_PIPELINE;
  if (type === "Reel") return REEL_PIPELINE;
  return PHOTOGRAPHY_PIPELINE;
};

export const DEFAULT_TICKETS = [
  {
    id: "FC-0001",
    company: "Football Counter",
    client: "MYJ",
    type: "Post",
    stageIndex: 2,
    assignee: "Aayush Dalvi",
    createdDate: "2026-07-02",
    status: "Active",
    history: [{ stage: "Ideation", person: "Chandler Dsilva", action: "Done", note: "", timestamp: "2026-07-02T10:00:00Z" }]
  },
  {
    id: "FC-0002",
    company: "Football Counter",
    client: "Mumbai Islanders",
    type: "Reel",
    stageIndex: 4,
    assignee: "Loknath Epili",
    createdDate: "2026-07-01",
    status: "Reworking",
    history: [{ stage: "Client approval", person: "Loknath Epili", action: "Rejected", note: "Need a faster edit tempo", timestamp: "2026-07-01T15:00:00Z" }]
  },
  {
    id: "KW-0001",
    company: "Kodewise",
    client: "Lupin AU",
    type: "AMC Request",
    stageIndex: 1,
    assignee: "Karan Thakur",
    createdDate: "2026-07-03",
    status: "Active",
    history: []
  }
];

export const DEFAULT_LOGS = [
  {
    id: "LOG-00001",
    company: "Kodewise",
    client: "Atharvability",
    category: "SEO",
    status: "Done",
    task: "Completed technical SEO audit and fixed backlink redirects",
    notes: "Traffic indexes updated",
    date: "2026-07-03"
  },
  {
    id: "LOG-00002",
    company: "Football Counter",
    client: "GIFA",
    category: "Photography / Field Day",
    status: "In Progress",
    task: "Covering matchday 4 photography at Cooperage Stadium",
    notes: "Upload scheduled for tonight",
    date: "2026-07-03"
  }
];
