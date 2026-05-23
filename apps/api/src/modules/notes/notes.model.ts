import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("NoteSource")
export class NoteSourceModel {
  @Field(() => String)
  excerpt!: string;

  @Field(() => String)
  label!: string;

  @Field(() => String)
  href!: string;

  @Field(() => String)
  citation!: string;

  @Field(() => String)
  abntReference!: string;

  @Field(() => String, { nullable: true })
  bibliographyId?: string;

  @Field(() => [String], { nullable: true })
  details?: string[];
}

@ObjectType("Note")
export class NoteModel {
  @Field(() => String)
  id!: string;

  @Field(() => String)
  type!: string;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  content!: string;

  @Field(() => [String])
  tags!: string[];

  @Field(() => String)
  createdAt!: string;

  @Field(() => String, { nullable: true })
  updatedAt?: string;

  @Field(() => NoteSourceModel, { nullable: true })
  source?: NoteSourceModel;
}
