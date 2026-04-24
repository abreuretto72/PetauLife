# Imagens do site auexpert.com.br

Pasta com as imagens estáticas usadas nos mockups e no site.

## Arquivos esperados

| Arquivo        | Onde aparece                                                    | Dimensões recomendadas |
|----------------|------------------------------------------------------------------|-----------------------|
| `mana.jpg`     | Avatar da Mana no mockup do Hub, thumbnail no mockup do Diário, foto hero no mockup de Análise de Foto | 800×800 (quadrada) ou 1200×900 (landscape) — CSS faz o crop |
| `pico.jpg`     | Avatar do Pico quando adicionarmos um segundo pet visível       | mesmo formato         |

## Regras de otimização

- Formato: JPG (qualidade 82-88) ou WebP (qualidade 80). WebP prefere — carregamento mais rápido.
- Tamanho máximo: ~150 KB por imagem (comprimir antes de subir).
- Orientação: retrato ou paisagem — o CSS usa `background-size: cover` e `background-position: center`, então o que importa é que o rosto do pet fique no centro do quadro.
- Otimizar em https://squoosh.app antes de subir.

## Como substituir

Salve os arquivos aqui com os nomes exatos acima e faça o deploy. O site já está referenciando `/images/mana.jpg` e `/images/pico.jpg` nos mockups.
