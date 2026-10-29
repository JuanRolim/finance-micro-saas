# Migração do esquema de classificação

## Auditoria atual da cópia disponível

A cópia inspecionada é `PLANILHA VSCODE (3).xlsx`; o arquivo identificado
anteriormente como `(1)` não está disponível nesta pasta. A planilha publicada
no Google Sheets não foi aberta nesta auditoria.

Nas doze abas mensais, os cabeçalhos de classificação X:AJ estão na ordem
esperada pelo Apps Script. As colunas A:B e D:H também correspondem ao formato
que o script grava. A coluna C varia entre `PAGAMENTO`, `DESCRIÇÃO` e vazia;
o script grava C somente quando seu cabeçalho é `PAGAMENTO`, e mantém o
pagamento no campo de classificação AG para os outros formatos.

Foi encontrada uma inconsistência funcional na coluna G (`VALOR AJUSTADO`):
sete linhas com data e valor preenchidos não tinham fórmula: G2:G3 de
FEVEREIRO2026, G37 de SETEMBRO2026, G3 de OUTUBRO2026, G3 e G9 de
NOVEMBRO2026 e G5 de DEZEMBRO2026. A fórmula usada pela cópia é
`=IF(Bn="Saída",-ABS(Fn),ABS(Fn))`. Sem ela, resumos e análises que usam o
valor com sinal podem não refletir a movimentação.

O Apps Script agora valida os cabeçalhos principais, cria essa fórmula para
cada movimentação gravada e preenche fórmulas ausentes em linhas existentes
quando prepara ou utiliza a aba. Isso não apaga registros nem substitui valores
não vazios já existentes em G.

Também foi criada a cópia `PLANILHA VSCODE (3) - corrigida.xlsx`, preservando
intacto o arquivo original. Somente as sete células G listadas acima receberam
fórmulas. A cópia foi reaberta no Excel e conferida: nenhuma linha de
movimentação com data e valor ficou sem fórmula em G.

Para reparar as abas da planilha Google existente sem importar o XLSX, substitua
o código no editor do Apps Script, execute uma vez `prepararEstruturaClassificacao`
com a conta proprietária e publique uma nova versão do Web App. Essa função
prepara as abas mensais e preenche as fórmulas ausentes sem apagar o histórico.

## Histórico da migração do esquema

Em cada uma das doze abas mensais, foram preenchidas somente as células
AI1:AJ1:

| Coluna | Cabeçalho |
|---|---|
| AI | `QUANTIDADE_PARCELAS_V2` |
| AJ | `NUMERO_PARCELA_V2` |

Na migração original, antes da gravação, foi confirmada a ausência de valores
e fórmulas em AI2:AJ em todas as abas. Nenhum registro foi movido ou
reclassificado. A auditoria atual confirma que os cabeçalhos permanecem
presentes.

Esta alteração foi feita somente em `PLANILHA VSCODE (3).xlsx`. O arquivo
`(1)` mencionado anteriormente não está disponível nesta pasta e não foi
alterado. A planilha publicada no Google Sheets também não foi acessada.

## Reversão

Antes de reverter para uma versão antiga do Apps Script, restaure a cópia de
backup da planilha. Se necessário, remova apenas os cabeçalhos AI1:AJ1 das
abas mensais alteradas, depois de confirmar que nenhuma movimentação foi
gravada nessas colunas. Não remova as colunas inteiras, não altere G nem
AL:AM e não apague os dados históricos.

## Validação

Os testes automatizados verificam gravação do valor e da fórmula em G, reparo
de fórmula ausente, preservação da estrutura de classificação e rejeição de
cabeçalhos incompatíveis. A cópia XLSX local corrigida não apaga nem
reclassifica registros. A planilha publicada ainda precisa ser verificada
após a publicação da versão atualizada do Apps Script.
