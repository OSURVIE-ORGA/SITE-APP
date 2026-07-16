const API_CONFIG = {
  base_url: '', // Set your API URL here
};

/**
 * Service API singleton — équivalent du ApiService Flutter.
 * Communique avec l'API Ollama pour les questions et résumés.
 */
class ApiService {
  private static _instance: ApiService;
  private _baseUrl: string = API_CONFIG.base_url;

  static get instance(): ApiService {
    if (!ApiService._instance) {
      ApiService._instance = new ApiService();
    }
    return ApiService._instance;
  }

  setBaseUrl(url: string): void {
    this._baseUrl = url;
  }

  /** Poser une question à l'IA */
  async ask(question: string, language: string): Promise<string | null> {
    if (!this._baseUrl) return null;
    try {
      const response = await fetch(`${this._baseUrl}/api/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, language }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.answer ?? null;
      }
      return null;
    } catch {
      return null;
    }
  }

  /** Résumer un texte */
  async summarize(text: string, language: string): Promise<string | null> {
    if (!this._baseUrl) return null;
    try {
      const response = await fetch(`${this._baseUrl}/api/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
      });
      if (response.ok) {
        const data = await response.json();
        return data.summary ?? null;
      }
      return null;
    } catch {
      return null;
    }
  }
}

export default ApiService;
