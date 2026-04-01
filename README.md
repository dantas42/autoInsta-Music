# autoInsta-Music

Gerador automatizado de Reels para Instagram com foco em conteudo musical. A primeira versao do projeto recebe JSON, baixa assets, corta o audio e monta o video final em 9:16 usando `ffmpeg`.

## Requisitos

- Node.js 18+
- `ffmpeg` disponivel no PATH
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
```

Os arquivos de entrada podem ser passados por nome quando estiverem em `inputs/` ou por caminho absoluto.

Para abrir a interface local, rode `node src/cli.js web 3000` e acesse `http://localhost:3000`.

Na interface:

- `Template` agora e aplicado no backend de verdade, inclusive nos defaults de texto e watermark
- `Preset visual` tambem e aplicado no render final, nao so no preview

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
      "x": "center",
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

## Recursos implementados

- CLI com comandos `generate`, `batch` e `doctor`
- Interface web local com preview e geracao pelo navegador
- Download de background por URL ou uso de arquivo local
- Download de audio do YouTube com `yt-dlp`
- Corte do trecho de audio com `ffmpeg`
- Render final em `1080x1920`
- Multiplos textos com posicao customizada
- Presets visuais com `anchor`, margens, sombra, box e watermark refinado
- Watermark configuravel
- Templates reutilizaveis em `templates/`
- Execucao em lote por arquivo JSON
- Nome automatico do arquivo de saida

## Layout de texto

Agora cada texto pode usar presets e ancoras para simplificar o posicionamento:

```json
{
  "content": "Nome da musica",
  "style_preset": "hero",
  "anchor": "bottom-center",
  "margin_y": 340
}
```

Presets disponiveis:

- `hero`
- `hero_card`
- `hero_glass`
- `hero_neon`
- `subtitle`
- `handle`
- `watermark`

Presets visuais da interface:

- `spotlight`
- `bold-card`
- `midnight-glass`
- `neon-pulse`
- `minimal`

Comportamento de templates:

- `template.defaults` define defaults globais como `duration`, `fps`, `text` e `watermark`
- `template.texts` entra como base e pode ser complementado pelos textos enviados no JSON ou pela interface
- o render final mescla `template`, `visual_preset` e overrides do input antes de chamar o FFmpeg

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
    }
  ]
}
```

## Limitacoes desta versao

- O upload automatico para Instagram ainda nao foi implementado
- Animacoes de texto ainda nao foram adicionadas
- A deteccao de imagem/video do background esta baseada na extensao do arquivo

## Proximos passos naturais

- Integrar fila de processamento com persistencia
- Adicionar presets visuais mais ricos
- Incluir upload em Buffer ou Instagram Graph API
- Criar painel web para gestao dos jobs
