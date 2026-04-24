# Matriz de viabilidade do OCR por documento

## Alta viabilidade (OCR funciona muito bem)

Documentos impressos em formato padronizado, com campos consistentes:

### Certificado de microchip

Já cobrimos. Número, data, vet, CRMV, clínica. Opus 4.7 resolve.

### Carteirinha de vacinação

Uma das mais valiosas. Extrai:

- Nome do pet, espécie, raça, sexo, data de nascimento, pelagem
- Nome + CPF do tutor
- Cada linha de vacina: nome do produto, fabricante, lote, validade, data de aplicação, vet que aplicou, CRMV
- Microchip (se colado lá)
- Castração (data, clínica)
- Vermifugações

Uma única foto de carteirinha bem preenchida alimenta **metade da ficha do pet**. Esse é o maior unlock de onboarding que o auExpert pode ter.

### Apólice de seguro pet

PDF ou foto da apólice extrai: operadora, número, início/fim de vigência, plano, cobertura, carência, valor da parcela, dados do pet segurado. Muito estruturado.

### Recibo/nota fiscal de dispositivo

(GPS, portinha, comedouro smart) — extrai marca, modelo, número de série, data de compra, garantia. Útil pra ativar garantia e saber quando trocar bateria.

### Embalagem de produto

(ração, medicamento, antiparasitário, vacina) — já é seu caso de uso do "Trocar ração". Extrai: marca, linha, fase de vida, peso, validade, lote, composição, tabela nutricional, princípio ativo. Vai muito bem com Opus 4.7.

### Receita veterinária impressa

Medicamento, dosagem, frequência, duração, vet, CRMV. Ótima pra alimentar lembretes.

### Resultado de exames laboratoriais

Hemograma, bioquímico, urinálise. Tabelas estruturadas. Valor enorme em extrair hemoglobina, creatinina, etc. pra linha do tempo de saúde.

### Pet passport / CIVZ

Rigidamente padronizado, fácil extração.

---

## Viabilidade média (OCR funciona, mas precisa supervisão)

### Receita manuscrita

Muito vet ainda prescreve à mão. Claude lida razoavelmente bem com manuscrita legível; mal com letra de médico clássica. Sempre mostra pro tutor confirmar.

### Atestado/declaração de saúde

Formato varia muito por clínica. Extração de texto livre + interpretação. Resultados bons mas exigem validação.

### Laudos de imagem

(raio-X, ultrassom) — o **laudo em texto** é extraível e muito valioso. A imagem em si não.

### Prontuário veterinário

Geralmente cópia da clínica, com histórico de consultas. Semiestruturado, extrai bem datas + queixas + diagnósticos.

### Fatura de pet shop / veterinária

Extrai valores, itens, data. Útil pra controle financeiro.

---

## Viabilidade baixa ou nula

### Dispositivo eletrônico em si

(GPS, câmera, comedouro) — não é documento. Não tem o que escanear. Aqui a integração tem que ser via **código de barras/QR da embalagem**, **deep link pro app do fabricante**, ou **entrada manual do número de série**.

### Coleiras, plaquinhas gravadas, tatuagem

Pode tirar foto e Claude lê o que está escrito, mas é pouca informação e geralmente o tutor já sabe.

### QR Code de tag de pet encontrado

Não é OCR, é leitura de QR (outra stack), e o dado vive no servidor do provedor (RG Pet, PetLink), não no QR.

---

## O padrão que isso sugere

Em vez de ter uma tela de cadastro por tipo de coisa, o auExpert pode ter **uma tela só: "Adicionar documento do pet"**. O fluxo:

```
┌────────────────────────────────────┐
│  📸 Adicionar documento            │
│                                    │
│  [ Tirar foto | Escolher da galeria│
│    | Importar PDF ]                │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│  Claude analisa e identifica:      │
│  "Isso parece uma carteirinha de   │
│   vacinação. Confirma?"            │
│                                    │
│  [✓ Sim]  [Mudar tipo]             │
└────────────────────────────────────┘
              ↓
┌────────────────────────────────────┐
│  Extração estruturada aparece em   │
│  cards editáveis por seção:        │
│  • Dados do pet (4 campos novos)   │
│  • Microchip (se presente)         │
│  • 7 vacinas encontradas           │
│  • Castração em 12/03/2024         │
│                                    │
│  [Salvar tudo]  [Revisar]          │
└────────────────────────────────────┘
```

Isso vira uma feature matadora de onboarding: **"tira uma foto da carteirinha e tá pronto"** em vez de 30 campos pra preencher na mão.

---

## Resumo visual da matriz

| Categoria | Viabilidade | Exemplos |
|---|---|---|
| 🟢 **Alta** | OCR resolve quase sozinho | Microchip, carteirinha, apólice, recibo de dispositivo, embalagem, receita impressa, exames, pet passport |
| 🟡 **Média** | OCR ajuda, tutor revisa | Receita manuscrita, atestado, laudo de imagem (texto), prontuário, fatura |
| 🔴 **Baixa/Nula** | Usar outra stack | Dispositivo físico (QR/barcode), coleira gravada, QR de tag externa |
