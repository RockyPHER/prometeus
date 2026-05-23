import { Field, ObjectType } from "@nestjs/graphql";

@ObjectType("Document")
export class DocumentModel {
  @Field(() => String)
  id!: string;

  @Field(() => String, { nullable: true })
  projectId?: string;

  @Field(() => String)
  title!: string;

  @Field(() => String)
  markdown!: string;

  @Field(() => String)
  createdAt!: string;

  @Field(() => String, { nullable: true })
  updatedAt?: string;
}
