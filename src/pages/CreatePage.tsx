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
    navigate('/dashboard');
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen">
        <div className="container max-w-2xl mx-auto px-6 py-12">
          {/* Header Section */}
          <div className="space-y-3 mb-10">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              Create New Persona
            </h1>
            <p className="text-lg text-muted-foreground">
              Design your custom AI assistant with specific behaviors and expertise
            </p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Name Field */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base font-medium">
                Name *
              </Label>
              <Input 
                id="name" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                placeholder="e.g., StoryWeaver, Marketing Expert, Code Assistant" 
                className="bg-card border-border/60 focus:border-primary/50 transition-colors duration-200 h-12 text-base"
                aria-invalid={!!errors?.fieldErrors.name}
              />
              {errors?.fieldErrors.name && (
                <p className="text-sm text-destructive mt-2 font-medium">
                  {errors.fieldErrors.name[0]}
                </p>
              )}
            </div>

            {/* Description Field */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-base font-medium">
                Description
              </Label>
              <Input 
                id="description" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="e.g., Helps me write fantasy stories and develop characters"
                className="bg-card border-border/60 focus:border-primary/50 transition-colors duration-200 h-12 text-base"
              />
            </div>

            {/* Persona Type Field */}
            <div className="space-y-3">
              <Label htmlFor="persona-type" className="text-base font-medium">
                Persona Type *
              </Label>
              <Select
                value={personaType}
                onValueChange={(value: string) => setPersonaType(value as PersonaType)}
              >
                <SelectTrigger 
                  id="persona-type" 
                  className="w-full h-12 bg-card border-border/60 focus:border-primary/50 transition-colors duration-200 text-base"
                >
                  <SelectValue placeholder="Select a persona type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/60">
                  <SelectItem value="text" className="text-base py-3">Text (Standard Chat)</SelectItem>
                  <SelectItem value="audio" className="text-base py-3">Multimodal (Audio Focus)</SelectItem>
                  <SelectItem value="image" className="text-base py-3">Multimodal (Image Focus)</SelectItem>
                  <SelectItem value="speechcoach" className="text-base py-3">Multimodal (Audio + Video)</SelectItem>
                </SelectContent>
              </Select>
              {errors?.fieldErrors.type && (
                <p className="text-sm text-destructive mt-2 font-medium">
                  Please select a persona type.
                </p>
              )}
            </div>

            {/* System Prompt Field */}
            <div className="space-y-3">
              <Label htmlFor="prompt" className="text-base font-medium">
                System Prompt *
              </Label>
              <Textarea
                id="prompt"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                placeholder="Define your AI's personality, expertise, and behavior. Example: You are a creative writing assistant who specializes in fantasy fiction. You speak in an enthusiastic, imaginative tone and help users develop compelling stories and characters."
                className="min-h-60 bg-card border-border/60 focus:border-primary/50 transition-colors duration-200 text-base resize-vertical"
                aria-invalid={!!errors?.fieldErrors.systemPrompt}
              />
              {errors?.fieldErrors.systemPrompt && (
                <p className="text-sm text-destructive mt-2 font-medium">
                  {errors.fieldErrors.systemPrompt[0]}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <Button 
                type="submit" 
                className="w-full bg-gradient-primary hover:shadow-lg hover:scale-105 transition-all duration-200 h-12 text-base font-semibold cursor-pointer"
              >
                Create Persona
              </Button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}