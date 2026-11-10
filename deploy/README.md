# Deploy

Produção: `docker-compose.yml` desta pasta. Requer Docker com Compose v2.

O HTTPS fica a cargo de um proxy reverso no host; `Caddyfile.example` traz a
configuração de referência.

## .env, ao lado deste arquivo

| Variável | Obrigatória | Padrão |
|---|---|---|
| `PIXELBOOM_IMAGE_TAG` | não | `latest` |

O arquivo é opcional: sem ele a imagem `latest` é usada. `TZ` já vem no compose.

Permissão: `chmod 700` no diretório e `chmod 600` no `.env`.

## Subir

```bash
docker compose pull
docker compose up -d
docker compose ps
```

O serviço fica `healthy` quando o healthcheck da imagem responde.

## Atualizar

```bash
docker compose pull game
docker compose up -d game
```

## Rollback

`PIXELBOOM_IMAGE_TAG=<sha anterior>` no `.env`, depois `docker compose up -d game`.
As tags estão em `ghcr.io/davidcaetanor/pixelboom`.

## Logs

```bash
docker compose logs -f game
```

Rotação declarada no compose: 20 MB por arquivo, 5 arquivos. Para guardar uma
janela inteira, extraia antes de ela rolar:

```bash
docker compose logs --no-color --timestamps game > pixelboom.log
```
