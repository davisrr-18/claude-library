# Dependências vendorizadas

- `marked.esm.js`: marked 15.0.12 (MIT), build ESM copiado de `lib/marked.esm.js` do pacote npm `marked@15.0.12`.
  Integridade do tarball: `sha512-8dD6FusOQSrpv9Z1rdNMdlSgQOIP880DHqnohobOmYLElGEqAL/JvxvuxZO16r4HtjTlfPRDC1hbvxC9dPN2nA==`
- `marked.LICENSE.md`: licença do marked.

Para atualizar: baixe a nova versão com `npm pack marked@<versão>`, copie o arquivo e atualize esta nota.

- `highlight/`: highlight.js 11.11.1 (BSD-3-Clause), builds ESM `es/core.min.js` e `es/languages/*.min.js` do pacote npm `@highlightjs/cdn-assets@11.11.1`. Linguagens incluídas: javascript, typescript, bash, shell, json, yaml, markdown, python, xml, css, go, java, sql, diff, plaintext. Sem temas: as cores de sintaxe ficam em `src/components/Markdown/Markdown.module.css` (tokens `--cor-sintaxe-*`).
  Integridade do tarball: `sha512-VEPdHzwelZ12hEX18BHduqxMZGolcUsrbeokHYxOUIm8X2+M7nx5QPtPeQgRxR9XjhdLv4/7DD5BWOlSrJ3k7Q==`
