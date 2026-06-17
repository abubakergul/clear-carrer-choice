// Where the student is in their education. Captured per-conversation (school /
// college / graduating / graduated) and used to keep insights and explorations
// grounded in what they can actually reach right now.

export function stageLabel(stage: string | null | undefined): string {
  switch (stage) {
    case "school":
      return "still in school, figuring out what to study or aim for";
    case "college":
      return "in college/university, mid-degree and questioning the path";
    case "graduating":
      return "in their final year, about to finish, next step unclear";
    case "graduated":
      return "already graduated, direction still unclear";
    default:
      return "a student unsure about their direction";
  }
}

// What KIND of exploration actually fits a student at this stage. A school student
// has never been in a college lab, so "try your class" is meaningless to them —
// they can only observe or imagine the real job. A college student can lean on
// classes, labs, and seniors in their department.
export function stageExplorationGuidance(stage: string | null | undefined): string {
  switch (stage) {
    case "school":
      return `This user is still in SCHOOL. They have NOT taken college classes or labs in these fields — never build an exploration around "your class", "your lab", or "your professor" in the field, because they have none. Explore each field by OBSERVING or IMAGINING the real JOB (a real day in the role, a thought experiment about the work) or by reflecting on things they've already done — never by referencing coursework they haven't reached.`;
    case "college":
    case "graduating":
      return `This user is in COLLEGE/UNIVERSITY. You CAN reference their classes, labs, coursework, clubs, and seniors in their department or the year above — these are real and reachable, and make great explorations alongside job-focused ones (e.g. "recall how your last relevant class actually felt" or "message one senior in this major").`;
    case "graduated":
      return `This user has already GRADUATED. Classes are behind them — ground explorations in the real WORK and real workplaces (a real day in the role, reaching out to someone doing the job, observing the day-to-day), not in schooling.`;
    default:
      return `Ground the exploration in what this student can actually reach right now — their own head, things they've already done, or the real day-to-day of the job — not in schooling they may not have access to.`;
  }
}
