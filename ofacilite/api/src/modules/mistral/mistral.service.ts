import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mistral } from '@mistralai/mistralai';

const MODEL = 'mistral-small-latest';

export interface ContactExtraction {
  name: string | null;
  phone: string | null;
}

export interface MedicationExtraction {
  name: string | null;
  frequency: number | null;
  durationDays: number | null;
  suggestedHours: number[] | null;
}

@Injectable()
export class MistralService {
  private readonly client: Mistral;

  constructor(config: ConfigService) {
    this.client = new Mistral({
      apiKey: config.getOrThrow<string>('MISTRAL_API_KEY'),
    });
  }

  async contactFromBuffer(
    buffer: Buffer,
    mimeType = 'image/jpeg',
  ): Promise<ContactExtraction> {
    return this.contactFromImage(this.toDataUrl(buffer, mimeType));
  }

  async contactFromImage(image: string): Promise<ContactExtraction> {
    const parsed = await this.completeToJson(this.systemPrompt, image);
    return {
      name: asStringOrNull(parsed?.name),
      phone: normalizePhone(asStringOrNull(parsed?.phone)),
    };
  }

  async medicationFromBuffer(
    buffer: Buffer,
    mimeType = 'image/jpeg',
  ): Promise<MedicationExtraction> {
    return this.medicationFromImage(this.toDataUrl(buffer, mimeType));
  }

  async medicationFromImage(image: string): Promise<MedicationExtraction> {
    const parsed = await this.completeToJson(
      this.medicationSystemPrompt,
      image,
    );
    const rawHours = parsed?.suggestedHours;
    const hours = Array.isArray(rawHours)
      ? rawHours
          .map((h) => Number(h))
          .filter((h) => Number.isInteger(h) && h >= 0 && h < 24)
      : null;
    return {
      name: asStringOrNull(parsed?.name),
      frequency: asNumberOrNull(parsed?.frequency),
      durationDays: asNumberOrNull(parsed?.durationDays),
      suggestedHours: hours && hours.length > 0 ? hours : null,
    };
  }

  /** Free-text question -> plain-text answer. Backs POST /mistral/ask. */
  async ask(question: string): Promise<{ answer: string }> {
    const response = await this.client.chat.complete({
      model: MODEL,
      messages: [
        { role: 'system', content: this.askSystemPrompt },
        { role: 'user', content: question },
      ],
    });
    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new NotFoundException('Aucune réponse de Mistral');
    }
    return {
      answer: typeof content === 'string' ? content : JSON.stringify(content),
    };
  }

  private toDataUrl(buffer: Buffer, mimeType: string): string {
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }

  /** Calls the model and parses its (possibly fenced) JSON reply into a record. */
  private async completeToJson(
    systemPrompt: string,
    image: string,
  ): Promise<Record<string, unknown> | null> {
    const response = await this.client.chat.complete({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: [{ type: 'image_url', imageUrl: image }] },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
      throw new NotFoundException('Aucune réponse de Mistral');
    }

    const raw = typeof content === 'string' ? content : JSON.stringify(content);
    const cleaned = raw
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/gi, '')
      .trim();

    try {
      const value: unknown = JSON.parse(cleaned);
      return value && typeof value === 'object'
        ? (value as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }

  private readonly askSystemPrompt = `
Réponds en texte simple, sans aucun formatage Markdown : pas de **gras**, pas
d'*italique*, pas de titres #, pas de listes à puces, pas de blocs de code.
Juste des phrases normales.
`;

  private readonly systemPrompt = `
Tu es un extracteur de données.

Analyse l'image et retourne UNIQUEMENT un objet JSON valide.

Format attendu :
{
  "phone": string | null,
  "name": string | null
}

Règles :
- Extrais le numéro de téléphone s'il existe.
- Ne mets JAMAIS le signe "+" devant le numéro de téléphone. Si le numéro est au format français (+33), remplace "+33" par "0" (exemple: "0612345678").
- Extrais le nom de la personne ou de l'entreprise s'il existe.
- Si une valeur est absente, mets null.
- Ne retourne aucun texte avant ou après le JSON.
`;

  private readonly medicationSystemPrompt = `
Tu es un expert médical et un extracteur de données de médicaments (boîtes de médicaments, ordonnances, notices).

Analyse l'image et retourne UNIQUEMENT un objet JSON valide.

Format attendu :
{
  "name": string | null,
  "frequency": number | null,
  "durationDays": number | null,
  "suggestedHours": number[] | null
}

Règles :
- Extrais le nom exact du médicament (avec dosage si présent, ex: "Doliprane 1000mg").
- Extrais la fréquence de prise quotidienne sous forme de chiffre (ex: 2 pour 2 fois par jour). Par défaut 1.
- Extrais la durée du traitement en jours (ex: 7 pour 7 jours). Si non mentionné, mets null.
- Propose des heures de prise adaptées sous forme de tableau d'heures entières (ex: [8] pour 1 prise, [8, 20] pour 2 prises, [8, 13, 20] pour 3 prises).
- Si une valeur est introuvable, mets null.
- Ne retourne aucun texte avant ou après le JSON.
`;
}

function asStringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function asNumberOrNull(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Strips a leading "+" and converts a French international prefix to the local
 * 0-prefixed form, matching the original behaviour.
 */
function normalizePhone(phone: string | null): string | null {
  if (!phone) return null;
  let p = phone.trim();
  if (p.startsWith('+33')) {
    p = '0' + p.slice(3);
  } else if (p.startsWith('33') && p.length >= 10) {
    p = '0' + p.slice(2);
  }
  return p.replace(/\+/g, '').trim() || null;
}
