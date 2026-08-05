import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Mistral } from '@mistralai/mistralai';

@Injectable()
export class MistralService {
  private client: Mistral;

  constructor(private readonly config: ConfigService) {
    this.client = new Mistral({
      apiKey: this.config.get<string>('MISTRAL_API_KEY') ?? '',
    });
  }

  async contactFromBuffer(buffer: Buffer, mimeType: string = 'image/jpeg') {
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    return this.contactFromImage(dataUrl);
  }

  async contactFromImage(image: string) {
    const response = await this.client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'system',
          content: this.systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              imageUrl: image,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new NotFoundException('Aucune réponse de Mistral');
    }

    const rawString = typeof content === 'string' ? content : JSON.stringify(content);
    const cleanedJson = rawString.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    try {
      const data = JSON.parse(cleanedJson);
      if (data && typeof data.phone === 'string') {
        let phone = data.phone.trim();
        if (phone.startsWith('+33')) {
          phone = '0' + phone.slice(3);
        } else if (phone.startsWith('33') && phone.length >= 10) {
          phone = '0' + phone.slice(2);
        }
        phone = phone.replace(/\+/g, '').trim();
        data.phone = phone;
      }
      return data;
    } catch {
      return { name: null, phone: null };
    }
  }

  async medicationFromBuffer(buffer: Buffer, mimeType: string = 'image/jpeg') {
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    return this.medicationFromImage(dataUrl);
  }

  async medicationFromImage(image: string) {
    const response = await this.client.chat.complete({
      model: 'mistral-large-latest',
      messages: [
        {
          role: 'system',
          content: this.medicationSystemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              imageUrl: image,
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new NotFoundException('Aucune réponse de Mistral');
    }

    const rawString = typeof content === 'string' ? content : JSON.stringify(content);
    const cleanedJson = rawString.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

    try {
      return JSON.parse(cleanedJson);
    } catch {
      return { name: null, frequency: null, durationDays: null, suggestedHours: null };
    }
  }

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



