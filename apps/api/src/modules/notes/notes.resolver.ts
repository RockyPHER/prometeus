import { Query, Resolver } from "@nestjs/graphql";
import { NoteModel } from "./notes.model";
import { NotesService } from "./notes.service";

@Resolver(() => NoteModel)
export class NotesResolver {
  constructor(private readonly notesService: NotesService) {}

  @Query(() => [NoteModel])
  notes() {
    return this.notesService.findAll();
  }
}
