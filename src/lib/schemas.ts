import { z } from 'zod';

export const PersonaTypeEnum = z.enum([
  'text',
  'audio',
  'image',
  'speechcoach'
]);

// schema for the "Create Persona" form
export const CreatePersonaSchema = z.object({
  name: z.string().min(3, { message: "Name must be at least 3 characters" }),
  description: z.string().optional(),
  systemPrompt: z.string().min(10, { message: "Prompt must be at least 10 characters" }),
  type: PersonaTypeEnum,
});