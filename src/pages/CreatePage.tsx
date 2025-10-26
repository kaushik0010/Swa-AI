// src/pages/CreatePage.tsx
import { Footer } from '@/components/layout/Footer';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePersonas } from '@/hooks/usePersonas';
import { CreatePersonaSchema, PersonaTypeEnum } from '@/lib/schemas';
import type { Persona } from '@/lib/types';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import type z from 'zod';

type FormErrors = z.ZodFlattenedError<z.infer<typeof CreatePersonaSchema>>;
type PersonaType = z.infer<typeof PersonaTypeEnum>;

export default function CreatePage() {
  const navigate = useNavigate();
  const { addPersona } = usePersonas();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [personaType, setPersonaType] = useState<PersonaType>('text');

  const [errors, setErrors] = useState<FormErrors | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors(null);

    const result = CreatePersonaSchema.safeParse({
      name,
      description,
      systemPrompt,
      type: personaType
    });

    if (!result.success) {
      setErrors(result.error.flatten());
      toast.error("Please fix the errors in the form.");
      return;
    }

    // Create the new persona object
    const newPersona: Persona = {
      id: crypto.randomUUID(),
      name: result.data.name,
      description: result.data.description || "",
      systemPrompt: result.data.systemPrompt,
      type: result.data.type,
    };

    addPersona(newPersona);
    toast.success("Persona created successfully!");
    navigate('/dashboard'); // Go back to the dashboard
  };

  return (
    <>
      <Navbar />
      <main>
        <div className="container mx-auto max-w-2xl p-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Create New Persona</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ... (all your form fields are the same) ... */}
            <div>
              <Label htmlFor="name">Name</Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g., StoryWeaver" 
                aria-invalid={!!errors?.fieldErrors.name}
              />
              {errors?.fieldErrors.name && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.fieldErrors.name[0]}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="e.g., Helps me write fantasy stories" 
              />
            </div>

            <div>
              <Label htmlFor="prompt">System Prompt</Label>
              <Textarea
                id="prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="You are a helpful AI assistant who speaks like a pirate..."
                className="min-h-[200px]"
                aria-invalid={!!errors?.fieldErrors.systemPrompt}
              />
              {errors?.fieldErrors.systemPrompt && (
                <p className="text-sm text-red-400 mt-1">
                  {errors.fieldErrors.systemPrompt[0]}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="persona-type">Persona Type *</Label>
              <Select
                value={personaType}
                onValueChange={(value: string) => setPersonaType(value as PersonaType)}
              >
                <SelectTrigger id="persona-type" className="w-full mt-1 bg-slate-800 border-slate-700">
                  <SelectValue placeholder="Select a type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="text">Text (Standard Chat)</SelectItem>
                  <SelectItem value="audio">Multimodal (Audio Focus)</SelectItem>
                  <SelectItem value="image">Multimodal (Image Focus)</SelectItem>
                  <SelectItem value="speechcoach">Multimodal (Audio + Video)</SelectItem>
                </SelectContent>
              </Select>
              {/* Display validation error for type if needed */}
              {errors?.fieldErrors.type && (
                 <p className="text-sm text-red-400 mt-1">
                  Please select a persona type.
                </p>
              )}
            </div>
            <Button type="submit" className='cursor-pointer'>Save Persona</Button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}