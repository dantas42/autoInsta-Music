# autoInsta-Music

Gerador automatizado de Reels para Instagram com foco em conteudo musical. Recebe JSON, baixa assets, corta o audio e monta o video final em 9:16 usando `ffmpeg`.

## Requisitos

- Node.js 18+
- `ffmpeg` e `ffprobe` disponiveis no PATH
- `yt-dlp` disponivel no PATH para links do YouTube

Voce pode sobrescrever os binarios com:

- `FFMPEG_PATH`
- `FFPROBE_PATH`
- `YT_DLP_PATH`

## Estrutura

```text
/assets
  /tmp
/inputs
/outputs
/src
/templates
```

## Como usar

Instale as dependencias do sistema e rode:

```bash
node src/cli.js doctor
node src/cli.js generate sample-input.json
node src/cli.js batch batch-example.json
node src/cli.js web 3000
node src/cli.js clean
```

- `doctor` confere a presenca de `ffmpeg`, `ffprobe` e `yt-dlp`.
- `clean` apaga os arquivos temporarios de `assets/tmp`.

Os arquivos de entrada podem ser passados por nome quando estiverem em `inputs/` ou por caminho absoluto.

Para abrir a interface local, rode `node src/cli.js web 3000` e acesse `http://localhost:3000`.

Na interface:

- `Template` e aplicado no backend, inclusive nos defaults de texto e watermark
- `Preset visual` tambem e aplicado no render final, nao so no preview
- O servidor responde apenas em `127.0.0.1`

## Exemplo de input

```json
{
  "background": "https://servidor.com/background.jpg",
  "audio_source": "https://www.youtube.com/watch?v=xxxxxxxxxxx",
  "audio_start": 30,
  "duration": 20,
  "template": "default-reel",
  "texts": [
    {
      "content": "Nome da musica",
      "x": 540,
      "y": 400,
      "font_size": 48
    }
  ],
  "watermark": {
    "enabled": true,
    "content": "@nomedoinstagram",
    "position": "top-left"
  }
}
```

### Coordenadas de texto

Um texto aceita posicionamento manual por `x`/`y` e/ou posicionamento por `anchor` + `margin_x`/`margin_y`:

- Se `x` e `y` forem numeros, o texto e posicionado manualmente (por padrao, o ponto `(x, y)` e o canto superior esquerdo; use `manual_anchor` para mudar, ex.: `"center"`).
- Se apenas um deles for informado, o valor ausente e resolvido pelo `anchor`.
- O valor `"center"` em `x` ou `y` significa "nao fornecida" e tambem cai no `anchor`.

```json
{
  "content": "Nome da musica",
  "x": 540,
  "y": 400,
  "manual_anchor": "center"
}
```

## Recursos implementados

- CLI com comandos `generate`, `batch`, `doctor`, `web` e `clean`
- Interface web local com preview, editor visual e geracao pelo navegador
- Selecao de template pela interface (carregada da pasta `templates/`)
- Download de background por URL ou uso de arquivo local
- Download de audio do YouTube com `yt-dlp`
- Corte do trecho de audio com `ffmpeg`
- Render final em `1080x1920`
- Multiplos textos com posicao customizada e animacoes (fade, slide e pop-in via ASS)
- Presets visuais com `anchor`, margens, sombra, box, overlay e watermark refinado
- Presets de genero com paleta de cores
- Badge de origem da musica (Spotify/YouTube/SoundCloud)
- Watermark configuravel
- Templates reutilizaveis em `templates/`
- Execucao em lote por arquivo JSON (falha de um job nao derruba o lote)
- Nome automatico do arquivo de saida, sem sobrescrever arquivos existentes
- Limpeza automatica de temporarios com mais de 24h

## Layout de texto

Cada texto pode usar presets e ancoras para simplificar o posicionamento:

```json
{
  "content": "Nome da musica",
  "style_preset": "hero",
  "anchor": "bottom-center",
  "margin_y": 340
}
```

Presets de texto disponiveis:

- `hero`
- `hero_card`
- `hero_glass`
- `hero_neon`
- `hero_editorial`
- `hero_lower`
- `hero_lower_right`
- `hero_poster`
- `subtitle`
- `handle`
- `watermark`
- `source_badge`

Presets visuais da interface:

- `spotlight`
- `bold-card`
- `midnight-glass`
- `neon-pulse`
- `minimal`
- `editorial`
- `lower-third`
- `lower-third-right`
- `poster`

Comportamento de templates:

- `template.defaults` define defaults globais como `duration`, `fps`, `text` e `watermark`
- `template.texts` define "slots" base: cada slot e mesclado com o texto correspondente do input (por posicao), herdando `style_preset`, ancora e margens do slot
- Slots sem conteudo sao descartados; o input pode ter mais textos do que slots
- O render final mescla `template`, `visual_preset`, `genre_preset` e overrides do input antes de chamar o FFmpeg
- Precedencia de estilo: input > preset visual/genre > slot do template > defaults do template

Anchors suportadas:

- `top-left`
- `top-center`
- `top-right`
- `middle-left`
- `middle-right`
- `center`
- `bottom-left`
- `bottom-center`
- `bottom-right`

## Formato de batch

```json
{
  "jobs": [
    {
      "input": "sample-input.json"
    },
    {
      "input": "sample-input.json",
      "overrides": {
        "output_name": "variacao-2"
      }
    },
    {
      "background": "https://exemplo.com/bg.jpg",
      "audio_source": "https://www.youtube.com/watch?v=yyyyyyyyy",
      "texts": [
        { "content": "Musica inline do batch" }
      ]
    }
  ]
}
```

## Testes e verificacao

Sem dependencias externas, usando o runner nativo do Node:

```bash
npm test
npm run check
```

- `npm test` roda os testes unitarios (`node:test`) em `test/`.
- `npm run check` valida a sintaxe de todo o codigo em `src/`.

## Limitacoes desta versao

- O upload automatico para Instagram ainda nao foi implementado
- A deteccao de imagem/video do background e baseada na extensao do arquivo (com fallback pelo `Content-Type` em URLs)

## Proximos passos naturais

- Integrar fila de processamento com persistencia
- Adicionar presets visuais mais ricos
- Incluir upload em Buffer ou Instagram Graph API
- Criar painel web para gestao dos jobs