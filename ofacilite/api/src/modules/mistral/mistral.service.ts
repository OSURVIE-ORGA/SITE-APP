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
}


