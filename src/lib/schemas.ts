import { z } from 'zod'; // <-- Import zod

export const PersonaTypeEnum = z.enum([
  'text',
  'audio',
  'image',
  'speechcoach'
]);

// This is our new schema for the "Create Persona" form
export const CreatePersonaSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(), // Description is optional
  systemPrompt: z.string().min(10, { message: "Prompt must be at least 10 characters" }),
  type: PersonaTypeEnum,
});