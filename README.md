# Elias & Mariana — Nosso sim

Site de casamento em React 18, TypeScript, Vite, Tailwind CSS, Motion, Lucide e QRCode. Conteúdo em português, responsivo, sem cadastro, banco de dados ou backend.

## Executar

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

## Personalizar

- `src/data/wedding.ts`: nomes, data com fuso explícito, igreja, fotografia e dados Pix. O campo `couplePhoto` está vazio: o briefing não forneceu foto do casal. A abertura usa uma imagem de decoração encontrada na conversa compartilhada; insira a foto autorizada em `public/images/` e preencha esse campo para substituí-la.
- `src/data/gifts.json`: catálogo independente, valores em centavos, categorias, ordem, imagem e disponibilidade. Adicione objetos com IDs exclusivos para novos presentes.
- `public/images/`: dez imagens de presentes disponíveis nas respostas da conversa compartilhada, padronizadas em telas quadradas de 1080 px e otimizadas em WebP. Os anexos originais aparecem como “Enviou uma imagem” na versão pública e não expõem os arquivos; foram utilizadas as imagens ilustrativas acessíveis na mesma conversa. A ampliação não recupera detalhes inexistentes no original.
- `assets-sources.json`: URLs de origem das imagens, todas provenientes do link fornecido pelo usuário. `assets-originals/` conserva os arquivos baixados.

## Pix

O código BR Code é gerado localmente conforme o [Manual de Padrões para Iniciação do Pix do Banco Central](https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf), com valor informado pelo visitante, chave CPF fornecida, nome normalizado, identificador do presente e CRC16-CCITT-FALSE. O QR Code é gerado no navegador; os dados não são enviados a serviços de QR Code. A chave está tecnicamente disponível no código de pagamento e no frontend, como previsto no briefing.

A cidade do recebedor no BR Code está configurada como `SAO PAULO`, valor inicial editável em `wedding.ts`; confirme a cidade com o titular antes da distribuição final. O nome exibido para conferência é Elias Kalil Maniá Saffi, Nubank. A verificação local valida os dígitos do CPF e a estrutura do código, mas não consulta o DICT nem comprova o vínculo bancário. Antes de distribuir aos convidados, leia o QR com um banco e confira o recebedor. Não foi realizada transação de teste.

O botão “Já fiz meu Pix” mostra um agradecimento e informa que o site não confirma pagamentos. Não há confirmação automática, armazenamento de contribuições, estoque ou entrega de produtos. A contribuição é livre a partir de R$ 0,01. A chave não precisa ser substituída por credenciais bancárias.

## Hospedagem

O build estático fica em `dist/`. O manifesto de Sites está em `.openai/hosting.json`. A hospedagem Sites usa HTTPS. Novos Sites começam privados; o acesso de convidados deve ser configurado pelo proprietário quando desejar compartilhar.

Alternativa Docker:

```sh
docker compose up --build -d
```

Abre em `http://localhost:8080`. Em hospedagem própria, coloque o Nginx atrás de um proxy com certificado HTTPS. O contêiner não inclui credenciais ou serviços bancários.

## Verificações

Os testes verificam o vetor conhecido de CRC, interpretação de valores brasileiros, dígitos do CPF, campos TLV do BR Code, centavos e rejeição de entradas inválidas. Build inclui verificação de tipos. O calendário usa o horário 16h30 de São Paulo (19h30 UTC), em 17/04/2027. Busca ignora acentos, categorias podem ser combinadas com pesquisa e valores podem ser ordenados. Janela usa `dialog` nativo com foco contido, Escape, retorno do foco e bloqueio de rolagem; animações respeitam a preferência de movimento reduzido.
