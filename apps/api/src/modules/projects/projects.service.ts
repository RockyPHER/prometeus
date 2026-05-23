import { Injectable } from "@nestjs/common";
import type { ProjectModel } from "./projects.model";

const projects: ProjectModel[] = [
  {
    id: "project-alpha",
    name: "Workspace Prometeus",
    description: "Projeto alpha para pesquisa, notas e escrita tecnica.",
    createdAt: "2026-05-20T00:00:00.000Z",
  },
];

@Injectable()
export class ProjectsService {
  findAll(): ProjectModel[] {
    return projects;
  }
}
