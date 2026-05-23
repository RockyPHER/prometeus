import type { Note, Tool } from "@prometeus/core";
import { getGraphqlEndpoint } from "@/lib/apollo/endpoint";

type GraphqlResponse<TData> = {
  data?: TData;
  errors?: Array<{ message: string }>;
};

async function requestGraphql<TData>(query: string): Promise<TData> {
  const response = await fetch(getGraphqlEndpoint(), {
    body: JSON.stringify({ query }),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });
  const payload = (await response.json()) as GraphqlResponse<TData>;

  if (!response.ok || payload.errors?.length || !payload.data) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return payload.data;
}

export async function getTools() {
  const data = await requestGraphql<{ tools: Tool[] }>(`
    query PrometeusTools {
      tools {
        id
        name
        description
        category
        status
        accentColor
        iconName
      }
    }
  `);

  return data.tools;
}

export async function getNotes() {
  const data = await requestGraphql<{ notes: Note[] }>(`
    query PrometeusNotes {
      notes {
        id
        type
        title
        content
        tags
        createdAt
        updatedAt
        source {
          excerpt
          label
          href
          citation
          abntReference
          bibliographyId
          details
        }
      }
    }
  `);

  return data.notes;
}
