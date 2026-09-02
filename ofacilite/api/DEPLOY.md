# Déploiement — ofacilite API

API NestJS (scan photo → contact / médicament via Mistral). Pas de base de
données. Cible : **un VPS Ubuntu sans nom de domaine** (IP `92.222.70.138`).
HTTPS quand même, via un hostname `sslip.io` + Caddy.

## Ce qui est en place

| Sujet | Détail |
|---|---|
| Validation d'env | `src/common/config/env.validation.ts` (Joi) — l'API ne démarre pas si une variable manque |
| Auth d'accès | En-tête `X-API-Key` obligatoire sur toutes les routes **sauf `/health`** (`ApiKeyGuard`, comparaison timing-safe) |
| Rate limit | `@nestjs/throttler` par IP (`THROTTLE_LIMIT` / `THROTTLE_TTL_MS`) |
| En-têtes | `helmet` (API) + HSTS / `nosniff` / `X-Frame-Options` / CSP (Caddy) |
| CORS | Ouvert par défaut (client = app mobile native, pas de CORS). Se verrouille via `CLIENT_URL` si un site web appelle l'API. |
| Uploads | multer en mémoire, taille plafonnée (`MAX_UPLOAD_MB`), type vérifié par **magic bytes**, nom de fichier généré côté serveur, servis avec `nosniff` + `Content-Disposition: inline` + CSP `default-src 'none'` |
| SSRF | `/mistral/image-url` refuse les URL non http(s) et les hôtes privés / loopback / métadonnées cloud |
| Rétention | cron horaire qui supprime les photos > `UPLOAD_TTL_HOURS` |
| Conteneur | image multi-stage, utilisateur non-root, `HEALTHCHECK` sur `/health` |
| TLS | Caddy obtient et renouvelle seul un certificat Let's Encrypt pour `SITE_HOST` |

## Le hostname sans domaine

`sslip.io` renvoie l'IP encodée dans le nom :

```
92-222-70-138.sslip.io  ->  92.222.70.138
```

C'est un vrai hostname public → Let's Encrypt peut émettre un certificat dessus.
L'app mobile appellera donc `https://92-222-70-138.sslip.io`.

## Prérequis serveur

```bash
ssh ubuntu@92.222.70.138

# Docker + compose plugin
sudo apt update && sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER   # puis se reconnecter

# Ouvrir 80 et 443 (nécessaires à Caddy pour le challenge ACME)
sudo ufw allow 80,443/tcp   # si ufw est actif
```

Rien d'autre à installer : pas de certbot, pas de nginx.

## Déploiement

```bash
# Récupérer le code sur le serveur (git clone / scp / rsync du dossier ofacilite/api)
cd ofacilite/api

cp .env.production.example .env.production
# éditer .env.production :
#   SITE_HOST        = 92-222-70-138.sslip.io   (déjà pré-rempli)
#   ACME_EMAIL       = une vraie adresse email
#   APP_URL          = https://92-222-70-138.sslip.io
#   API_KEY          = $(openssl rand -base64 32)
#   MISTRAL_API_KEY  = ta clé console.mistral.ai

docker compose -f docker-compose.prod.yml up -d --build

# Caddy met ~30 s à obtenir le certificat au 1er lancement. Vérifier :
curl -fsS https://92-222-70-138.sslip.io/health
docker compose -f docker-compose.prod.yml logs -f caddy   # si souci de cert
```

## Appels depuis l'app mobile

Base URL : `https://92-222-70-138.sslip.io`

Toutes les requêtes sauf `/health` portent :

```
X-API-Key: <valeur de API_KEY>
```

| Méthode | Route | Corps |
|---|---|---|
| POST | `/mistral/image-url` | `{ "url": "https://..." }` |
| POST | `/mistral/scan-photo` | `multipart/form-data`, champ `file` (image) |
| POST | `/mistral/scan-medication` | `multipart/form-data`, champ `file` (image) |

## Mise à jour

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Quand tu auras un vrai domaine

1. Faire pointer un enregistrement A du domaine vers `92.222.70.138`.
2. Dans `.env.production` : `SITE_HOST=api.ton-domaine.fr` et `APP_URL=https://api.ton-domaine.fr`.
3. `docker compose -f docker-compose.prod.yml up -d` — Caddy re-émet le certificat tout seul.

## Notes

- **Volume `caddy_data`** : contient les certificats. Ne pas le supprimer, sinon
  Caddy ré-émet à chaque redéploiement et peut taper la limite Let's Encrypt.
- **Volume `uploads`** : local à la machine. Pour du multi-instance, passer à un
  stockage objet (S3) — pas nécessaire ici.
- Postgres/Redis : aucun, l'API est sans état (hors fichiers `uploads`).
