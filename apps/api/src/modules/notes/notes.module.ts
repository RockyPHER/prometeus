import { Module } from "@nestjs/common";
import { NotesResolver } from "./notes.resolver";
import { NotesService } from "./notes.service";

@Module({
  providers: [NotesResolver, NotesService],
})
export class NotesModule {}
